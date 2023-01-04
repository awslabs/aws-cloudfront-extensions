import uuid
import boto3
import pytest
import os

from moto import mock_servicequotas
from layer.common.constants_ import JOB_INFO_TABLE_NAME, ACM_METADATA_TABLE, CONFIG_VERSION_TABLE

os.environ.setdefault(JOB_INFO_TABLE_NAME, 'JOB_INFO_TABLE_NAME')
os.environ.setdefault(ACM_METADATA_TABLE,
                      'acm_metadata')
os.environ.setdefault(CONFIG_VERSION_TABLE,
                      'config_version')
os.environ.setdefault('STEP_FUNCTION_ARN',
                      'step_arn')
os.environ.setdefault('SNS_TOPIC', 'topic')



class TestQuotaCheck:

    @mock_servicequotas
    def test_get_quota_number(self, monkeypatch):
        from functions.quota_check import handler
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
        handler.quota_client = quota_client
        handler.get_quota_number("acm", "L-12345678")

    def test_get_ssl_number(self, monkeypatch):
        pass


    def test_get_cloudfront_number(self, monkeypatch):
        pass


    def test_lambda_handler(self, monkeypatch):
        pass
