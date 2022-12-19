import uuid
import boto3
import pytest
import os

from moto import mock_servicequotas
from layer.common.constants_ import JOB_INFO_TABLE_NAME

os.environ.setdefault(JOB_INFO_TABLE_NAME, 'JOB_INFO_TABLE_NAME')

@mock_servicequotas
def test_get_quota_number(monkeypatch):
    from handler import get_quota_number
    def mock_get_aws_default_service_quota(*args, **kwargs):
        return {
            'Quota': {
                'ServiceCode': 'string',
                'ServiceName': 'string',
                'QuotaArn': 'string',
                'QuotaCode': 'string',
                'QuotaName': 'string',
                'Value': 100.0,
                'Unit': 'string',
            }
        }
    quota_client = boto3.client('service-quotas', region_name='us-east-1')
    monkeypatch.setattr(quota_client, "get_aws_default_service_quota", mock_get_aws_default_service_quota)
    get_quota_number("acm", "L-12345678")

def test_get_ssl_number(monkeypatch):
    pass


def test_get_cloudfront_number(monkeypatch):
    pass


def test_lambda_handler(monkeypatch):
    pass
