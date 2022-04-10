import logging
import uuid
import boto3
import os
import json
import time

from tenacity import retry, wait_fixed, stop_after_attempt, retry_if_exception_type
from requests import exceptions

# certificate need to create in region us-east-1 for cloudfront to use
acm = boto3.client('acm', region_name='us-east-1')
dynamo_client = boto3.client('dynamodb')
cf = boto3.client('cloudfront')

LAMBDA_TASK_ROOT = os.environ.get('LAMBDA_TASK_ROOT')

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

def lambda_handler(event, context):
    """

    :param event:
    :param context:
    """
    logger.info("Received event: " + json.dumps(event))

    # INPUT
    # {
    #   "input": {
    #       "domainName": "cdn2.risetron.cn",
    #       "sanList": [
    #           "cdn3.risetron.cn"
    #       ],
    #       "originsItemsDomainName": "risetron.s3.ap-east-1.amazonaws.com"
    #   }
    # }

    # fetch domain name from event
    callback_table = os.getenv('CALLBACK_TABLE')
    domain_name = event['input']['domainName']

    # scan domain name in DynamoDB and filter status is CERT_ISSUED, TBD retry here
    response = scan_for_cert(callback_table, domain_name)

    # # iterate all certArn match domain name
    # for item in response['Items']:
    #     # fetch certArn from dynamoDB
    #     certArn = item['certArn']['S']

    logger.info('scan result of DynamoDB %s', json.dumps(response))
    # fetch certArn from DynamoDB, assume such reverse search only had one result
    certArn = response['Items'][0]['certArn']['S']
    # fetch taskToken from DynamoDB
    taskToken = response['Items'][0]['taskToken']['S']

    # delete such domain name in DynamoDB
    resp = dynamo_client.delete_item(
        TableName=callback_table,
        Key={
            'taskToken': {
                'S': taskToken
            },
            'domainName': {
                'S': domain_name
            }
        }
    )

    SubDomainNameList = event['input']['sanList'] if event['input']['sanList'] else None
    OriginsItemsDomainName = '%s' % event['input']['originsItemsDomainName'] if event['input']['originsItemsDomainName'] else None
    # cancatenate from OriginsItemsDomainName and random string
    OriginsItemsId = '%s-%s' % (str(uuid.uuid4())[:8], OriginsItemsDomainName)
    DefaultRootObject = ''
    OriginsItemsOriginPath = ''
    DefaultCacheBehaviorTargetOriginId = OriginsItemsId
    CertificateArn = certArn

    # customization configuration of CloudFront distribution
    config = default_distribution_config
    config['CallerReference'] = str(uuid.uuid4())
    config['Aliases']['Items'] = SubDomainNameList
    config['Aliases']['Quantity'] = len(config['Aliases']['Items'])
    config['DefaultRootObject'] = DefaultRootObject

    # support single origin for now, will support multiple origin in future TBD
    config['Origins']['Items'] = [
    {
        "Id": OriginsItemsId,
        "DomainName": OriginsItemsDomainName,
        "OriginPath": OriginsItemsOriginPath,
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
    config['DefaultCacheBehavior']['TargetOriginId'] = DefaultCacheBehaviorTargetOriginId
    config['DefaultCacheBehavior']['CachePolicyId'] = "658327ea-f89d-4fab-a63d-7e88639e58f6"
    # TBD, should search mapping certficate by tag
    config['ViewerCertificate']['ACMCertificateArn'] = CertificateArn
    config['ViewerCertificate']['MinimumProtocolVersion'] = "TLSv1.2_2019"
    config['ViewerCertificate']['Certificate'] = CertificateArn

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