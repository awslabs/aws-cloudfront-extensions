import logging
from time import sleep
import uuid
import boto3
import os
import json
import re
import random
import string
from datetime import datetime

from job_table_utils import create_job_info, update_job_cert_completed_number, update_job_cloudfront_distribution_created_number, update_job_field

from tenacity import retry, wait_fixed,wait_random, stop_after_attempt, retry_if_exception_type, wait_exponential
from requests import exceptions

# certificate need to create in region us-east-1 for cloudfront to use
acm = boto3.client('acm', region_name='us-east-1')
dynamo_client = boto3.client('dynamodb')
sns_client = boto3.client('sns')
cf = boto3.client('cloudfront')

LAMBDA_TASK_ROOT = os.environ.get('LAMBDA_TASK_ROOT')
JOB_INFO_TABLE_NAME = os.environ.get('JOB_INFO_TABLE')

logger = logging.getLogger('boto3')
logger.setLevel(logging.INFO)

# add execution path
os.environ['PATH'] = os.environ['PATH'] + ':' + os.environ['LAMBDA_TASK_ROOT']

# get sns topic arn from environment variable
snsTopicArn = os.environ.get('SNS_TOPIC')

certificate = {
    'CertificateArn': 'arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012',
    'DomainName': 'www.example.com',
    'SubjectAlternativeNames': ['www.example.com', 'www.example.org']
}


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


def _update_acm_metadata(callbackTable, domainName, sanList, certUUid, taskToken, taskType, taskStatus, certArn):
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
    logger.info('Updating metadata for domainName %s with certUUid %s', domainName, certUUid)
    dynamo_client.update_item(
        TableName=callbackTable,
        Key={
            'certUUid': {
                'S': certUUid
            }
        },
        UpdateExpression="set taskToken = :token, taskStatus = :status",
        ExpressionAttributeValues={
            ':token': {
                'S': taskToken
            },
            ':status': {
                'S': taskStatus
            }
        }
    )


@retry(wait=wait_fixed(1) + wait_random(0, 2), stop=stop_after_attempt(30))
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


# describe certificate details
@retry(wait=wait_fixed(1) + wait_random(0, 2), stop=stop_after_attempt(20), retry=retry_if_exception_type(exceptions.Timeout))
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


# common cert operations
def _common_cert_operations(callback_table, certificate, sanListDynamoDB, cert_UUid, task_token, task_type, snsMsg, job_token):
    """_summary_

    Args:
        callback_table (_type_): _description_
        certificate (_type_): _description_
        sanListDynamoDB (_type_): _description_
        cert_UUid (_type_): _description_
        task_token (_type_): _description_
        task_type (_type_): _description_
        snsMsg (_type_): _description_
        job_token (_type_): _description_
    """

    resp = request_certificate(certificate)
    logger.info('Certificate creation response: %s', resp)

    _create_acm_metadata(callback_table,
                         certificate['DomainName'],
                         sanListDynamoDB,
                         cert_UUid,
                         task_token,
                         task_type,
                         'TASK_TOKEN_TAGGED',
                         resp['CertificateArn'],
                         job_token)

    # tag acm certificate with task_token, slice task token to fit length of 128
    _tag_certificate(resp['CertificateArn'], task_token[:128])

    _tag_job_certificate(resp['CertificateArn'], job_token)

    resp_detail = fetch_dcv_value(resp['CertificateArn'])

    # iterate DomainValidationOptions array to get DNS validation record
    for dns_index, dns_value in enumerate(resp_detail['Certificate']['DomainValidationOptions']):
        if dns_value['ValidationMethod'] == 'DNS':
            dns_validation_record = dns_value['ResourceRecord']
            logger.info('index %s: DNS validation record: %s', dns_index, dns_validation_record)
            snsMsg.append(dns_validation_record)

    return resp


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
#         "originsItemsDomainName": "risetron.s3.ap-east-1.amazonaws.com"
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
    """
    :param event:
    :param context:
    """
    logger.info("Received event: " + json.dumps(event))

    callback_table = os.getenv('CALLBACK_TABLE')
    task_type = os.getenv('TASK_TYPE')
    task_token = event['task_token']
    job_token = event['input']['aws_request_id']
    if 'dist_aggregate' in event['input']:
        dist_aggregate = event['input']['dist_aggregate']
    else:
        dist_aggregate = 'false'

    domain_name_list = event['input']['cnameList']

    task_token = check_generate_task_token(task_token)

    sns_msg = []

    auto_creation = event['input']['auto_creation']

    certTotalNumber = len(event['input']['cnameList'])
    cloudfrontTotalNumber = 0 if (auto_creation == 'false') else certTotalNumber
    job_type = event['input']['acm_op']
    creationDate = str(datetime.now())
    certCreateStageStatus = 'INPROGRESS'
    certValidationStageStatus = 'NOTSTART'
    distStageStatus = 'NOTSTART'

    body_without_pem = event['input']
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

    try:
        if 'true' == auto_creation:
            validate_source_cloudfront_dist(domain_name_list)

        # aggregate certificate if dist_aggregate is true
        if dist_aggregate == "true":
            aggregate_dist(callback_table, domain_name_list, sns_msg, task_token, task_type, job_token)
        else:
            none_agregate_dist(callback_table, domain_name_list, sns_msg, task_token, task_type, job_token)

        update_job_field(JOB_INFO_TABLE_NAME,
                         job_token,
                         'certCreateStageStatus',
                         'SUCCESS')

        update_job_field(JOB_INFO_TABLE_NAME,
                         job_token,
                         'certValidationStageStatus',
                         'INPROGRESS')

        update_job_field(JOB_INFO_TABLE_NAME,
                         job_token,
                         'cert_completed_number',
                         certTotalNumber)

        update_job_field(JOB_INFO_TABLE_NAME,
                         job_token,
                         'dcv_validation_msg',
                         generate_notify_content(sns_msg))

        notify_sns_subscriber(sns_msg)

        logger.info('Certificate creation job %s completed successfully', job_token)

        return {
            'statusCode': 200,
            'body': json.dumps('step to acm create callback complete')
        }
    except Exception as e:
        logger.error("Exception occurred, just update the ddb table")
        update_job_field(JOB_INFO_TABLE_NAME,
                         job_token,
                         'certCreateStageStatus',
                         'FAILED')
        update_job_field(JOB_INFO_TABLE_NAME,
                         job_token,
                         'promptInfo',
                         str(e))
        raise e


def check_generate_task_token(task_token):
    if not task_token:
        logger.error("Task token not found in event")
        # generate a random string as task_token
        task_token = ''.join(random.choices(string.ascii_lowercase, k=128))
    else:
        logger.info("Task token {}".format(task_token))
    return task_token


def generate_notify_content(sns_msg):
    # make it a code url due to sns raw format, TBD make it a official repo url
    message_to_be_published = '''
           CNAME value need to add into DNS hostzone to finish DCV: {} \n           
           Sample script for different dns providers can be found in this document: https://awslabs.github.io/aws-cloudfront-extensions/en/distribution-management/ssl-certificates/dns-validation-process/
       '''.format(str(sns_msg))
    return message_to_be_published

def notify_sns_subscriber(sns_msg):
    logger.info("deliver message: %s to sns topic arn: %s", str(sns_msg), snsTopicArn)

    message_to_be_published = generate_notify_content(sns_msg)

    # notify to sns topic for distribution event
    sns_client.publish(
        TopicArn=snsTopicArn,
        Message=message_to_be_published,
        Subject='Domain Name Need to Do DCV (Domain Control Validation)'
    )


def none_agregate_dist(callback_table, domain_name_list, sns_msg, task_token, task_type, job_token):
    for cname_index, cname_value in enumerate(domain_name_list):
        cert_UUid = str(uuid.uuid4())
        certificate['DomainName'] = cname_value['domainName']
        certificate['SubjectAlternativeNames'] = cname_value['sanList']
        san_list_dynamo_db = [dict(zip(['S'], [x])) for x in cname_value['sanList']]
        logger.info('index %s: sanList for DynamoDB: %s', cname_index, san_list_dynamo_db)

        _common_cert_operations(callback_table, certificate, san_list_dynamo_db, cert_UUid, task_token, task_type,
                                sns_msg, job_token)


def aggregate_dist(callback_table, domain_name_list, sns_msg, task_token, task_type, job_token):
    wildcard_cert_dict = {}
    for cname_index, cname_value in enumerate(domain_name_list):
        cert_UUid = str(uuid.uuid4())
        certificate['DomainName'] = cname_value['domainName']
        certificate['SubjectAlternativeNames'] = cname_value['sanList']
        san_list_dynamo_db = [dict(zip(['S'], [x])) for x in cname_value['sanList']]
        logger.info('index %s: sanList for DynamoDB: %s', cname_index, san_list_dynamo_db)

        # TBD, add cname_value['domainName'] to wildcard_cert_dict
        wildcardSan = is_wildcard(cname_value['sanList'])
        logger.info('wildcardSan: %s', wildcardSan)
        if wildcardSan:
            ############### TBD, wrapper needed
            resp = _common_cert_operations(callback_table, certificate, san_list_dynamo_db, cert_UUid, task_token,
                                           task_type, sns_msg, job_token)
            ###############

            # update wildcard certificate dict
            wildcard_cert_dict[wildcardSan] = resp["CertificateArn"]

        else:
            parentCertArn = is_subset(cname_value['sanList'], wildcard_cert_dict)
            logger.info('parentCertArn: %s', parentCertArn)
            if parentCertArn:
                # don't create certificate if parent certificate exists
                _create_acm_metadata(callback_table,
                                     certificate['DomainName'],
                                     san_list_dynamo_db,
                                     cert_UUid,
                                     task_token,
                                     task_type,
                                     'TASK_TOKEN_TAGGED',
                                     parentCertArn,
                                     job_token)

                continue
            else:
                ############### TBD, wrapper needed
                _common_cert_operations(callback_table, certificate, san_list_dynamo_db, cert_UUid, task_token,
                                        task_type, sns_msg, job_token)
                ###############


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
