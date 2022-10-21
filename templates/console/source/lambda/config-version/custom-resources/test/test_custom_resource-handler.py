import boto3
import pytest
import json
import os
from moto import mock_dynamodb, mock_iam, mock_events
from moto import mock_s3
from moto import mock_cloudfront
from typing import Optional

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
                "DomainName": "cloudfrontextnconsolesta-cloudfrontconfigversionc-152y5mcxm4aj9.s3.us-west-1.amazonaws.com",
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


def mock_get_distribution_config(*args, **kwargs):
    return {
        "ETag": "E2VAU5L5I1SDRU",
        "DistributionConfig": {
            "CallerReference": "bd8fd78e-390a-4a11-b5e3-4e71bc6a14e1",
            "Aliases": {
                "Quantity": 0
            },
            "DefaultRootObject": "",
            "Origins": {
                "Quantity": 1,
                "Items": [
                    {
                        "Id": "cloudfrontextnconsolesta-cloudfrontconfigversionc-152y5mcxm4aj9.s3.us-west-1.amazonaws.com",
                        "DomainName": "cloudfrontextnconsolesta-cloudfrontconfigversionc-152y5mcxm4aj9.s3.us-west-1.amazonaws.com",
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
                            "Enabled": "false"
                        }
                    }
                ]
            },
            "OriginGroups": {
                "Quantity": 0
            },
            "DefaultCacheBehavior": {
                "TargetOriginId": "cloudfrontextnconsolesta-cloudfrontconfigversionc-152y5mcxm4aj9.s3.us-west-1.amazonaws.com",
                "TrustedSigners": {
                    "Enabled": 'false',
                    "Quantity": 0
                },
                "TrustedKeyGroups": {
                    "Enabled": 'false',
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
                "SmoothStreaming": 'false',
                "Compress": 'true',
                "LambdaFunctionAssociations": {
                    "Quantity": 0
                },
                "FunctionAssociations": {
                    "Quantity": 0
                },
                "FieldLevelEncryptionId": "",
                "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6"
            },
            "CacheBehaviors": {
                "Quantity": 0
            },
            "CustomErrorResponses": {
                "Quantity": 0
            },
            "Comment": "",
            "Logging": {
                "Enabled": 'false',
                "IncludeCookies": 'false',
                "Bucket": "",
                "Prefix": ""
            },
            "PriceClass": "PriceClass_All",
            "Enabled": 'true',
            "ViewerCertificate": {
                "CloudFrontDefaultCertificate": 'true',
                "SSLSupportMethod": "vip",
                "MinimumProtocolVersion": "TLSv1",
                "CertificateSource": "cloudfront"
            },
            "Restrictions": {
                "GeoRestriction": {
                    "RestrictionType": "blacklist",
                    "Quantity": 2,
                    "Items": [
                        "AO",
                        "AL"
                    ]
                }
            },
            "WebACLId": "",
            "HttpVersion": "http2",
            "IsIPV6Enabled": 'true'
        }
    }


@mock_dynamodb
@mock_s3
@mock_cloudfront
def test_update_config_version(monkeypatch):
    monkeypatch.setenv('S3_BUCKET', 'CONFIG_VERSION_S3_BUCKET', prepend=False)
    monkeypatch.setenv('DDB_VERSION_TABLE_NAME', 'DDB_VERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_LATESTVERSION_TABLE_NAME', 'DDB_LATESTVERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_SNAPSHOT_TABLE_NAME', 'DDB_SNAPSHOT_TABLE_NAME', prepend=False)

    from custom_resource_handler import update_config_version

    ddb = boto3.resource(service_name="dynamodb")
    ddb.create_table(
        TableName='DDB_VERSION_TABLE_NAME',
        AttributeDefinitions=[
            {
                'AttributeName': 'distributionId',
                'AttributeType': 'S'
            },
            {
                'AttributeName': 'versionId',
                'AttributeType': 'N'
            },

        ],
        KeySchema=[
            {
                'AttributeName': 'distributionId',
                'KeyType': 'HASH'
            },
            {
                'AttributeName': 'versionId',
                'KeyType': 'RANGE'
            }
        ],
        BillingMode='PROVISIONED',
        ProvisionedThroughput={
            'ReadCapacityUnits': 10,
            'WriteCapacityUnits': 10
        },
    )
    ddb.create_table(
        TableName='DDB_LATESTVERSION_TABLE_NAME',
        AttributeDefinitions=[
            {
                'AttributeName': 'distributionId',
                'AttributeType': 'S'
            },
        ],
        KeySchema=[
            {
                'AttributeName': 'distributionId',
                'KeyType': 'HASH'
            },
        ],
        BillingMode='PROVISIONED',
        ProvisionedThroughput={
            'ReadCapacityUnits': 10,
            'WriteCapacityUnits': 10
        },
    )
    ddb_table = ddb.Table('DDB_LATESTVERSION_TABLE_NAME')
    distributionId = 'E1Z2Y3'

    ddb.create_table(
        TableName='DDB_SNAPSHOT_TABLE_NAME',
        AttributeDefinitions=[
            {
                'AttributeName': 'distributionId',
                'AttributeType': 'S'
            },
            {
                'AttributeName': 'snapShotName',
                'AttributeType': 'S'
            },

        ],
        KeySchema=[
            {
                'AttributeName': 'distributionId',
                'KeyType': 'HASH'
            },
            {
                'AttributeName': 'snapShotName',
                'KeyType': 'RANGE'
            }
        ],
        BillingMode='PROVISIONED',
        ProvisionedThroughput={
            'ReadCapacityUnits': 10,
            'WriteCapacityUnits': 10
        },

    )

    cf_client = boto3.client('cloudfront')
    resp = cf_client.create_distribution(DistributionConfig=default_distribution_config)
    monkeypatch.setattr(cf_client, "get_distribution_config", mock_get_distribution_config)

    s3_client = boto3.client('s3')
    s3_client.create_bucket(Bucket='CONFIG_VERSION_S3_BUCKET')
    # s3_client.put_object(Bucket='CONFIG_VERSION_S3_BUCKET', Key='config_version_1.json',
    #                       Body=json.dumps({"distributionId": "E1Z2Y3", "versionId": 1}))
    update_config_version(cf_client, distributionId)


@mock_dynamodb
@mock_s3
@mock_cloudfront
def test_update_config_version_with_existing_snapshot(monkeypatch):
    monkeypatch.setenv('S3_BUCKET', 'CONFIG_VERSION_S3_BUCKET', prepend=False)
    monkeypatch.setenv('DDB_VERSION_TABLE_NAME', 'DDB_VERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_LATESTVERSION_TABLE_NAME', 'DDB_LATESTVERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_SNAPSHOT_TABLE_NAME', 'DDB_SNAPSHOT_TABLE_NAME', prepend=False)

    from custom_resource_handler import update_config_version

    ddb = boto3.resource(service_name="dynamodb")
    ddb.create_table(
        TableName='DDB_VERSION_TABLE_NAME',
        AttributeDefinitions=[
            {
                'AttributeName': 'distributionId',
                'AttributeType': 'S'
            },
            {
                'AttributeName': 'versionId',
                'AttributeType': 'N'
            },

        ],
        KeySchema=[
            {
                'AttributeName': 'distributionId',
                'KeyType': 'HASH'
            },
            {
                'AttributeName': 'versionId',
                'KeyType': 'RANGE'
            }
        ],
        BillingMode='PROVISIONED',
        ProvisionedThroughput={
            'ReadCapacityUnits': 10,
            'WriteCapacityUnits': 10
        },
    )
    ddb.create_table(
        TableName='DDB_LATESTVERSION_TABLE_NAME',
        AttributeDefinitions=[
            {
                'AttributeName': 'distributionId',
                'AttributeType': 'S'
            },
        ],
        KeySchema=[
            {
                'AttributeName': 'distributionId',
                'KeyType': 'HASH'
            },
        ],
        BillingMode='PROVISIONED',
        ProvisionedThroughput={
            'ReadCapacityUnits': 10,
            'WriteCapacityUnits': 10
        },
    )
    distributionId = 'E1Z2Y3'

    ddb.create_table(
        TableName='DDB_SNAPSHOT_TABLE_NAME',
        AttributeDefinitions=[
            {
                'AttributeName': 'distributionId',
                'AttributeType': 'S'
            },
            {
                'AttributeName': 'snapShotName',
                'AttributeType': 'S'
            },

        ],
        KeySchema=[
            {
                'AttributeName': 'distributionId',
                'KeyType': 'HASH'
            },
            {
                'AttributeName': 'snapShotName',
                'KeyType': 'RANGE'
            }
        ],
        BillingMode='PROVISIONED',
        ProvisionedThroughput={
            'ReadCapacityUnits': 10,
            'WriteCapacityUnits': 10
        },
    )
    ddb_table = ddb.Table('DDB_SNAPSHOT_TABLE_NAME')
    ddb_table.put_item(Item={"distributionId": distributionId,
                             "snapShotName": "_LATEST_",
                             "versionId": 1})

    cf_client = boto3.client('cloudfront')
    resp = cf_client.create_distribution(DistributionConfig=default_distribution_config)
    monkeypatch.setattr(cf_client, "get_distribution_config", mock_get_distribution_config)

    s3_client = boto3.client('s3')
    s3_client.create_bucket(Bucket='CONFIG_VERSION_S3_BUCKET')
    # s3_client.put_object(Bucket='CONFIG_VERSION_S3_BUCKET', Key='config_version_1.json',
    #                       Body=json.dumps({"distributionId": "E1Z2Y3", "versionId": 1}))
    update_config_version(cf_client, distributionId)


@mock_iam
def test_create_iam_role(monkeypatch):
    monkeypatch.setenv('S3_BUCKET', 'CONFIG_VERSION_S3_BUCKET', prepend=False)
    monkeypatch.setenv('DDB_VERSION_TABLE_NAME', 'DDB_VERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_LATESTVERSION_TABLE_NAME', 'DDB_LATESTVERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_SNAPSHOT_TABLE_NAME', 'DDB_SNAPSHOT_TABLE_NAME', prepend=False)
    monkeypatch.setenv('AWS_REGION', 'us-east-1', prepend=False)

    class Context:
        aws_request_id = '1234567890'
        invoked_function_arn = 'arn:aws:lambda:us-east-1:1234567890:function:custom-resource-handler'

    from custom_resource_handler import create_iam_role

    create_iam_role(Context())


@mock_events
def test_create_eventbridge_in_us_east_1(monkeypatch):
    monkeypatch.setenv('S3_BUCKET', 'CONFIG_VERSION_S3_BUCKET', prepend=False)
    monkeypatch.setenv('DDB_VERSION_TABLE_NAME', 'DDB_VERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_LATESTVERSION_TABLE_NAME', 'DDB_LATESTVERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_SNAPSHOT_TABLE_NAME', 'DDB_SNAPSHOT_TABLE_NAME', prepend=False)
    monkeypatch.setenv('AWS_REGION', 'us-east-1', prepend=False)

    class Context:
        aws_request_id = '1234567890'
        invoked_function_arn = 'arn:aws:lambda:us-east-1:1234567890:function:custom-resource-handler'

    from custom_resource_handler import create_eventbridge_in_us_east_1

    create_eventbridge_in_us_east_1(Context())


@mock_events
@mock_iam
def test_create_eventbridge_in_us_east_1_in_other_region(monkeypatch):
    monkeypatch.setenv('S3_BUCKET', 'CONFIG_VERSION_S3_BUCKET', prepend=False)
    monkeypatch.setenv('DDB_VERSION_TABLE_NAME', 'DDB_VERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_LATESTVERSION_TABLE_NAME', 'DDB_LATESTVERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_SNAPSHOT_TABLE_NAME', 'DDB_SNAPSHOT_TABLE_NAME', prepend=False)
    monkeypatch.setenv('AWS_REGION', 'us-west-1', prepend=False)

    class Context:
        aws_request_id = '1234567890'
        invoked_function_arn = 'arn:aws:lambda:us-west-1:1234567890:function:custom-resource-handler'

    from custom_resource_handler import create_eventbridge_in_us_east_1

    create_eventbridge_in_us_east_1(Context())


@mock_cloudfront
def test_get_all_distribution_ids(monkeypatch):
    monkeypatch.setenv('S3_BUCKET', 'CONFIG_VERSION_S3_BUCKET', prepend=False)
    monkeypatch.setenv('DDB_VERSION_TABLE_NAME', 'DDB_VERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_LATESTVERSION_TABLE_NAME', 'DDB_LATESTVERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_SNAPSHOT_TABLE_NAME', 'DDB_SNAPSHOT_TABLE_NAME', prepend=False)
    monkeypatch.setenv('AWS_REGION', 'us-east-1', prepend=False)

    from custom_resource_handler import get_all_distribution_ids
    cf_client = boto3.client('cloudfront')
    resp = cf_client.create_distribution(DistributionConfig=default_distribution_config)
    get_all_distribution_ids(cf_client)


@mock_cloudfront
@mock_dynamodb
@mock_s3
@mock_iam
@mock_events
def test_import_cloudfront_configs(monkeypatch):
    monkeypatch.setenv('S3_BUCKET', 'CONFIG_VERSION_S3_BUCKET', prepend=False)
    monkeypatch.setenv('DDB_VERSION_TABLE_NAME', 'DDB_VERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_LATESTVERSION_TABLE_NAME', 'DDB_LATESTVERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_SNAPSHOT_TABLE_NAME', 'DDB_SNAPSHOT_TABLE_NAME', prepend=False)
    monkeypatch.setenv('AWS_REGION', 'us-east-1', prepend=False)

    from custom_resource_handler import get_all_distribution_ids
    from custom_resource_handler import import_cloudfront_configs

    cf_client = boto3.client('cloudfront')
    resp = cf_client.create_distribution(DistributionConfig=default_distribution_config)
    distributionId = resp['Distribution']['Id']
    monkeypatch.setattr(cf_client, "get_distribution_config", mock_get_distribution_config)

    ddb = boto3.resource('dynamodb')
    ddb.create_table(
        TableName='DDB_LATESTVERSION_TABLE_NAME',
        AttributeDefinitions=[
            {
                'AttributeName': 'distributionId',
                'AttributeType': 'S'
            },
        ],
        KeySchema=[
            {
                'AttributeName': 'distributionId',
                'KeyType': 'HASH'
            },
        ],
        BillingMode='PROVISIONED',
        ProvisionedThroughput={
            'ReadCapacityUnits': 10,
            'WriteCapacityUnits': 10
        },
    )
    ddb.create_table(
        TableName='DDB_VERSION_TABLE_NAME',
        AttributeDefinitions=[
            {
                'AttributeName': 'distributionId',
                'AttributeType': 'S'
            },
            {
                'AttributeName': 'versionId',
                'AttributeType': 'N'
            },

        ],
        KeySchema=[
            {
                'AttributeName': 'distributionId',
                'KeyType': 'HASH'
            },
            {
                'AttributeName': 'versionId',
                'KeyType': 'RANGE'
            }
        ],
        BillingMode='PROVISIONED',
        ProvisionedThroughput={
            'ReadCapacityUnits': 10,
            'WriteCapacityUnits': 10
        },
    )
    ddb.create_table(
        TableName='DDB_SNAPSHOT_TABLE_NAME',
        AttributeDefinitions=[
            {
                'AttributeName': 'distributionId',
                'AttributeType': 'S'
            },
            {
                'AttributeName': 'snapShotName',
                'AttributeType': 'S'
            },

        ],
        KeySchema=[
            {
                'AttributeName': 'distributionId',
                'KeyType': 'HASH'
            },
            {
                'AttributeName': 'snapShotName',
                'KeyType': 'RANGE'
            }
        ],
        BillingMode='PROVISIONED',
        ProvisionedThroughput={
            'ReadCapacityUnits': 10,
            'WriteCapacityUnits': 10
        },
    )
    ddb_table = ddb.Table('DDB_SNAPSHOT_TABLE_NAME')
    ddb_table.put_item(Item={"distributionId": distributionId,
                             "snapShotName": "_LATEST_",
                             "versionId": 1})

    s3_client = boto3.client('s3')
    s3_client.create_bucket(Bucket='CONFIG_VERSION_S3_BUCKET')
    cf_dist_list = get_all_distribution_ids(cf_client)
    import_cloudfront_configs(cf_client, cf_dist_list)
