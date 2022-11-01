import logging
from time import sleep
import uuid
import boto3
import os
import json
import re
import time
import subprocess
import random
import string
import copy
from datetime import datetime
from cerberus import Validator
from job_table_utils import create_job_info, update_job_cert_completed_number, update_job_cloudfront_distribution_created_number, update_job_field
from tenacity import retry, wait_fixed, stop_after_attempt, retry_if_exception_type
from requests import exceptions

from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.event_handler import AppSyncResolver

LAMBDA_TASK_ROOT = os.environ.get('LAMBDA_TASK_ROOT')

# tracer = Tracer(service="ssl_for_saas_appsync_resolver")
logger = Logger(service="ssl_for_saas_appsync_resolver")
acm = boto3.client('acm', region_name='us-east-1')
stepFunctionArn = os.environ.get('STEP_FUNCTION_ARN')
JOB_INFO_TABLE_NAME = os.environ.get('JOB_INFO_TABLE')
STATUS_UPDATE_LAMBDA_FUNCTION = os.environ.get('STATUS_UPDATE_LAMBDA_FUNCTION')
# get sns topic arn from environment variable
snsTopicArn = os.environ.get('SNS_TOPIC')

app = AppSyncResolver()

step_function = boto3.client('stepfunctions')
sns_client = boto3.client('sns')
lambda_client = boto3.client('lambda')

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

raw_context = {}


def notify_sns_subscriber(sns_msg):
    logger.info("deliver message: %s to sns topic arn: %s", str(sns_msg), snsTopicArn)
    message_to_be_published = generate_notify_content(sns_msg)
    # notify to sns topic for distribution event
    sns_client.publish(
        TopicArn=snsTopicArn,
        Message=message_to_be_published,
        Subject='Domain Name Need to Do DCV (Domain Control Validation)'
    )


def generate_notify_content(sns_msg):
    # make it a code url due to sns raw format, TBD make it a official repo url
    message_to_be_published = '''
           CNAME value need to add into DNS hostzone to finish DCV: {} \n           
           Sample script for different dns providers can be found in this document: https://awslabs.github.io/aws-cloudfront-extensions/en/distribution-management/ssl-certificates/dns-validation-process/
       '''.format(str(sns_msg))
    return message_to_be_published


# describe certificate details
@retry(wait=wait_fixed(3), stop=stop_after_attempt(5), retry=retry_if_exception_type(exceptions.Timeout))
def fetch_dcv_value(certArn):
    # describe certificate domainName
    resp = acm.describe_certificate(
        CertificateArn=certArn
    )
    logger.info('fetch acm response for dcv: %s', resp)
    if 'DomainValidationOptions' not in resp['Certificate']:
        logger.info('DomainValidationOptions is None, retry')
        raise exceptions.Timeout

    # validate if schema DomainValidationOptions is None and retry if possible
    if 'ResourceRecord' not in resp['Certificate']['DomainValidationOptions'][0]:
        logger.info('ResourceRecord is None, retry')
        raise exceptions.Timeout

    logger.info("ResourceRecord fulfilled, return for further processing")
    return resp

def check_generate_task_token(task_token):
    if not task_token:
        logger.error("Task token not found in event")
        # generate a random string as task_token
        task_token = ''.join(random.choices(string.ascii_lowercase, k=128))
    else:
        logger.info("Task token {}".format(task_token))
    return task_token

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
                'Value': certificate['DomainName'].replace('*.', '')
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
    Validate cerfiticate created by certbot with command below:
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
        # resp = ['DNS:*.ssl2.keyi.solutions.aws.a2z.org.cn, DNS:ssl3.keyi.solutions.aws.a2z.org.cn']

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
        logger.info('step function invoked: %s', resp)
        return resp
    except Exception as e:
        logger.info('error invoking step function: %s', e)
        return None


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
    return None


# validate the input
def validate_input_parameters(input):
    string_type = {'type': 'string'}
    existing_cf_info_type = {
        'distribution_id': {'type': 'string', 'required': True},
        'config_version_id': {'type': 'string', 'required': False}
    }
    cnameInfo_type = {
        'type': 'dict',
        'schema': {
            'domainName': { 'type': 'string', 'required': True },
            'sanList': { 'type': 'list', 'schema': string_type, 'required': True },
            'existing_cf_info': { 'type': 'dict', 'schema': existing_cf_info_type, 'required': True}
        }
    }
    pemInfo = {
        'type': 'dict',
        'schema': {
            'CertPem':{'type': 'string', 'required': True},
            'PrivateKeyPem': {'type': 'string', 'required': True},
            'ChainPem': {'type': 'string', 'required': True},
            'existing_cf_info': { 'type': 'dict', 'schema': existing_cf_info_type}
        }
    }
    schema = {
        "acm_op" : {"type": "string", 'required': True},
        "auto_creation": {"type": "string", 'required': True},
        'cnameList': {'type': 'list', 'schema': cnameInfo_type, 'required': False},
        'pemList': {'type': 'list', 'schema': pemInfo, 'required': False}
    }
    v = Validator(schema)
    v.allow_unknown = True
    if not v.validate(input):
        # raise Exception('Invalid input with error: ' + str(v.errors))
        raise Exception('Invalid input parameters: ' + json.dumps(v.errors))

def _tag_job_certificate(certArn, jobToken):
    """[summary]

    Args:
        certificate ([type]): [description]
        jobToken ([type]): [description]
    """
    logger.info('Tagging certificate %s with task_token %s', certArn, jobToken)
    acm.add_tags_to_certificate(
        CertificateArn=certArn,
        Tags=[
            {
                'Key': 'job_token',
                'Value': jobToken
            }
        ]
    )

# {
#   "acm_op": "create", # "import"
#   "dist_aggregate": "false",
#   "auto_creation": "true",
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
#

@app.resolver(type_name="Mutation", field_name="certCreateOrImport")
def cert_create_or_import(input):
    logger.info(input)
    global raw_context

    # will use request id as job_id
    logger.info(raw_context.aws_request_id)
    snsMsg = []

    # Get the parameters from the event
    body = input
    try:
        # validate the input
        validate_input_parameters(input)

        acm_op = body['acm_op']
        if 'dist_aggregate' in body:
            dist_aggregate = body['dist_aggregate']
        else:
            dist_aggregate = 'false'

        auto_creation = body['auto_creation']
        domain_name_list = body['cnameList']
        if 'cnameList' in body:
            certTotalNumber = len(body['cnameList'])
        else:
            certTotalNumber = 0
            body['cnameList'] = []

        if 'pemList' in body:
            pemTotalNumber = len(body['pemList'])
        else:
            pemTotalNumber = 0
            body['pemList'] = []

        cloudfrontTotalNumber = 0 if (auto_creation == 'false') else certTotalNumber
        job_type = body['acm_op']
        creationDate = str(datetime.now())
        certCreateStageStatus = 'INPROGRESS'
        certValidationStageStatus = 'NOTSTART'
        distStageStatus = 'NONEED' if (auto_creation == 'false') else 'NOTSTART'

        # remove the pemList from input body since PEM content is too large and not suitable for save in DDB
        body_without_pem = copy.deepcopy(body)
        del body_without_pem['pemList']

        if auto_creation == "false":
            create_job_info(JOB_INFO_TABLE_NAME,
                            raw_context.aws_request_id,
                            json.dumps(body_without_pem,indent=4),
                            certTotalNumber if acm_op == "create" else pemTotalNumber,
                            cloudfrontTotalNumber,
                            0,
                            0,
                            job_type,
                            creationDate,
                            certCreateStageStatus,
                            certValidationStageStatus,
                            distStageStatus)
            if acm_op == "create":
                # aggregate certificate if dist_aggregate is true
                # if dist_aggregate == "true":
                #     aggregate_cert_operation(certTotalNumber, domain_name_list, raw_context)
                # # otherwise, create certificate for each cname
                # else:
                for cname_index, cname_value in enumerate(domain_name_list):
                    certificate['DomainName'] = cname_value['domainName']
                    certificate['SubjectAlternativeNames'] = cname_value['sanList']

                    resp = request_certificate(certificate)
                    logger.info('Certificate creation response: %s', resp)

                    _tag_job_certificate(resp['CertificateArn'], raw_context.aws_request_id)

                    resp_detail = fetch_dcv_value(resp['CertificateArn'])

                    # iterate DomainValidationOptions array to get DNS validation record
                    for dns_index, dns_value in enumerate(resp_detail['Certificate']['DomainValidationOptions']):
                        if dns_value['ValidationMethod'] == 'DNS':
                            dns_validation_record = dns_value['ResourceRecord']
                            logger.info('index %s: DNS validation record: %s', dns_index, dns_validation_record)
                            snsMsg.append(dns_validation_record)


                update_job_field(JOB_INFO_TABLE_NAME,
                                 raw_context.aws_request_id,
                                 'certCreateStageStatus',
                                 'SUCCESS')
                update_job_field(JOB_INFO_TABLE_NAME,
                                 raw_context.aws_request_id,
                                 'certValidationStageStatus',
                                 'INPROGRESS')
                update_job_field(JOB_INFO_TABLE_NAME,
                                 raw_context.aws_request_id,
                                 'cert_completed_number',
                                 certTotalNumber)


                update_job_field(JOB_INFO_TABLE_NAME,
                                 raw_context.aws_request_id,
                                 'dcv_validation_msg',
                                 generate_notify_content(snsMsg))

                notify_sns_subscriber(snsMsg)
            # note dist_aggregate is ignored here, we don't aggregate imported certificate
            elif acm_op == "import":
                # iterate pemList array from event
                for pem_index, pem_value in enumerate(body['pemList']):

                    certificate['CertPem'] = str.encode(pem_value['CertPem'])
                    certificate['PrivateKeyPem'] = str.encode(pem_value['PrivateKeyPem'])
                    certificate['ChainPem'] = str.encode(pem_value['ChainPem'])

                    convert_string_to_file(pem_value['CertPem'], PEM_FILE)
                    _domainList = get_domain_list_from_cert()
                    certificate['SubjectAlternativeNames'] = _domainList
                    certificate['DomainName'] = _domainList[0] if _domainList else ''

                    resp = import_certificate(certificate)
                    _tag_job_certificate(resp['CertificateArn'], raw_context.aws_request_id)

                update_job_field(JOB_INFO_TABLE_NAME,
                                     raw_context.aws_request_id,
                                     'certCreateStageStatus',
                                     'SUCCESS')
                update_job_field(JOB_INFO_TABLE_NAME,
                                 raw_context.aws_request_id,
                                 'certValidationStageStatus',
                                 'SUCCESS')
                update_job_field(JOB_INFO_TABLE_NAME,
                                 raw_context.aws_request_id,
                                 'cert_completed_number',
                                 pemTotalNumber)

            data = {'statusCode': 200,
                     'body': raw_context.aws_request_id}
            return data

        # invoke step function to implement streamlined process of cert create/import and distribution create
        elif auto_creation == "true":
            # invoke existing step function
            logger.info('auto_creation is true, invoke step function with body %s', str(body))
            body['aws_request_id'] = raw_context.aws_request_id
            if acm_op == "import":
                # iterate pemList array from event
                gen_cnameInfo_list = []
                for pem_index, pem_value in enumerate(body['pemList']):
                    convert_string_to_file(pem_value['CertPem'], PEM_FILE)
                    _domainList = get_domain_list_from_cert()
                    _domainName = _domainList[0] if _domainList else ''
                    tmpCnameInfo = {}
                    tmpCnameInfo['domainName'] = _domainName
                    tmpCnameInfo['sanList'] = _domainList
                    tmpCnameInfo['existing_cf_info'] = {
                        "distribution_id": pem_value['existing_cf_info']['distribution_id'],
                        "config_version_id": pem_value['existing_cf_info']['config_version_id'],
                    }
                    gen_cnameInfo_list.append(tmpCnameInfo)

                body['cnameList'] = gen_cnameInfo_list
            resp = invoke_step_function(stepFunctionArn, body)

            data = {'statusCode': 200,
                    'body': raw_context.aws_request_id}
            return data
        else:
            logger.info('auto_creation is not true or false')

            data = {'statusCode': 500,
                    'body': 'error: auto_creation is not true or false'}
            return data
    except Exception as e:
        logger.error("Exception occurred, just update the ddb table")
        update_job_field(JOB_INFO_TABLE_NAME,
                         raw_context.aws_request_id,
                         'certCreateStageStatus',
                         'FAILED')
        update_job_field(JOB_INFO_TABLE_NAME,
                         raw_context.aws_request_id,
                         'promptInfo',
                         str(e))
        raise e


def aggregate_cert_operation(certTotalNumber, domain_name_list, raw_context):
    wildcard_cert_dict = {}
    for cname_index, cname_value in enumerate(domain_name_list):
        certificate['DomainName'] = cname_value['domainName']
        certificate['SubjectAlternativeNames'] = cname_value['sanList']

        # TBD, add cname_value['domainName'] to wildcard_cert_dict
        wildcardSan = is_wildcard(cname_value['sanList'])
        logger.info('wildcardSan: %s', wildcardSan)
        if wildcardSan:
            resp = request_certificate(certificate)
            logger.info('Certificate creation response: %s', resp)
            # update wildcard certificate dict
            wildcard_cert_dict[wildcardSan] = resp["CertificateArn"]
        else:
            parentCertArn = is_subset(cname_value['sanList'], wildcard_cert_dict)
            logger.info('parentCertArn: %s', parentCertArn)
            if parentCertArn:
                # don't create certificate if parent certificate exists
                continue
            resp = request_certificate(certificate)
            logger.info('Certificate creation response: %s', resp)
    update_job_field(JOB_INFO_TABLE_NAME,
                     raw_context.aws_request_id,
                     'certCreateStageStatus',
                     'SUCCESS')
    update_job_field(JOB_INFO_TABLE_NAME,
                     raw_context.aws_request_id,
                     'certValidationStageStatus',
                     'INPROGRESS')
    update_job_field(JOB_INFO_TABLE_NAME,
                     raw_context.aws_request_id,
                     'cert_completed_number',
                     certTotalNumber)


@app.resolver(type_name="Query", field_name="listCertifications")
def manager_certification_list():
    # first get distribution List from current account
    acm_client = boto3.client('acm', region_name='us-east-1')
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

@app.resolver(type_name="Query", field_name="listCertificationsWithJobId")
def manager_certification_list_with_jobId(jobId):
    # first get distribution List from current account
    acm_client = boto3.client('acm', region_name='us-east-1')
    response = acm_client.list_certificates()

    result = []
    # filter only the certificates with jobId in job_token tag
    for acmItem in response['CertificateSummaryList']:
        resp = acm_client.list_tags_for_certificate(
            CertificateArn=acmItem['CertificateArn']
        )
        tagList = resp['Tags']
        logger.info(tagList)

        for tagItem in tagList:
            if tagItem['Key'] == 'job_token' and tagItem['Value'] == jobId:
                result.append( acmItem['CertificateArn'])

    return result

@app.resolver(type_name="Query", field_name="listCloudFrontArnWithJobId")
def manager_cloudfront_arn_list_with_jobId(jobId):
    # first get distribution List from current account
    resource_client = boto3.client('resourcegroupstaggingapi', region_name='us-east-1')
    response = resource_client.get_resources(
        TagFilters=[
            {
                'Key': 'job_token',
                'Values': [
                    jobId,
                ]
            },
        ],
        ResourcesPerPage=100,
        ResourceTypeFilters=[
            'cloudfront',
        ],
    )

    result = []
    # filter only the certificates with jobId in job_token tag
    for cloudfrontItem in response['ResourceTagMappingList']:
        result.append(cloudfrontItem['ResourceARN'])
    return result

@app.resolver(type_name="Query", field_name="listSSLJobs")
def manager_list_ssl_jobs():
    # list data from dynamodb
    ddb_client = boto3.resource('dynamodb')
    ddb_table = ddb_client.Table(JOB_INFO_TABLE_NAME)
    response = ddb_table.scan()
    logger.info(f"SSL jobs list is : {response['Items']}")
    return response['Items']


@app.resolver(type_name="Query", field_name="getJobInfo")
def manager_get_ssl_job(jobId):
    # get specific cloudfront distributions version info
    ddb_client = boto3.resource('dynamodb')
    ddb_table = ddb_client.Table(JOB_INFO_TABLE_NAME)

    lambda_payload = {
        'job_id': jobId
    }
    try:
        response = lambda_client.invoke(
            FunctionName=STATUS_UPDATE_LAMBDA_FUNCTION,
            InvocationType='Event',
            Payload=json.dumps(lambda_payload).encode('UTF-8')
        )
    except Exception as e:
        logger.error("Failed to call lambda function with error" + str(e))

    try:
        response = ddb_table.get_item(
            Key={
                'jobId': jobId,
            })
        logger.info(response)
        if not 'Item' in response:
           time.sleep(3)
           response = ddb_table.get_item(
               Key={
                   'jobId': jobId,
               })
           data = response['Item']
           return data
        else:
           data = response['Item']
           return data
    except Exception as e:
        response = {
            'statusCode': 500,
            'body': "Can not found job info with id:" + jobId
        }
        return response


@logger.inject_lambda_context(correlation_id_path=correlation_paths.APPSYNC_RESOLVER)
def lambda_handler(event, context):
    global raw_event
    raw_event = event
    global raw_context
    raw_context = context
    return app.resolve(event, context)
