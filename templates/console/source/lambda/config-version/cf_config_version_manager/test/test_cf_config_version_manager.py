import boto3
import pytest
import json
from moto import mock_dynamodb
from moto import mock_cloudfront
from moto import mock_s3
from aws_lambda_powertools import Logger, Tracer
# from aws_lambda_powertools.event_handler import APIGatewayRestResolver
from boto3.dynamodb.conditions import Key

@mock_dynamodb
@mock_s3
def test_get_version_diff(monkeypatch):
    monkeypatch.setenv('S3_BUCKET', 'CONFIG_VERSION_S3_BUCKET', prepend=False)
    monkeypatch.setenv('DDB_VERSION_TABLE_NAME', 'DDB_VERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_LATESTVERSION_TABLE_NAME', 'DDB_LATESTVERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_SNAPSHOT_TABLE_NAME', 'DDB_SNAPSHOT_TABLE_NAME', prepend=False)

    from cf_config_version_manager import get_version_diff

    ddb = boto3.resource(service_name="dynamodb" )
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
    def mock_s3_download_file(s3_bucket, s3_key, version):
        print('mock_s3_download_file')
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

    from cf_config_version_manager import get_snapshot_diff

    ddb = boto3.resource(service_name="dynamodb" )
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


# @mock_dynamodb
# @mock_cloudfront
# @mock_s3
# def test_manager_version_diff(monkeypatch):
#     monkeypatch.setenv('S3_BUCKET', 'CONFIG_VERSION_S3_BUCKET', prepend=False)
#     monkeypatch.setenv('DDB_VERSION_TABLE_NAME', 'DDB_VERSION_TABLE_NAME', prepend=False)
#     monkeypatch.setenv('DDB_LATESTVERSION_TABLE_NAME', 'DDB_LATESTVERSION_TABLE_NAME', prepend=False)
#     monkeypatch.setenv('DDB_SNAPSHOT_TABLE_NAME', 'DDB_SNAPSHOT_TABLE_NAME', prepend=False)
#
#     from cf_config_version_manager import manager_version_diff
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
#     from aws_lambda_powertools.event_handler import APIGatewayRestResolver
#
#     app = APIGatewayRestResolver()
#
#     monkeypatch.setattr(app, "current_event.get_query_string_value", mock_get_query_string_value)
#
#     result = manager_version_diff()
#     assert result == 'E1Z1Z1Z1Z1Z1Z1'