import logging
import uuid
import boto3
import os
import json
import time
import requests
from requests_aws4auth import AWS4Auth

from tenacity import retry, wait_fixed, stop_after_attempt, retry_if_exception_type
from requests import exceptions

# certificate need to create in region us-east-1 for cloudfront to use
acm = boto3.client('acm', region_name='us-east-1')
dynamo_client = boto3.client('dynamodb')
cf = boto3.client('cloudfront')

LAMBDA_TASK_ROOT = os.environ.get('LAMBDA_TASK_ROOT')
GRAPHQL_API_URL = os.environ.get('GRAPHQL_API_URL')
GRAPHQL_API_KEY = os.environ.get('GRAPHQL_API_KEY')

logger = logging.getLogger('boto3')
logger.setLevel(logging.INFO)

# add execution path
# os.environ['PATH'] = os.environ['PATH'] + ':' + os.environ['LAMBDA_TASK_ROOT']

default_distribution_config = {
    "CallerReference": "",
    "Aliases": {
        "Quantity": 1,
        "Items": []
    },
    "DefaultRootObject": "",
    "Origins": {
        "Quantity": 1,
        "Items": [
            {
                "Id": "",
                "DomainName": "",
                "OriginPath": "",
                "CustomHeaders": {
                    "Quantity": 0
                },
                "S3OriginConfig": {
                    "OriginAccessIdentity": ""
                },
                "ConnectionAttempts": 3,
                "ConnectionTimeout": 10,
                "OriginShield": {
                    "Enabled": False
                }
            }
        ]
    },
    "OriginGroups": {
        "Quantity": 0
    },
    "DefaultCacheBehavior": {
        "TargetOriginId": "",
        "TrustedSigners": {
            "Enabled": False,
            "Quantity": 0
        },
        "TrustedKeyGroups": {
            "Enabled": False,
            "Quantity": 0
        },
        "ViewerProtocolPolicy": "allow-all",
        "AllowedMethods": {
            "Quantity": 2,
            "Items": [
                "HEAD",
                "GET"
            ],
            "CachedMethods": {
                "Quantity": 2,
                "Items": [
                    "HEAD",
                    "GET"
                ]
            }
        },
        "SmoothStreaming": False,
        "Compress": False,
        "LambdaFunctionAssociations": {
            "Quantity": 0
        },
        "FieldLevelEncryptionId": "",
        "CachePolicyId": "",
    },
    "CacheBehaviors": {
        "Quantity": 0
    },
    "CustomErrorResponses": {
        "Quantity": 0
    },
    "Comment": "",
    "Logging": {
        "Enabled": False,
        "IncludeCookies": False,
        "Bucket": "",
        "Prefix": ""
    },
    "PriceClass": "PriceClass_All",
    "Enabled": True,
    "ViewerCertificate": {
        "ACMCertificateArn": "",
        "SSLSupportMethod": "sni-only",
        "MinimumProtocolVersion": "TLSv1.2_2019",
        "Certificate": "",
        "CertificateSource": "acm"
    },
    "Restrictions": {
        "GeoRestriction": {
            "RestrictionType": "none",
            "Quantity": 0
        }
    },
    "WebACLId": "",
    "HttpVersion": "http2",
    "IsIPV6Enabled": True
}

# create CloudFront distribution
def create_distribution(config):
    """[summary]

    Args:
        certificate ([type]): [description]

    Returns:
        [type]: [description]
    """
    # create a new distribution
    logger.info('Creating distribution with config: %s', json.dumps(config))
    resp = cf.create_distribution(
        DistributionConfig=config
    )
    logger.info('distribution start to create, ID: %s, ARN: %s, Domain Name: %s', resp['Distribution']['Id'], resp['Distribution']['ARN'], resp['Distribution']['DomainName'])

    return resp
    # TODO: Do we need to wait distribution status to be deployed?
    # wait for distribution to be enabled, move to Step Function in future
    # while True:
    #     distribution = cf.get_distribution(
    #         Id = resp['Distribution']['Id']
    #     )
    #     if distribution['Distribution']['Status'] == 'Deployed':
    #         logger.info('distribution %s successful deployed', distribution['Distribution']['DomainName'])
    #         break
    #     else:
    #         logger.info('Waiting for distribution to be deployed...')
    #         time.sleep(10)

# scan dynamodb table for certificate
@retry(wait=wait_fixed(3), stop=stop_after_attempt(5), retry=retry_if_exception_type(exceptions.Timeout))
def scan_for_cert(callback_table, domain_name):
    response = dynamo_client.scan(
        TableName=callback_table,
        FilterExpression='domainName = :domain_name AND taskStatus = :status',
        ExpressionAttributeValues={
            ':domain_name': {
                'S': domain_name
            },
            ':status': {
                'S': 'CERT_ISSUED'
            }
        },
    )
    logger.info('scan response: %s', json.dumps(response))
    # raise exception if response['Items'] is empty
    if len(response['Items']) == 0:
        logger.info('Specific domain not found, retry')
        raise exceptions.Timeout

    return response

# get the cloudfront config from ddb and s3
def fetch_cloudfront_config_version(distribution_id,config_version_id, ddb_table_name):
    # get specific cloudfront distributions version info
    ddb_client = boto3.resource('dynamodb')
    ddb_table = ddb_client.Table(ddb_table_name)

    response = ddb_table.get_item(
        Key={
            "distributionId": distribution_id,
            "versionId": int(config_version_id)
        })
    data = response['Item']

    config_link = data['config_link']
    logger.info("target s3 link is " + config_link)

    s3_client = boto3.client('s3')
    data = s3_client.get_object(Bucket=data['s3_bucket'], Key=data['s3_key'])
    content = json.load(data['Body'])
    # result = str(json.dumps(content, indent=4))
    # result = data['Body']

    return content

# INPUT
# {
#   "input": {
#       "domainName": "cdn2.risetron.cn",
#       "sanList": [
#           "cdn3.risetron.cn"
#       ],
#       "originsItemsDomainName": "risetron.s3.ap-east-1.amazonaws.com",
#       "existing_cf_info":
#       {
#         "distribution_id": "E2SQNNA26WHYGD",
#         "config_version_id": "5"
#       }
#   }
# }
# TODO: Need to adding rainy day handling code
def lambda_handler(event, context):
    """
    :param event:
    :param context:
    """
    logger.info("Received event: " + json.dumps(event))

    # fetch domain name from event
    callback_table = os.getenv('CALLBACK_TABLE')
    # callback_table = 'acm_metadata_store'
    domain_name = event['input']['domainName']

    logger.info("Domain name : " + domain_name)

    # scan domain name in DynamoDB and filter status is CERT_ISSUED, TBD retry here
    response = scan_for_cert(callback_table, domain_name)

    logger.info('scan result of DynamoDB %s', json.dumps(response))
    # fetch certArn from DynamoDB, assume such reverse search only had one result
    cert_arn = response['Items'][0]['certArn']['S']
    # fetch taskToken from DynamoDB
    task_token = response['Items'][0]['taskToken']['S']

    # delete such domain name in DynamoDB, TODO: Do we need to move the deletion after distribution create complete?
    resp = dynamo_client.delete_item(
        TableName=callback_table,
        Key={
            'taskToken': {
                'S': task_token
            },
            'domainName': {
                'S': domain_name
            }
        }
    )

    sub_domain_name_list = event['input']['sanList'] if event['input']['sanList'] else None
    origins_items_domain_name = '%s' % event['input']['originsItemsDomainName'] if event['input']['originsItemsDomainName'] else None
    # concatenate from OriginsItemsDomainName and random string
    origins_items_id = '%s-%s' % (str(uuid.uuid4())[:8], origins_items_domain_name)
    default_root_object = ''
    origins_items_origin_path = ''
    default_cache_behavior_target_origin_id = origins_items_id
    certificate_arn = cert_arn

    # customization configuration of CloudFront distribution
    original_cf_distribution_id = event['input']['existing_cf_info']['distribution_id']
    original_cf_distribution_version = event['input']['existing_cf_info']['config_version_id']
    ddb_table_name = os.getenv('CONFIG_VERSION_DDB_TABLE_NAME')

    config = construct_cloudfront_config(certificate_arn, ddb_table_name, default_cache_behavior_target_origin_id,
                                         default_root_object, original_cf_distribution_id,
                                         original_cf_distribution_version, origins_items_domain_name, origins_items_id,
                                         origins_items_origin_path, sub_domain_name_list)

    resp = create_distribution(config)

    # return response in json format
    return {
        'statusCode': 200,
        'body': {
            'distributionId': resp['Distribution']['Id'],
            'distributionArn': resp['Distribution']['ARN'],
            'distributionDomainName': resp['Distribution']['DomainName']
        }
    }


def construct_cloudfront_config(certificate_arn, ddb_table_name, default_cache_behavior_target_origin_id,
                                default_root_object, original_cf_distribution_id, original_cf_distribution_version,
                                origins_items_domain_name, origins_items_id, origins_items_origin_path,
                                sub_domain_name_list):
    config = fetch_cloudfront_config_version(original_cf_distribution_id,
                                             original_cf_distribution_version,
                                             ddb_table_name)
    config['CallerReference'] = str(uuid.uuid4())
    config['Aliases']['Items'] = sub_domain_name_list
    config['Aliases']['Quantity'] = len(config['Aliases']['Items'])
    config['DefaultRootObject'] = default_root_object
    # support single origin for now, will support multiple origin in future TBD
    config['Origins']['Items'] = [
        {
            "Id": origins_items_id,
            "DomainName": origins_items_domain_name,
            "OriginPath": origins_items_origin_path,
            "CustomHeaders": {
                "Quantity": 0
            },
            "S3OriginConfig": {
                "OriginAccessIdentity": ""
            },
            "ConnectionAttempts": 3,
            "ConnectionTimeout": 10,
            "OriginShield": {
                "Enabled": False
            }
        }]
    config['DefaultCacheBehavior']['TargetOriginId'] = default_cache_behavior_target_origin_id
    config['DefaultCacheBehavior']['CachePolicyId'] = "658327ea-f89d-4fab-a63d-7e88639e58f6"
    config['ViewerCertificate'].pop('CloudFrontDefaultCertificate')
    config['ViewerCertificate']['ACMCertificateArn'] = certificate_arn
    config['ViewerCertificate']['Certificate'] = certificate_arn
    return config