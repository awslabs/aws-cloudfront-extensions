import logging
import uuid
import boto3
import os
import json
import subprocess
import urllib
import re
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.event_handler import APIGatewayRestResolver
from job_table_utils import create_job_info, update_job_cert_completed_number, update_job_cloudfront_distribution_created_number

app = APIGatewayRestResolver()

# certificate need to create in region us-east-1 for cloudfront to use
acm = boto3.client('acm', region_name='us-east-1')
step_function = boto3.client('stepfunctions')

LAMBDA_TASK_ROOT = os.environ.get('LAMBDA_TASK_ROOT')
JOB_INFO_TABLE_NAME = os.environ.get('JOB_INFO_TABLE')
JOB_STATUS_TABLE_NAME = os.environ.get('JOB_STATUS_TABLE')

logger = logging.getLogger('boto3')
logger.setLevel(logging.INFO)

stepFunctionArn = os.environ.get('STEP_FUNCTION_ARN')

# add execution path
os.environ['PATH'] = os.environ['PATH'] + ':' + os.environ['LAMBDA_TASK_ROOT']

certificate = {
    'CertificateArn': 'arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012',
    'DomainName': 'www.example.com',
    'SubjectAlternativeNames': ['www.example.com', 'www.example.org'],
    'CertPem': '',
    'PrivateKeyPem': '',
    'ChainPem': ''
}

FILE_FOLDER = '/tmp'
PEM_FILE = FILE_FOLDER + "/cert.pem"
_GET_FILE = lambda x: open(os.path.join(FILE_FOLDER, x), "rb").read()


def _tag_certificate(certArn, taskToken):
    """[summary]

    Args:
        certificate ([type]): [description]
        taskToken ([type]): [description]
    """
    logger.info('Tagging certificate %s with task_token %s', certArn, taskToken)
    acm.add_tags_to_certificate(
        CertificateArn=certArn,
        Tags=[
            {
                'Key': 'task_token',
                'Value': taskToken
            }
        ]
    )


def request_certificate(certificate):
    """[summary]

    Args:
        certificate ([type]): [description]

    Returns:
        [type]: [description]
    """
    logger.info('Requesting certificate for %s', certificate['DomainName'])
    resp = acm.request_certificate(
        DomainName=certificate['DomainName'],
        ValidationMethod='DNS',
        SubjectAlternativeNames=certificate['SubjectAlternativeNames'],
        Options={
            'CertificateTransparencyLoggingPreference': 'ENABLED'
        },
        Tags=[
            {
                'Key': 'issuer',
                'Value': certificate['DomainName']
            }
        ]
    )
    logger.info('Certificate creation response: %s', resp)
    return resp


# domain name validation
def isValidDomain(str):
    """_summary_

    Args:
        str (_type_): _description_

    Returns:
        _type_: _description_
    """
    if (str == None) or str.count('.') < 2:
        return False

    # accept domain format:
    # 1.mydomain.com
    # 1.2.mydomain.com
    # www.domain.com
    # *.domain.com

    # deny domain format:
    # www.mydom-ain-.com.uk
    # bad_domain.com
    # bad:domain.com
    # http://only.domains.com
    regex = r"^(\*\.)*(((?!-))(xn--|_{1,1})?[a-z0-9-]{0,61}[a-z0-9]{1,1}\.)*(xn--)?([a-z0-9][a-z0-9\-]{0,60}|[a-z0-9-]{1,30}\.[a-z]{2,})$"
    p = re.compile(regex)

    if (re.search(p, str)):
        return True
    else:
        return False


# check if valid ssl certificate
def isValidCertificate(certificate):
    """[summary]
    Args:
        certificate ([type]): [description]
    
    Returns:
        [type]: [description]
    """
    logger.info('Validating certificate for %s', certificate['DomainName'])
    resp = acm.describe_certificate(
        CertificateArn=certificate['CertificateArn']
    )
    logger.info('Certificate validation response: %s', resp)
    return resp


# convert string into binary file
def convert_string_to_file(string, file_name):
    """[summary]
    Args:
        string ([type]): [description]
        file_name ([type]): [description]
    
    Returns:
        [type]: [description]
    """
    logger.info('Converting string to file %s', file_name)
    with open(file_name, 'wb') as f:
        f.write(string.encode('utf-8'))


# get domain name from certificate
def get_domain_list_from_cert():
    """[summary]
    Validate certificate created by certbot with command below:
    Args:
        certificate ([type]): refer to https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/CNAMEs.html#alternate-domain-names-requirements for certificate requirement

    Returns:
        [type]: [description]
    """
    domainList = []
    # decrypt pem info using 1) https://cryptography.io/en/latest/; 2) openssl (https://chromium.googlesource.com/chromium/src/+/refs/heads/main/net/tools/logger.info_certificates.py); 3) openssl (https://www.sslshopper.com/article-most-common-openssl-commands.html)
    try:
        resp = subprocess.check_output(['openssl', 'x509', '-text', '-noout', '-in', str(PEM_FILE)],
                                       stderr=subprocess.PIPE, encoding='utf-8')
        logger.info('openssl x509 -text -noout -in %s: %s', PEM_FILE, resp)
        # filter strings like 'DNS:*.ssl2.keyi.solutions.aws.a2z.org.cn, DNS:ssl3.keyi.solutions.aws.a2z.org.cn' in response
        resp = resp.split('\n')
        resp = [x for x in resp if 'DNS:' in x]
        resp = resp[0].split(',')

        # iterate all DNS names
        for x in resp:
            # remove 'DNS:'
            x = x.replace('DNS:', '').strip()
            logger.info('domain name %s', x)
            # check if DNS name is valid and return domain list if valid
            if isValidDomain(x):
                domainList.append(x)
            else:
                logger.error('invalid domain name %s', x)
    except Exception as e:
        logger.error('error validating certificate: %s', e)
        raise Exception('error validating certificate: %s', str(e))
    return domainList


# import existing certificate into ACM
def import_certificate(certificate):
    """[summary]
    Import cerfiticate created by certbot with command below:
    sudo certbot certonly --manual --preferred-challenges dns -d "*.apex.keyi.solutions.aws.a2z.org.cn"
    
    And upload to ACM with commands below:
    sudo aws acm import-certificate --certificate fileb:///etc/letsencrypt/live/ssl1.keyi.solutions.aws.a2z.org.cn/cert.pem --certificate-chain fileb:///etc/letsencrypt/live/ssl1.keyi.solutions.aws.a2z.org.cn/chain.pem --private-key fileb:///etc/letsencrypt/live/ssl1.keyi.solutions.aws.a2z.org.cn/privkey.pem --region us-east-1

    Args:
        certificate ([type]): refer to https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/CNAMEs.html#alternate-domain-names-requirements for certificate requirement

    Returns:
        [type]: [description]
    """
    logger.info('start to importing existing cerfification %s', certificate)
    try:
        resp = acm.import_certificate(
            Certificate=certificate['CertPem'],
            PrivateKey=certificate['PrivateKeyPem'],
            CertificateChain=certificate['ChainPem'],
            # CertificateArn=certificate['CertificateArn'],
            Tags=[
                {
                    'Key': 'issuer',
                    # strip * if exist due to regular expression pattern: [\p{L}\p{Z}\p{N}_.:\/=+\-@]* in tag
                    'Value': certificate['DomainName'].replace('*.', '')
                }
            ]
        )
    except Exception as e:
        logger.info('error importing certificate: %s', e)
        return None

    logger.info('certificate imported: %s', json.dumps(resp))
    return resp


# invoke step function with input
def invoke_step_function(arn, input):
    """[summary]
    Args:
        input ([type]): [description]
    
    Returns:
        [type]: [description]
    """
    logger.info('start to invoke step function with input %s', input)
    try:
        resp = step_function.start_execution(
            stateMachineArn=arn,
            input=json.dumps(input)
        )
        return resp
    except Exception as e:
        logger.info('error invoking step function: %s', e)
        return None

    logger.info('step function invoked: %s', resp)


# check if san list provided is subset of existing san list
def is_subset(sanList, wildcardSanDict):
    """[summary]
    Args:
        sanList ([type]): [description]
        existingSanList ([type]): [description]
    
    Returns:
        [type]: [description]
    """
    # iterate wildcard san dict
    logger.info('start to check if san list %s is subset of wildcard san dict %s', sanList, wildcardSanDict)
    for key, value in wildcardSanDict.items():
        # wildcard search in string with regular expression
        # regex = re.compile(r'.*\.risetron.cn') key is *.risetron.cn
        regex = re.compile(r'.*\.{}'.format(key.replace('*.', '')))
        matches = [san for san in sanList if re.match(regex, san)]
        logger.info('regex: %s, matches %s', regex, matches)
        if len(matches) == len(sanList):
            return value
        else:
            continue
    return None


# check if wildcard string in san list
def is_wildcard(sanList):
    """[summary]
    Args:
        sanList ([type]): [description]
    
    Returns:
        [type]: [description]
    """
    # iterate san list
    for san in sanList:
        # check if wildcard string
        if san.startswith('*'):
            return san
        else:
            continue
    return None


@app.get("/ssl_for_saas/cert_list")
def cf_ssl_for_saas():
    # first get distribution List from current account
    acm_client = boto3.client('acm')
    response = acm_client.list_certificates()

    result = []
    for acmItem in response['CertificateSummaryList']:

        resp = acm_client.describe_certificate(
            CertificateArn=acmItem['CertificateArn']
        )
        certInfo = resp['Certificate']
        logger.info(certInfo)
        tmp_acm = {}
        tmp_acm['CertificateArn'] = certInfo['CertificateArn']
        tmp_acm['DomainName'] = certInfo['DomainName']
        tmp_acm['SubjectAlternativeNames'] = ",".join(certInfo['SubjectAlternativeNames'])
        tmp_acm['Issuer'] = certInfo['Issuer']
        tmp_acm['CreatedAt'] = json.dumps(certInfo['CreatedAt'], indent=4, sort_keys=True, default=str)
        if 'IssueAt' in certInfo:
            tmp_acm['IssuedAt'] = json.dumps(certInfo['IssuedAt'], indent=4, sort_keys=True, default=str)
        else:
            tmp_acm['IssuedAt'] = ""
        tmp_acm['Status'] = certInfo['Status']
        if 'NotBefore' in certInfo:
            tmp_acm['NotBefore'] = json.dumps(certInfo['NotBefore'], indent=4, sort_keys=True, default=str)
        else:
            tmp_acm['NotBefore'] = ""
        if 'NotAfter' in certInfo:
            tmp_acm['NotAfter'] = json.dumps(certInfo['NotAfter'], indent=4, sort_keys=True, default=str)
        else:
            tmp_acm['NotAfter'] = ""
        tmp_acm['KeyAlgorithm'] = certInfo['KeyAlgorithm']

        logger.info(tmp_acm)
        result.append(tmp_acm)

    return result


# {
#   "acm_op": "create",
#   "dist_aggregate": "false",
#   "auto_creation": "true",
#   "enable_cname_check": "true",
#   "cnameList": [
#     {
#         "domainName": "cdn2.risetron.cn",
#         "sanList": [
#             "cdn3.risetron.cn"
#         ],
#         "originsItemsDomainName": "risetron.s3.ap-east-1.amazonaws.com"
#     },
#     {
#         "domainName": "cdn3.risetron.cn",
#         "sanList": [
#             "cdn4.risetron.cn"
#         ],
#         "originsItemsDomainName": "risetron.s3.ap-east-1.amazonaws.com"
#     }
#   ],
#   "pemList": [
#     {
#         "CertPem": "xx",
#         "PrivateKeyPem": "xx",
#         "ChainPem": "xx"
#     },
#     {
#         "CertPem": "xx",
#         "PrivateKeyPem": "xx",
#         "ChainPem": "xx"
#     }
#   ]
# }
@app.post("/ssl_for_saas")
def cf_ssl_for_saas():
    """
    :param event:
    :param context:
    """
    body: dict = app.current_event.json_body
    logger.info("Received event: " + json.dumps(body))

    # Get the parameters from the event
    acm_op = body['acm_op']
    dist_aggregate = body['dist_aggregate']
    auto_creation = body['auto_creation']
    domain_name_list = body['cnameList']
    enable_cname_check = body['enable_cname_check']

    if auto_creation == "false":
        if acm_op == "create":
            create_acm_cert(dist_aggregate, domain_name_list)

        # note dist_aggregate is ignored here, we don't aggregate imported certificate
        elif acm_op == "import":
            import_acm_cert(body, enable_cname_check)

        return {
            'statusCode': 200,
            'body': json.dumps('Certificate Create/Import Successfully without invoke step function')
        }
    elif auto_creation == "true":
        # invoke existing step function
        logger.info('auto_creation is true, invoke step function')
        resp = invoke_step_function(stepFunctionArn, body)
        logger.info(resp)
        return {
            'statusCode': 200,
            'body': json.dumps(resp['executionArn'])
        }
    else:
        logger.info('auto_creation is not true or false')
        return {
            'statusCode': 400,
            'body': 'auto_creation is not true or false'
        }


def lambda_handler(event, context):
    return app.resolve(event, context)


def create_acm_cert(dist_aggregate, domain_name_list):
    # aggregate certificate if dist_aggregate is true
    if dist_aggregate == "true":
        request_aggregate_cert(domain_name_list)

    # otherwise, create certificate for each cname
    else:
        for cname_index, cname_value in enumerate(domain_name_list):
            certificate['DomainName'] = cname_value['domainName']
            certificate['SubjectAlternativeNames'] = cname_value['sanList']

            resp = request_certificate(certificate)
            logger.info('Certificate creation response: %s', resp)


def import_acm_cert(body, enable_cname_check):
    # iterate pemList array from event
    for pem_index, pem_value in enumerate(body['pemList']):

        certificate['CertPem'] = str.encode(pem_value['CertPem'])
        certificate['PrivateKeyPem'] = str.encode(pem_value['PrivateKeyPem'])
        certificate['ChainPem'] = str.encode(pem_value['ChainPem'])

        convert_string_to_file(pem_value['CertPem'], PEM_FILE)
        _domainList = get_domain_list_from_cert()
        certificate['SubjectAlternativeNames'] = _domainList
        certificate['DomainName'] = _domainList[0] if _domainList else ''

        # validation for certificate
        if enable_cname_check == 'true':
            if body['cnameList'][pem_index]['domainName'] == certificate['DomainName']:
                logger.info("Domain name {} matches certificate domain name {}".format(
                    body['cnameList'][pem_index]['domainName'], certificate['DomainName']))
            else:
                logger.info('enable_cname_check is true, checking domain name')
                logger.error("Domain name {} does not match certificate domain name {}".format(
                    body['cnameList'][pem_index]['domainName'], certificate['DomainName']))
                raise Exception("Domain name {} does not match certificate domain name {}".format(
                    body['cnameList'][pem_index]['domainName'], certificate['DomainName']))
                continue
        else:
            logger.info('enable_cname_check is false, ignoring the cname check for domain {}'.format(
                body['cnameList'][pem_index]['domainName']))
        resp = import_certificate(certificate)


def request_aggregate_cert(domain_name_list):
    wildcard_cert_dict = {}
    for cname_index, cname_value in enumerate(domain_name_list):
        certificate['DomainName'] = cname_value['domainName']
        certificate['SubjectAlternativeNames'] = cname_value['sanList']

        # TBD, add cname_value['domainName'] to wildcard_cert_dict
        wildcard_san = is_wildcard(cname_value['sanList'])
        logger.info('wildcard_san: %s', wildcard_san)
        if wildcard_san:
            resp = request_certificate(certificate)
            logger.info('Certificate creation response: %s', resp)
            # update wildcard certificate dict
            wildcard_cert_dict[wildcard_san] = resp["CertificateArn"]
        else:
            parent_cert_arn = is_subset(cname_value['sanList'], wildcard_cert_dict)
            logger.info('parent_cert_arn: %s', parent_cert_arn)
            if parent_cert_arn:
                # don't create certificate if parent certificate exists
                continue
            resp = request_certificate(certificate)
            logger.info('Certificate creation response: %s', resp)
