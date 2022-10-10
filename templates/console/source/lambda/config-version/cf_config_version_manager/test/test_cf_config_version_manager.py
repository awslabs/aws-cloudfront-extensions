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
@mock_cloudfront
@mock_s3
def test_manager_version_diff(monkeypatch):
    monkeypatch.setenv('S3_BUCKET', 'CONFIG_VERSION_S3_BUCKET', prepend=False)
    monkeypatch.setenv('DDB_VERSION_TABLE_NAME', 'DDB_VERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_LATESTVERSION_TABLE_NAME', 'DDB_LATESTVERSION_TABLE_NAME', prepend=False)
    monkeypatch.setenv('DDB_SNAPSHOT_TABLE_NAME', 'DDB_SNAPSHOT_TABLE_NAME', prepend=False)

    from cf_config_version_manager import manager_version_diff


    def mock_get_query_string_value(name,default_value):
        print(name)
        return name

    class MockResponse:
        # mock json() method always returns a specific testing dictionary
        @staticmethod
        def get_query_string_value(name,default_value):
            return name

    def mock_get(*args, **kwargs):
            return MockResponse()

    # monkeypatch.setattr(app, "current_event", mock_get)
    from aws_lambda_powertools.event_handler import APIGatewayRestResolver

    app = APIGatewayRestResolver()

    monkeypatch.setattr(app, "current_event.get_query_string_value", mock_get_query_string_value)

    result = manager_version_diff()
    assert result == 'E1Z1Z1Z1Z1Z1Z1'