import copy
import logging
import uuid
import boto3
import os
import json
import subprocess
import re
import random
import string
from datetime import datetime

from job_table_utils import create_job_info, update_job_cert_completed_number, update_job_cloudfront_distribution_created_number, update_job_field

# certificate need to create in region us-east-1 for cloudfront to use
acm = boto3.client('acm', region_name='us-east-1')
dynamo_client = boto3.client('dynamodb')
cf = boto3.client('cloudfront')

LAMBDA_TASK_ROOT = os.environ.get('LAMBDA_TASK_ROOT')
JOB_INFO_TABLE_NAME = os.environ.get('JOB_INFO_TABLE')
JOB_STATUS_TABLE_NAME = os.environ.get('JOB_STATUS_TABLE')

logger = logging.getLogger('boto3')
logger.setLevel(logging.INFO)

# add execution path
os.environ['PATH'] = os.environ['PATH'] + ':' + os.environ['LAMBDA_TASK_ROOT']

cert_UUid = str(uuid.uuid4())

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

# transform json into bytes
def transform_json_to_bytes(json_data):
    """[summary]
    Args:
        json_data ([type]): [description]
    
    Returns:
        [type]: [description]
    """
    return json.dumps(json_data).encode('utf-8')


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
    logger.info('start to importing existing certification %s', certificate)
    resp = acm.import_certificate(
               Certificate=certificate['CertPem'],
               PrivateKey=certificate['PrivateKeyPem'],
               CertificateChain=certificate['ChainPem'],
               Tags=[
                {
                    'Key': 'issuer',
                    # strip * if exist due to regular expression pattern: [\p{L}\p{Z}\p{N}_.:\/=+\-@]* in tag
                    'Value': certificate['DomainName'].replace('*.', '')
                }
                ]
        )

    logger.info('certificate imported: %s', json.dumps(resp))
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
 
    if(re.search(p, str)):
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
        resp = subprocess.check_output(['openssl', 'x509', '-text', '-noout', '-in', str(PEM_FILE)], stderr=subprocess.PIPE, encoding='utf-8')
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
    return domainList

def _create_acm_metadata(callbackTable, domainName, sanList, certUUid, taskToken, taskType, taskStatus, certArn, jobToken):
    """_summary_

    Args:
        callbackTable (_type_): _description_
        domainName (_type_): _description_
        sanList (_type_): _description_
        certUUid (_type_): _description_
        taskToken (_type_): _description_
        taskType (_type_): _description_
        taskStatus (_type_): _description_
        certArn (_type_): _description_
    """
    logger.info('Creating domain metadata with taskToken %s, domainName %s', taskToken, domainName)

    resp = dynamo_client.put_item(
            TableName=callbackTable,
            Item={
                'domainName': {
                    'S': domainName
                },
                'sanList': {
                    'L': sanList
                },
                'certUUid': {
                    'S': certUUid
                },
                'taskToken': {
                    'S': taskToken
                },
                'taskType': {
                    'S': taskType
                },
                'taskStatus': {
                    'S': taskStatus
                },
                'certArn': {
                    'S': certArn
                },
                'jobToken': {
                    'S': jobToken
                },
            }
        )
    logger.info('Domain metadata creation response: %s', resp)

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
#         "originsItemsDomainName": "risetron.s3.ap-east-1.amazonaws.com",
#         "existing_cf_info":
#         {
#           "distribution_id": "E2SQNNA26WHYGD",
#           "config_version_id": "5"
#         }
#     },
#     {
#         "domainName": "cdn3.risetron.cn",
#         "sanList": [
#             "cdn4.risetron.cn"
#         ],
#         "originsItemsDomainName": "risetron.s3.ap-east-1.amazonaws.com",
#         "existing_cf_info":
#         {
#           "distribution_id": "E2SQNNA26WHYGD",
#           "config_version_id": "5"
#         }
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
def lambda_handler(event, context):
    """_summary_

    Args:
        event (_type_): _description_
        context (_type_): _description_

    Returns:
        _type_: _description_
    """
    logger.info("Received event: " + json.dumps(event, indent=2))

    # get task_token from event to create callback task
    callback_table = os.getenv('CALLBACK_TABLE')
    task_type = os.getenv('TASK_TYPE')
    task_token = event['task_token']
    job_token = event['input']['aws_request_id']
    domain_name_list = event['input']['pemList']
    auto_creation = event['input']['auto_creation']

    task_token = check_generate_task_token(task_token)

    certTotalNumber = len(event['input']['pemList'])
    cloudfrontTotalNumber = 0 if (auto_creation == 'false') else certTotalNumber
    job_type = event['input']['acm_op']
    creationDate = datetime.now().strftime('%Y-%m-%d-%H-%M-%S')
    certCreateStageStatus = 'INPROGRESS'
    certValidationStageStatus = 'NOTSTART'
    distStageStatus = 'NOTSTART'

    body_without_pem = copy.deepcopy(event['input'])
    if 'pemList' in body_without_pem:
        del body_without_pem['pemList']
    create_job_info(JOB_INFO_TABLE_NAME,
                    job_token,
                    json.dumps(body_without_pem,indent=4),
                    certTotalNumber,
                    cloudfrontTotalNumber,
                    0,
                    0,
                    job_type,
                    creationDate,
                    certCreateStageStatus,
                    certValidationStageStatus,
                    distStageStatus)

    validate_source_cloudfront_dist(domain_name_list)

    # iterate pemList array from event
    for pem_index, pem_value in enumerate(event['input']['pemList']):
        cert_UUid = str(uuid.uuid4())
        certificate['CertPem'] = str.encode(pem_value['CertPem'])
        certificate['PrivateKeyPem'] = str.encode(pem_value['PrivateKeyPem'])
        certificate['ChainPem'] = str.encode(pem_value['ChainPem'])

        convert_string_to_file(pem_value['CertPem'], PEM_FILE)
        _domainList = get_domain_list_from_cert()
        certificate['SubjectAlternativeNames'] = _domainList
        certificate['DomainName'] = _domainList[0] if _domainList else ''

        if event['input']['enable_cname_check'] == 'true':
            check_domain_name(event, pem_index)

        san_list_dynamo_db = [dict(zip(['S'], [x])) for x in _domainList]
        logger.info('index %s: sanList for DynamoDB: %s', pem_index, san_list_dynamo_db)

        resp = import_certificate(certificate)

        _create_acm_metadata(callback_table,
                             certificate['DomainName'],
                             san_list_dynamo_db,
                             cert_UUid,
                             task_token,
                             task_type,
                             'TASK_TOKEN_TAGGED',
                             resp['CertificateArn'],
                             job_token)

        # tag acm certificate with task_token, slice task token to fit length of 128
        _tag_certificate(resp['CertificateArn'], task_token[:128])

        _tag_job_certificate(resp['CertificateArn'], job_token)

    update_job_field(JOB_INFO_TABLE_NAME,
                         job_token,
                         'certCreateStageStatus',
                         'SUCCESS')

    update_job_field(JOB_INFO_TABLE_NAME,
                     job_token,
                     'certValidationStageStatus',
                     'INPROGRESS')

    return {
        'statusCode': 200,
        'body': json.dumps('step to acm import callback complete')
    }


def check_domain_name(event, pem_index):
    # validation for certificate
    if event['input']['cnameList'][pem_index]['domainName'] == certificate['DomainName']:
        logger.info("Domain name {} matches certificate domain name {}".format(
            event['input']['cnameList'][pem_index]['domainName'], certificate['DomainName']))
    else:
        logger.error("Domain name {} does not match certificate domain name {}".format(
            event['input']['cnameList'][pem_index]['domainName'], certificate['DomainName']))
        raise Exception("Domain name {} does not match certificate domain name {}".format(
            event['input']['cnameList'][pem_index]['domainName'], certificate['DomainName']))


def validate_source_cloudfront_dist(domain_name_list):
    ddb_table_name = os.getenv('CONFIG_VERSION_DDB_TABLE_NAME')
    ddb_client = boto3.resource('dynamodb')
    ddb_table = ddb_client.Table(ddb_table_name)
    # validate all the source cloudfront distribution/version is existed
    for cname_index, cname_value in enumerate(domain_name_list):
        if 'existing_cf_info' in cname_value:
            source_cf_info = cname_value['existing_cf_info']
            dist_id = source_cf_info['distribution_id']
            if 'config_version_id' in source_cf_info:
                # search the config ddb for source cloudfront config version
                version_id = source_cf_info['config_version_id']
                # get specific cloudfront distributions version info
                response = ddb_table.get_item(
                    Key={
                        "distributionId": dist_id,
                        "versionId": int(version_id)
                    })
                if 'Item' not in response:
                    logger.error("existing cf config with name: %s, version: %s does not exist", dist_id, version_id)
                    raise Exception(
                        "Failed to find existing config with name: %s, version: %s in cname_value: %s, index: %s",
                        dist_id, version_id, cname_value, cname_index)
            else:
                # There is no config version info, just check whether cloudfront distribution exist
                resp = cf.get_distribution(
                    Id=dist_id,
                )
                if 'Distribution' not in resp:
                    logger.error("Can not found source cloudfront distribution with id: %s", dist_id)
                    raise Exception("Can not found source cloudfront distribution with id: %s", dist_id)

        else:
            logger.error("Request missing existing_cf_info section which is not optional field"
                         "(example: {\"existing_cf_info\": {\"distribution_id\": \"E1J2U5I18F046Q\", "
                         "\"config_version_id\": \"1\"}})")
            raise Exception("Request missing existing_cf_info section which is not optional field"
                            "(example: {\"existing_cf_info\": {\"distribution_id\": \"E1J2U5I18F046Q\", "
                            "\"config_version_id\": \"1\"}})")


def check_generate_task_token(task_token):
    if not task_token:
        logger.error("Task token not found in event, generate a random token")
        # generate a random string as task_token
        task_token = ''.join(random.choices(string.ascii_lowercase, k=128))
    else:
        logger.info("Task token {}".format(task_token))
    return task_token