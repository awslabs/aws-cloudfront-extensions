import logging
from time import sleep
import uuid
import boto3
import os
import json
import re
import random
import string

from tenacity import retry, wait_fixed, stop_after_attempt, retry_if_exception_type
from requests import exceptions

# certificate need to create in region us-east-1 for cloudfront to use
acm = boto3.client('acm', region_name='us-east-1')
dynamo_client = boto3.client('dynamodb')
sns_client = boto3.client('sns')
cf = boto3.client('cloudfront')

LAMBDA_TASK_ROOT = os.environ.get('LAMBDA_TASK_ROOT')

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


def _create_acm_metadata(callbackTable, domainName, sanList, certUUid, taskToken, taskType, taskStatus, certArn):
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
            }
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


# common cert operations
def _common_cert_operations(callback_table, certificate, sanListDynamoDB, cert_UUid, task_token, task_type, snsMsg):
    """_summary_

    Args:
        callback_table (_type_): _description_
        certificate (_type_): _description_
        sanListDynamoDB (_type_): _description_
        cert_UUid (_type_): _description_
        task_token (_type_): _description_
        task_type (_type_): _description_
        snsMsg (_type_): _description_
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
                         resp['CertificateArn'])

    # tag acm certificate with task_token, slice task token to fit length of 128
    _tag_certificate(resp['CertificateArn'], task_token[:128])

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
    dist_aggregate = event['input']['dist_aggregate']
    domain_name_list = event['input']['cnameList']

    task_token = check_generate_task_token(task_token)

    sns_msg = []

    validate_source_cloudfront_dist(domain_name_list)

    # aggregate certificate if dist_aggregate is true
    if dist_aggregate == "true":
        aggregate_dist(callback_table, domain_name_list, sns_msg, task_token, task_type)
    else:
        none_agregate_dist(callback_table, domain_name_list, sns_msg, task_token, task_type)

    notify_sns_subscriber(sns_msg)

    return {
        'statusCode': 200,
        'body': json.dumps('step to acm create callback complete')
    }


def check_generate_task_token(task_token):
    if not task_token:
        logger.error("Task token not found in event")
        # generate a random string as task_token
        task_token = ''.join(random.choices(string.ascii_lowercase, k=128))
    else:
        logger.info("Task token {}".format(task_token))
    return task_token


def notify_sns_subscriber(sns_msg):
    logger.info("deliver message: %s to sns topic arn: %s", str(sns_msg), snsTopicArn)
    # make it a code url due to sns raw format, TBD make it a official repo url
    sample_route53_code = 'https://gist.github.com/yike5460/67c42ff4a0405c05e59737bd425a4806'
    sample_godaddy_code = 'https://gist.github.com/guming3d/56e2f0517aa47fc87289fd21ff97dcee'
    message_to_be_published = {
        'CNAME value need to add into DNS hostzone to finish DCV': str(sns_msg),
        'Sample Script (Python)': sample_route53_code,
        'Sample Script for Godaddy (Python)': sample_godaddy_code
    }
    # notify to sns topic for distribution event
    sns_client.publish(
        TopicArn=snsTopicArn,
        Message=str(message_to_be_published),
        Subject='Domain Name Need to Do DCV (Domain Control Validation)'
    )


def none_agregate_dist(callback_table, domain_name_list, sns_msg, task_token, task_type):
    for cname_index, cname_value in enumerate(domain_name_list):
        cert_UUid = str(uuid.uuid4())
        certificate['DomainName'] = cname_value['domainName']
        certificate['SubjectAlternativeNames'] = cname_value['sanList']
        san_list_dynamo_db = [dict(zip(['S'], [x])) for x in cname_value['sanList']]
        logger.info('index %s: sanList for DynamoDB: %s', cname_index, san_list_dynamo_db)

        _common_cert_operations(callback_table, certificate, san_list_dynamo_db, cert_UUid, task_token, task_type,
                                sns_msg)


def aggregate_dist(callback_table, domain_name_list, sns_msg, task_token, task_type):
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
                                           task_type, sns_msg)
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
                                     parentCertArn)

                continue
            else:
                ############### TBD, wrapper needed
                _common_cert_operations(callback_table, certificate, san_list_dynamo_db, cert_UUid, task_token,
                                        task_type, sns_msg)
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