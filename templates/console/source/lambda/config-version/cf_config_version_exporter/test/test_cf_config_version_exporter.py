import boto3
import pytest
import json
from moto import mock_dynamodb
from moto import mock_cloudfront
from moto import mock_s3


@mock_dynamodb
@mock_cloudfront
@mock_s3
def test_get_distributionId(monkeypatch):
    monkeypatch.setenv('S3_BUCKET', 'CONFIG_VERSION_S3_BUCKET', prepend=False)
    monkeypatch.setenv('DDB_VERSION_TABLE_NAME', 'DDB_VERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_LATESTVERSION_TABLE_NAME', 'DDB_LATESTVERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_SNAPSHOT_TABLE_NAME', 'DDB_SNAPSHOT_TABLE_NAME', prepend=False)

    from cf_config_version_exporter import get_distributionId

    event = {
        "detail": {
            "eventName": 'CreateDistribution',
            "responseElements": {
                "requestParameters": {
                    "id": 'E1Z1Z1Z1Z1Z1Z1'
                }
            },
            "responseElements": {
                "distribution": {
                    "id": 'E1Z1Z1Z1Z1Z1Z1'
                }
            }
        }
    }

    result = get_distributionId(event)
    assert result == 'E1Z1Z1Z1Z1Z1Z1'


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
@mock_cloudfront
@mock_s3
def test_update_config_version(monkeypatch):
    cloudfront = boto3.client('cloudfront', region_name='us-west-2')
    resp = cloudfront.create_distribution(DistributionConfig=default_distribution_config)
    print(resp['Distribution']['Id'])

    monkeypatch.setenv('S3_BUCKET', 'CONFIG_VERSION_S3_BUCKET', prepend=False)
    monkeypatch.setenv('DDB_VERSION_TABLE_NAME', 'DDB_VERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_LATESTVERSION_TABLE_NAME', 'DDB_LATESTVERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_SNAPSHOT_TABLE_NAME', 'DDB_SNAPSHOT_TABLE_NAME', prepend=False)

    from cf_config_version_exporter import lambda_handler
    from cf_config_version_exporter import update_config_version
    distribution_id = resp['Distribution']['Id']

    def mock_s3_upload_file(*args, **kwargs):
        return ""

    cf_client = boto3.client('cloudfront')
    monkeypatch.setattr(cf_client, "get_distribution_config", mock_get_distribution_config)

    s3_client = boto3.client('s3')
    monkeypatch.setattr(s3_client, "upload_file", mock_s3_upload_file)

    ddb = boto3.resource(service_name="dynamodb", region_name="us-east-1")
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
    ddb_table = ddb.Table('DDB_LATESTVERSION_TABLE_NAME')
    resp = ddb_table.put_item(
        Item={
            'distributionId': distribution_id,
            'versionId': 0,
        }
    )

    result = update_config_version(distribution_id, cf_client, s3_client, ddb)

    assert result == {
        'statusCode': 200,
        'body': 'succeed'
    }


@mock_dynamodb
@mock_cloudfront
@mock_s3
def test_update_config_version_without_latest_item(monkeypatch):
    cloudfront = boto3.client('cloudfront', region_name='us-west-2')
    resp = cloudfront.create_distribution(DistributionConfig=default_distribution_config)
    print(resp['Distribution']['Id'])

    monkeypatch.setenv('S3_BUCKET', 'CONFIG_VERSION_S3_BUCKET', prepend=False)
    monkeypatch.setenv('DDB_VERSION_TABLE_NAME', 'DDB_VERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_LATESTVERSION_TABLE_NAME', 'DDB_LATESTVERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_SNAPSHOT_TABLE_NAME', 'DDB_SNAPSHOT_TABLE_NAME', prepend=False)

    from cf_config_version_exporter import lambda_handler
    from cf_config_version_exporter import update_config_version
    distribution_id = resp['Distribution']['Id']

    def mock_s3_upload_file(*args, **kwargs):
        return ""

    cf_client = boto3.client('cloudfront')
    monkeypatch.setattr(cf_client, "get_distribution_config", mock_get_distribution_config)

    s3_client = boto3.client('s3')
    monkeypatch.setattr(s3_client, "upload_file", mock_s3_upload_file)

    ddb = boto3.resource(service_name="dynamodb", region_name="us-east-1")
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

    result = update_config_version(distribution_id, cf_client, s3_client, ddb)

    assert result == {
        'statusCode': 200,
        'body': 'succeed'
    }


@mock_dynamodb
@mock_cloudfront
@mock_s3
def test_update_config_version_with_update_snapshot(monkeypatch):
    cloudfront = boto3.client('cloudfront', region_name='us-west-2')
    resp = cloudfront.create_distribution(DistributionConfig=default_distribution_config)
    print(resp['Distribution']['Id'])

    monkeypatch.setenv('S3_BUCKET', 'CONFIG_VERSION_S3_BUCKET', prepend=False)
    monkeypatch.setenv('DDB_VERSION_TABLE_NAME', 'DDB_VERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_LATESTVERSION_TABLE_NAME', 'DDB_LATESTVERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_SNAPSHOT_TABLE_NAME', 'DDB_SNAPSHOT_TABLE_NAME', prepend=False)

    from cf_config_version_exporter import lambda_handler
    from cf_config_version_exporter import update_config_version
    distribution_id = resp['Distribution']['Id']

    def mock_s3_upload_file(*args, **kwargs):
        return ""

    cf_client = boto3.client('cloudfront')
    monkeypatch.setattr(cf_client, "get_distribution_config", mock_get_distribution_config)

    s3_client = boto3.client('s3')
    monkeypatch.setattr(s3_client, "upload_file", mock_s3_upload_file)

    ddb = boto3.resource(service_name="dynamodb", region_name="us-east-1")
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
    ddb_table = ddb.Table('DDB_LATESTVERSION_TABLE_NAME')
    resp = ddb_table.put_item(
        Item={
            'distributionId': distribution_id,
            'versionId': 0,
        }
    )
    ddb_table = ddb.Table('DDB_SNAPSHOT_TABLE_NAME')
    resp = ddb_table.put_item(
        Item={
            'distributionId': distribution_id,
            'snapShotName': "_LATEST_",
        }
    )

    result = update_config_version(distribution_id, cf_client, s3_client, ddb)

    assert result == {
        'statusCode': 200,
        'body': 'succeed'
    }
