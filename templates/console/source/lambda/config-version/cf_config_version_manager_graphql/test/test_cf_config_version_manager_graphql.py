from unittest import mock

import boto3
import pytest
import json
import os
from moto import mock_dynamodb
from moto import mock_cloudfront
from moto import mock_s3
from typing import Optional


def mock_get_query_string_value(name: str, default_value: Optional[str] = None):
    if name == "distributionId":
        return "E1Z2Y3"
    if name == "version1":
        return "1"
    if name == "version2":
        return "2"
    if name == "versionId":
        return "1"
    if name == "snapShotName":
        return "test snapshot"
    if name == "snapShotNote":
        return "test snapshot is created just for UT"


@mock_dynamodb
@mock_s3
def test_lambda_handler(monkeypatch):
    monkeypatch.setenv('S3_BUCKET', 'CONFIG_VERSION_S3_BUCKET', prepend=False)
    monkeypatch.setenv('DDB_VERSION_TABLE_NAME', 'DDB_VERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_LATESTVERSION_TABLE_NAME', 'DDB_LATESTVERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_SNAPSHOT_TABLE_NAME', 'DDB_SNAPSHOT_TABLE_NAME', prepend=False)

    from cf_config_version_manager_graphql import manager_version_diff

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

    ddb_table = ddb.Table('DDB_VERSION_TABLE_NAME')
    distributionId = 'E1Z2Y3'
    resp = ddb_table.put_item(
        Item={
            'distributionId': distributionId,
            'versionId': 1,
            's3_bucket': 'CONFIG_VERSION_S3_BUCKET',
            's3_key': 'config_version_1.json',

        }
    )

    resp = ddb_table.put_item(
        Item={
            'distributionId': distributionId,
            'versionId': 2,
            's3_bucket': 'CONFIG_VERSION_S3_BUCKET',
            's3_key': 'config_version_2.json',
        }
    )

    def mock_s3_download_file(*args, **kwargs):
        return "ddddd"

    s3_client = boto3.client('s3')
    s3_client.create_bucket(Bucket='CONFIG_VERSION_S3_BUCKET')
    s3_client.put_object(Bucket='CONFIG_VERSION_S3_BUCKET', Key='config_version_1.json',
                         Body=json.dumps({"distributionId": "E1Z2Y3", "versionId": 1}))
    s3_client.put_object(Bucket='CONFIG_VERSION_S3_BUCKET', Key='config_version_2.json',
                         Body=json.dumps({"distributionId": "E1Z2Y3", "versionId": 2}))
    monkeypatch.setattr(s3_client, "download_file", mock_s3_download_file)

    response = manager_version_diff(distributionId, "1", "2")


@mock_dynamodb
@mock_s3
def test_get_version_diff(monkeypatch):
    monkeypatch.setenv('S3_BUCKET', 'CONFIG_VERSION_S3_BUCKET', prepend=False)
    monkeypatch.setenv('DDB_VERSION_TABLE_NAME', 'DDB_VERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_LATESTVERSION_TABLE_NAME', 'DDB_LATESTVERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_SNAPSHOT_TABLE_NAME', 'DDB_SNAPSHOT_TABLE_NAME', prepend=False)

    from cf_config_version_manager_graphql import get_version_diff

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
    ddb_table = ddb.Table('DDB_VERSION_TABLE_NAME')
    distributionId = 'E1Z2Y3'
    resp = ddb_table.put_item(
        Item={
            'distributionId': distributionId,
            'versionId': 1,
            's3_bucket': 'CONFIG_VERSION_S3_BUCKET',
            's3_key': 'config_version_1.json',

        }
    )
    resp = ddb_table.put_item(
        Item={
            'distributionId': distributionId,
            'versionId': 2,
            's3_bucket': 'CONFIG_VERSION_S3_BUCKET',
            's3_key': 'config_version_2.json',
        }
    )

    def mock_s3_download_file(*args, **kwargs):
        return "ddddd"

    s3_client = boto3.client('s3')
    monkeypatch.setattr(s3_client, "download_file", mock_s3_download_file)

    diff = get_version_diff(s3_client, distributionId, '1', '2')


@mock_dynamodb
@mock_s3
def test_get_snapshot_diff(monkeypatch):
    monkeypatch.setenv('S3_BUCKET', 'CONFIG_VERSION_S3_BUCKET', prepend=False)
    monkeypatch.setenv('DDB_VERSION_TABLE_NAME', 'DDB_VERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_LATESTVERSION_TABLE_NAME', 'DDB_LATESTVERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_SNAPSHOT_TABLE_NAME', 'DDB_SNAPSHOT_TABLE_NAME', prepend=False)

    from cf_config_version_manager_graphql import get_snapshot_diff

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

    ddb_table = ddb.Table('DDB_VERSION_TABLE_NAME')
    distributionId = 'E1Z2Y3'
    resp = ddb_table.put_item(
        Item={
            'distributionId': distributionId,
            'versionId': 1,
            's3_bucket': 'CONFIG_VERSION_S3_BUCKET',
            's3_key': 'config_version_1.json',

        }
    )
    resp = ddb_table.put_item(
        Item={
            'distributionId': distributionId,
            'versionId': 2,
            's3_bucket': 'CONFIG_VERSION_S3_BUCKET',
            's3_key': 'config_version_2.json',
        }
    )

    ddb_table = ddb.Table('DDB_SNAPSHOT_TABLE_NAME')
    resp = ddb_table.put_item(
        Item={
            'distributionId': distributionId,
            'snapShotName': 'snapshot1',
            'versionId': 1,
        }
    )
    resp = ddb_table.put_item(
        Item={
            'distributionId': distributionId,
            'snapShotName': 'snapshot2',
            'versionId': 2,
        }
    )

    def mock_s3_download_file(s3_bucket, s3_key, version):
        print('mock_s3_download_file')
        return "ddddd"

    s3_client = boto3.client('s3')
    monkeypatch.setattr(s3_client, "download_file", mock_s3_download_file)

    diff = get_snapshot_diff(s3_client, distributionId, 'snapshot1', 'snapshot2')


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
def test_apply_config_version(monkeypatch):
    monkeypatch.setenv('S3_BUCKET', 'CONFIG_VERSION_S3_BUCKET', prepend=False)
    monkeypatch.setenv('DDB_VERSION_TABLE_NAME', 'DDB_VERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_LATESTVERSION_TABLE_NAME', 'DDB_LATESTVERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_SNAPSHOT_TABLE_NAME', 'DDB_SNAPSHOT_TABLE_NAME', prepend=False)

    from cf_config_version_manager_graphql import apply_config_version

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

    ddb_table = ddb.Table('DDB_VERSION_TABLE_NAME')
    distributionId = 'E1Z2Y3'
    target_distributionId = 'E1Z2Y4'
    resp = ddb_table.put_item(
        Item={
            'distributionId': distributionId,
            'versionId': 1,
            's3_bucket': 'CONFIG_VERSION_S3_BUCKET',
            's3_key': 'config_version_1.json',

        }
    )
    resp = ddb_table.put_item(
        Item={
            'distributionId': target_distributionId,
            'versionId': 1,
            's3_bucket': 'CONFIG_VERSION_S3_BUCKET',
            's3_key': 'config_version_1.json',

        }
    )
    resp = ddb_table.put_item(
        Item={
            'distributionId': distributionId,
            'versionId': 2,
            's3_bucket': 'CONFIG_VERSION_S3_BUCKET',
            's3_key': 'config_version_2.json',
        }
    )

    def mock_s3_download_file(s3_bucket, s3_key, local_config_file_name_version):
        # create file in /tmp directory
        print('mock_s3_download_file')
        if os.path.exists(local_config_file_name_version):
            print('file already exists')
            os.remove(local_config_file_name_version)

        # create a file
        with open(local_config_file_name_version, 'w') as fp:
            # uncomment if you want empty file
            print("---------")
            print(json.dumps(default_distribution_config))
            fp.write(json.dumps(default_distribution_config))

        return "ddddd"

    def mock_update_distribution(*args, **kwargs):
        return "succeed"

    s3_client = boto3.client('s3')
    monkeypatch.setattr(s3_client, "download_file", mock_s3_download_file)

    cf_client = boto3.client('cloudfront')
    resp = cf_client.create_distribution(DistributionConfig=default_distribution_config)
    monkeypatch.setattr(cf_client, "get_distribution_config", mock_get_distribution_config)
    print("created distribution id is " + str(resp['Distribution']['Id']))

    monkeypatch.setattr(cf_client, "update_distribution", mock_update_distribution)

    result = apply_config_version(s3_client, cf_client, distributionId, '1', resp['Distribution']['Id'])
    assert result == "target distributions been updated"


def test_validate_input_parameters(monkeypatch):
    from cf_config_version_manager_graphql import validate_input_parameters
    with pytest.raises(Exception):
        validate_input_parameters("", "Source Snapshot", ",")
    with pytest.raises(Exception):
        validate_input_parameters("DISTRIBUTION_ID", "", ",")
    with pytest.raises(Exception):
        validate_input_parameters("DISTRIBUTION_ID", "Source Snapshot Name", "  ,dfdf")


@mock_dynamodb
def test_get_snapshot_version(monkeypatch):
    monkeypatch.setenv('S3_BUCKET', 'CONFIG_VERSION_S3_BUCKET', prepend=False)
    monkeypatch.setenv('DDB_VERSION_TABLE_NAME', 'DDB_VERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_LATESTVERSION_TABLE_NAME', 'DDB_LATESTVERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_SNAPSHOT_TABLE_NAME', 'DDB_SNAPSHOT_TABLE_NAME', prepend=False)
    from cf_config_version_manager_graphql import get_snapshot_version
    ddb_client = boto3.resource('dynamodb')
    ddb_client.create_table(
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
    ddb_snapshot_table = ddb_client.Table('DDB_SNAPSHOT_TABLE_NAME')

    resp = ddb_snapshot_table.put_item(
        Item={
            'distributionId': 'DIST_ID',
            'snapShotName': 'snapshot1',
            'versionId': 1,
        }
    )
    ddb_snapshot_table = ddb_client.Table('DDB_SNAPSHOT_TABLE_NAME')

    rc_version = get_snapshot_version(ddb_snapshot_table, 'snapshot1', 'DIST_ID')


@mock_dynamodb
@mock_s3
def test_download_version_config(monkeypatch):
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

    ddb_table = ddb.Table('DDB_VERSION_TABLE_NAME')

    distributionId = 'E1Z2Y3'
    resp = ddb_table.put_item(
        Item={
            'distributionId': distributionId,
            'versionId': 1,
            's3_bucket': 'CONFIG_VERSION_S3_BUCKET',
            's3_key': 'config_version_1.json',

        }
    )
    s3_client = boto3.client('s3')

    def mock_s3_download_file(s3_bucket, s3_key, version):
        print('mock_s3_download_file')

    return "download succeed"
    monkeypatch.setattr(s3_client, "download_file", mock_s3_download_file)
    result = download_version_config(ddb_table, distributionId, '1')
    print(result)
    assert result == "download succeed"


@mock_dynamodb
@mock_cloudfront
@mock_s3
def test_apply_distribution_from_local_config(monkeypatch):
    monkeypatch.setenv('S3_BUCKET', 'CONFIG_VERSION_S3_BUCKET', prepend=False)
    monkeypatch.setenv('DDB_VERSION_TABLE_NAME', 'DDB_VERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_LATESTVERSION_TABLE_NAME', 'DDB_LATESTVERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_SNAPSHOT_TABLE_NAME', 'DDB_SNAPSHOT_TABLE_NAME', prepend=False)

    from cf_config_version_manager_graphql import apply_distribution_from_local_config

    ddb = boto3.resource(service_name="dynamodb")
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
    target_distributionId = 'E1Z2Y4'
    resp = ddb_table.put_item(
        Item={
            'distributionId': distributionId,
            'versionId': 1,
            's3_bucket': 'CONFIG_VERSION_S3_BUCKET',
            's3_key': 'config_version_1.json',
        }
    )
    resp = ddb_table.put_item(
        Item={
            'distributionId': target_distributionId,
            'versionId': 1,
            's3_bucket': 'CONFIG_VERSION_S3_BUCKET',
            's3_key': 'config_version_1.json',
        }
    )
    resp = ddb_table.put_item(
        Item={
            'distributionId': distributionId,
            'versionId': 2,
            's3_bucket': 'CONFIG_VERSION_S3_BUCKET',
            's3_key': 'config_version_2.json',
        }
    )

    def mock_s3_download_file(s3_bucket, s3_key, local_config_file_name_version):
        # create file in /tmp directory
        print('mock_s3_download_file')
        if os.path.exists(local_config_file_name_version):
            print('file already exists')
            os.remove(local_config_file_name_version)

        # create a file
        with open(local_config_file_name_version, 'w') as fp:
            # uncomment if you want empty file
            print("---------")
            print(json.dumps(default_distribution_config))
            fp.write(json.dumps(default_distribution_config))

        return "ddddd"

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

    s3_client = boto3.client('s3')

    monkeypatch.setattr(s3_client, "download_file", mock_s3_download_file)

    cf_client = boto3.client('cloudfront')

    def mock_update_distribution(*args, **kwargs):
        return "succeed"

    monkeypatch.setattr(cf_client, "update_distribution", mock_update_distribution)
    monkeypatch.setattr(cf_client, "get_distribution_config", mock_get_distribution_config)

    snapshot_name = "test snapshot"
    local_config_file_path = "/tmp/cloudfront_extension_config_version_1.json"
    if os.path.exists(local_config_file_path):
        print('file already exists')
        os.remove(local_config_file_path)

        # create a file
    with open(local_config_file_path, 'w') as fp:
        # uncomment if you want empty file
        print("---------")
        print(json.dumps(default_distribution_config))
        fp.write(json.dumps(default_distribution_config))

    result = apply_distribution_from_local_config(cf_client, ddb_table, local_config_file_path, snapshot_name,
                                                  'DISTRIBUTION_ID')
    assert result == None


@mock_dynamodb
@mock_cloudfront
@mock_s3
def test_update_config_version_note(monkeypatch):
    monkeypatch.setenv('S3_BUCKET', 'CONFIG_VERSION_S3_BUCKET', prepend=False)
    monkeypatch.setenv('DDB_VERSION_TABLE_NAME', 'DDB_VERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_LATESTVERSION_TABLE_NAME', 'DDB_LATESTVERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_SNAPSHOT_TABLE_NAME', 'DDB_SNAPSHOT_TABLE_NAME', prepend=False)

    from cf_config_version_manager_graphql import update_config_version_note

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
    ddb_table = ddb.Table('DDB_VERSION_TABLE_NAME')
    distributionId = 'E1Z2Y3'
    resp = ddb_table.put_item(
        Item={
            'distributionId': distributionId,
            'versionId': 1,
            's3_bucket': 'CONFIG_VERSION_S3_BUCKET',
            's3_key': 'config_version_1.json',

        }
    )

    update_config_version_note(ddb_table, distributionId, "New Note", 1)


@mock_dynamodb
def test_get_version_content(monkeypatch):
    monkeypatch.setenv('S3_BUCKET', 'CONFIG_VERSION_S3_BUCKET', prepend=False)
    monkeypatch.setenv('DDB_VERSION_TABLE_NAME', 'DDB_VERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_LATESTVERSION_TABLE_NAME', 'DDB_LATESTVERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_SNAPSHOT_TABLE_NAME', 'DDB_SNAPSHOT_TABLE_NAME', prepend=False)

    from cf_config_version_manager_graphql import get_version_content
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

    ddb_table = ddb.Table('DDB_VERSION_TABLE_NAME')
    distributionId = 'E1Z2Y3'
    resp = ddb_table.put_item(
        Item={
            'distributionId': distributionId,
            'versionId': 1,
            's3_bucket': 'CONFIG_VERSION_S3_BUCKET',
            's3_key': 'config_version_1.json',
            'note': 'test note'

        }
    )
    result = get_version_content(ddb_table, distributionId, "1")
    assert result['note'] == 'test note'


@mock_dynamodb
def test_get_config_snapshot(monkeypatch):
    monkeypatch.setenv('S3_BUCKET', 'CONFIG_VERSION_S3_BUCKET', prepend=False)
    monkeypatch.setenv('DDB_VERSION_TABLE_NAME', 'DDB_VERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_LATESTVERSION_TABLE_NAME', 'DDB_LATESTVERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_SNAPSHOT_TABLE_NAME', 'DDB_SNAPSHOT_TABLE_NAME', prepend=False)

    from cf_config_version_manager_graphql import get_version_content
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

    ddb_table = ddb.Table('DDB_VERSION_TABLE_NAME')
    distributionId = 'E1Z2Y3'
    resp = ddb_table.put_item(
        Item={
            'distributionId': distributionId,
            'versionId': 1,
            's3_bucket': 'CONFIG_VERSION_S3_BUCKET',
            's3_key': 'config_version_1.json',
            'note': 'test note'

        }
    )
    result = get_version_content(ddb_table, distributionId, "1")
    assert result['note'] == 'test note'


@mock_cloudfront
def test_get_all_distribution_ids(monkeypatch):
    monkeypatch.setenv('S3_BUCKET', 'CONFIG_VERSION_S3_BUCKET', prepend=False)
    monkeypatch.setenv('DDB_VERSION_TABLE_NAME', 'DDB_VERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_LATESTVERSION_TABLE_NAME', 'DDB_LATESTVERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_SNAPSHOT_TABLE_NAME', 'DDB_SNAPSHOT_TABLE_NAME', prepend=False)

    from cf_config_version_manager_graphql import get_all_distribution_ids

    cf_client = boto3.client('cloudfront')
    resp = cf_client.create_distribution(DistributionConfig=default_distribution_config)

    resp = get_all_distribution_ids()


@mock_cloudfront
@mock_dynamodb
def test_manager_version_config_cf_list(monkeypatch):
    monkeypatch.setenv('S3_BUCKET', 'CONFIG_VERSION_S3_BUCKET', prepend=False)
    monkeypatch.setenv('DDB_VERSION_TABLE_NAME', 'DDB_VERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_LATESTVERSION_TABLE_NAME', 'DDB_LATESTVERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_SNAPSHOT_TABLE_NAME', 'DDB_SNAPSHOT_TABLE_NAME', prepend=False)

    from cf_config_version_manager_graphql import manager_version_config_cf_list

    cf_client = boto3.client('cloudfront')
    resp = cf_client.create_distribution(DistributionConfig=default_distribution_config)
    distribution_id = resp['Distribution']['Id']

    ddb = boto3.resource(service_name="dynamodb")
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
    ddb_table = ddb.Table('DDB_SNAPSHOT_TABLE_NAME')
    resp = ddb_table.put_item(
        Item={
            'distributionId': distribution_id,
            'snapShotName': 'test snapshot',
            's3_bucket': 'CONFIG_VERSION_S3_BUCKET',
            's3_key': 'config_version_1.json',

        }
    )

    ddb_table = ddb.Table('DDB_LATESTVERSION_TABLE_NAME')
    resp = ddb_table.put_item(
        Item={
            'distributionId': distribution_id,
            'versionId': 1,
            's3_bucket': 'CONFIG_VERSION_S3_BUCKET',
            's3_key': 'config_version_1.json',
        }
    )

    resp = manager_version_config_cf_list()


@mock_cloudfront
def test_manager_get_cf_cname_info(monkeypatch):
    monkeypatch.setenv('S3_BUCKET', 'CONFIG_VERSION_S3_BUCKET', prepend=False)
    monkeypatch.setenv('DDB_VERSION_TABLE_NAME', 'DDB_VERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_LATESTVERSION_TABLE_NAME', 'DDB_LATESTVERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_SNAPSHOT_TABLE_NAME', 'DDB_SNAPSHOT_TABLE_NAME', prepend=False)

    from cf_config_version_manager_graphql import manager_get_cf_cname_info

    cf_client = boto3.client('cloudfront')
    resp = cf_client.create_distribution(DistributionConfig=default_distribution_config)

    monkeypatch.setattr(cf_client, "get_distribution_config", mock_get_distribution_config)

    # TODO: cf_client failed to be mocked, will investigate later
    # resp = manager_get_cf_cname_info()


@mock_cloudfront
def test_get_distribution_cname_info(monkeypatch):
    monkeypatch.setenv('S3_BUCKET', 'CONFIG_VERSION_S3_BUCKET', prepend=False)
    monkeypatch.setenv('DDB_VERSION_TABLE_NAME', 'DDB_VERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_LATESTVERSION_TABLE_NAME', 'DDB_LATESTVERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_SNAPSHOT_TABLE_NAME', 'DDB_SNAPSHOT_TABLE_NAME', prepend=False)

    from cf_config_version_manager_graphql import get_distribution_cname_info

    cf_client = boto3.client('cloudfront')
    resp = cf_client.create_distribution(DistributionConfig=default_distribution_config)

    monkeypatch.setattr(cf_client, "get_distribution_config", mock_get_distribution_config)

    # resp = manager_get_cf_cname_info()
    resp = get_distribution_cname_info(cf_client, "EZ1")


@mock_dynamodb
def test_manager_get_applied_snapshot_name(monkeypatch):
    monkeypatch.setenv('S3_BUCKET', 'CONFIG_VERSION_S3_BUCKET', prepend=False)
    monkeypatch.setenv('DDB_VERSION_TABLE_NAME', 'DDB_VERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_LATESTVERSION_TABLE_NAME', 'DDB_LATESTVERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_SNAPSHOT_TABLE_NAME', 'DDB_SNAPSHOT_TABLE_NAME', prepend=False)

    from cf_config_version_manager_graphql import manager_get_applied_snapshot_name

    ddb = boto3.resource(service_name="dynamodb")
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
    resp = ddb_table.put_item(
        Item={
            'distributionId': distributionId,
            'versionId': 1,
            's3_bucket': 'CONFIG_VERSION_S3_BUCKET',
            's3_key': 'config_version_1.json',
        }
    )
    response = manager_get_applied_snapshot_name(distributionId)


@mock_dynamodb
def test_manager_version_get_link(monkeypatch):
    monkeypatch.setenv('S3_BUCKET', 'CONFIG_VERSION_S3_BUCKET', prepend=False)
    monkeypatch.setenv('DDB_VERSION_TABLE_NAME', 'DDB_VERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_LATESTVERSION_TABLE_NAME', 'DDB_LATESTVERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_SNAPSHOT_TABLE_NAME', 'DDB_SNAPSHOT_TABLE_NAME', prepend=False)

    from cf_config_version_manager_graphql import manager_version_get_link

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
    ddb_table = ddb.Table('DDB_VERSION_TABLE_NAME')
    distributionId = 'E1Z2Y3'
    resp = ddb_table.put_item(
        Item={
            'distributionId': distributionId,
            'versionId': 1,
            's3_bucket': 'CONFIG_VERSION_S3_BUCKET',
            's3_key': 'config_version_1.json',
            'config_link': "s3://config_version_1.json"

        }
    )
    response = manager_version_get_link(distributionId, "1")


@mock_dynamodb
def test_manager_snapshot_get_link(monkeypatch):
    monkeypatch.setenv('S3_BUCKET', 'CONFIG_VERSION_S3_BUCKET', prepend=False)
    monkeypatch.setenv('DDB_VERSION_TABLE_NAME', 'DDB_VERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_LATESTVERSION_TABLE_NAME', 'DDB_LATESTVERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_SNAPSHOT_TABLE_NAME', 'DDB_SNAPSHOT_TABLE_NAME', prepend=False)

    from cf_config_version_manager_graphql import manager_snapshot_get_link

    distributionId = 'E1Z2Y3'

    ddb = boto3.resource(service_name="dynamodb")
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
    ddb_table.put_item(
        Item={
            'distributionId': distributionId,
            'snapShotName': 'test snapshot',
            'versionId': 2,
        }
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
    ddb_table = ddb.Table('DDB_VERSION_TABLE_NAME')
    resp = ddb_table.put_item(
        Item={
            'distributionId': distributionId,
            'versionId': 2,
            's3_bucket': 'CONFIG_VERSION_S3_BUCKET',
            's3_key': 'config_version_1.json',
            'config_link': "s3://config_version_1.json"
        }
    )

    response = manager_snapshot_get_link(distributionId, "test snapshot")


@mock_dynamodb
@mock_s3
def test_manager_version_get_content(monkeypatch):
    monkeypatch.setenv('S3_BUCKET', 'CONFIG_VERSION_S3_BUCKET', prepend=False)
    monkeypatch.setenv('DDB_VERSION_TABLE_NAME', 'DDB_VERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_LATESTVERSION_TABLE_NAME', 'DDB_LATESTVERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_SNAPSHOT_TABLE_NAME', 'DDB_SNAPSHOT_TABLE_NAME', prepend=False)

    from cf_config_version_manager_graphql import manager_version_get_content

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
    ddb_table = ddb.Table('DDB_VERSION_TABLE_NAME')
    distributionId = 'E1Z2Y3'
    resp = ddb_table.put_item(
        Item={
            'distributionId': distributionId,
            'versionId': 1,
            's3_bucket': 'CONFIG_VERSION_S3_BUCKET',
            's3_key': 'config_version_1.json',
            'config_link': "s3://config_version_1.json"

        }
    )
    s3_client = boto3.client('s3')
    s3_client.create_bucket(Bucket='CONFIG_VERSION_S3_BUCKET')
    s3_client.put_object(Bucket='CONFIG_VERSION_S3_BUCKET', Key='config_version_1.json',
                         Body=json.dumps({"distributionId": "E1Z2Y3", "versionId": 1}))
    response = manager_version_get_content(distributionId, "1")


@mock_dynamodb
def test_manager_version_get_all(monkeypatch):
    monkeypatch.setenv('S3_BUCKET', 'CONFIG_VERSION_S3_BUCKET', prepend=False)
    monkeypatch.setenv('DDB_VERSION_TABLE_NAME', 'DDB_VERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_LATESTVERSION_TABLE_NAME', 'DDB_LATESTVERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_SNAPSHOT_TABLE_NAME', 'DDB_SNAPSHOT_TABLE_NAME', prepend=False)

    from cf_config_version_manager_graphql import manager_version_get_all

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
    ddb_table = ddb.Table('DDB_VERSION_TABLE_NAME')
    distributionId = 'E1Z2Y3'
    resp = ddb_table.put_item(
        Item={
            'distributionId': distributionId,
            'versionId': 1,
            's3_bucket': 'CONFIG_VERSION_S3_BUCKET',
            's3_key': 'config_version_1.json',
            'config_link': "s3://config_version_1.json"

        }
    )
    response = manager_version_get_all(distributionId)


@mock_dynamodb
def test_manager_snapshot_get_all(monkeypatch):
    monkeypatch.setenv('S3_BUCKET', 'CONFIG_VERSION_S3_BUCKET', prepend=False)
    monkeypatch.setenv('DDB_VERSION_TABLE_NAME', 'DDB_VERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_LATESTVERSION_TABLE_NAME', 'DDB_LATESTVERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_SNAPSHOT_TABLE_NAME', 'DDB_SNAPSHOT_TABLE_NAME', prepend=False)

    from cf_config_version_manager_graphql import manager_snapshot_get_all

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
    ddb_table = ddb.Table('DDB_VERSION_TABLE_NAME')
    distributionId = 'E1Z2Y3'
    resp = ddb_table.put_item(
        Item={
            'distributionId': distributionId,
            'versionId': 1,
            's3_bucket': 'CONFIG_VERSION_S3_BUCKET',
            's3_key': 'config_version_1.json',
            'config_link': "s3://config_version_1.json"

        }
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
    ddb_table.put_item(
        Item={
            'distributionId': distributionId,
            'snapShotName': 'test snapshot',
            'versionId': 1,
            'note': 'test note',
            'dateTime': '2021-01-01 00:00:00'
        }
    )
    response = manager_snapshot_get_all(distributionId)


@mock_dynamodb
def test_createVersionSnapShot(monkeypatch):
    monkeypatch.setenv('S3_BUCKET', 'CONFIG_VERSION_S3_BUCKET', prepend=False)
    monkeypatch.setenv('DDB_VERSION_TABLE_NAME', 'DDB_VERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_LATESTVERSION_TABLE_NAME', 'DDB_LATESTVERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_SNAPSHOT_TABLE_NAME', 'DDB_SNAPSHOT_TABLE_NAME', prepend=False)

    from cf_config_version_manager_graphql import createVersionSnapShot

    ddb = boto3.resource(service_name="dynamodb")
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
    resp = ddb_table.put_item(
        Item={
            'distributionId': distributionId,
            'versionId': 1,
            's3_bucket': 'CONFIG_VERSION_S3_BUCKET',
            's3_key': 'config_version_1.json',
            'config_link': "s3://config_version_1.json"

        }
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
    # ddb_table = ddb.Table('DDB_SNAPSHOT_TABLE_NAME')
    # ddb_table.put_item(
    #     Item={
    #         'distributionId': distributionId,
    #         'snapShotName': 'test snapshot',
    #         'versionId': 1,
    #         'note': 'test note',
    #         'dateTime': '2021-01-01 00:00:00'
    #     }
    # )
    response = createVersionSnapShot(distributionId, 'test snapshot', 'test note')

@mock_dynamodb
def test_deleteSnapShot(monkeypatch):
    monkeypatch.setenv('S3_BUCKET', 'CONFIG_VERSION_S3_BUCKET', prepend=False)
    monkeypatch.setenv('DDB_VERSION_TABLE_NAME', 'DDB_VERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_LATESTVERSION_TABLE_NAME', 'DDB_LATESTVERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_SNAPSHOT_TABLE_NAME', 'DDB_SNAPSHOT_TABLE_NAME', prepend=False)

    from cf_config_version_manager_graphql import deleteSnapShot

    ddb = boto3.resource(service_name="dynamodb")

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
    ddb_table.put_item(
        Item={
            'distributionId': distributionId,
            'snapShotName': 'test snapshot',
            'versionId': 1,
            'note': 'test note',
            'dateTime': '2021-01-01 00:00:00'
        }
    )
    response = deleteSnapShot(distributionId, "test snapshot")


# @mock_dynamodb
# @mock_cloudfront
# @mock_s3
# def test_manager_version_diff(monkeypatch):
#     monkeypatch.setenv('S3_BUCKET', 'CONFIG_VERSION_S3_BUCKET', prepend=False)
#     monkeypatch.setenv('DDB_VERSION_TABLE_NAME', 'DDB_VERSION_TABLE_NAME', prepend=False)
#     monkeypatch.setenv('DDB_LATESTVERSION_TABLE_NAME', 'DDB_LATESTVERSION_TABLE_NAME', prepend=False)
#     monkeypatch.setenv('DDB_SNAPSHOT_TABLE_NAME', 'DDB_SNAPSHOT_TABLE_NAME', prepend=False)
#
#     from cf_config_version_manager_graphql import manager_version_diff
#
#
#     def mock_get_query_string_value(name,default_value):
#         print(name)
#         return name
#
#     class MockResponse:
#         # mock json() method always returns a specific testing dictionary
#         @staticmethod
#         def get_query_string_value(name,default_value):
#             return name
#
#     def mock_get(*args, **kwargs):
#             return MockResponse()
#
#     # monkeypatch.setattr(app, "current_event", mock_get)
#     from aws_lambda_powertools.event_handler import AppSyncResolver
#
#     app = AppSyncResolver()
#
#     monkeypatch.setattr(app, "current_event.get_query_string_value", mock_get_query_string_value)
#
#     result = manager_version_diff()
#     assert result == 'E1Z1Z1Z1Z1Z1Z1'
