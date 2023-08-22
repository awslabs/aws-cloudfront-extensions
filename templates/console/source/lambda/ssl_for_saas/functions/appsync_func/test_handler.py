import copy
import os
from typing import NamedTuple
from unittest import TestCase

import pytest
from aws_lambda_powertools.utilities.typing import LambdaContext

from types_ import Input
from layer.common.constants_ import ACM_METADATA_TABLE, JOB_INFO_TABLE_NAME

os.environ.setdefault('AWS_PROFILE', 'cloudfront_ext')
os.environ.setdefault(ACM_METADATA_TABLE,
                      'CloudFrontExtnConsoleStack-StepFunctionRpTsConstructacmmetadataAE01DAD1-B7SDYBWHWV8V')
os.environ.setdefault(JOB_INFO_TABLE_NAME,
                      'CloudFrontExtnConsoleStack-StepFunctionRpTsConstructsslforsaasjobinfotable199EF239-1J9ZONNGUMHPA')
os.environ.setdefault('STEP_FUNCTION_ARN',
                      'arn:aws:states:us-east-1:${ACCOUNT_ID}:stateMachine:SSL-for-SaaS-StateMachine')


class MockContext(NamedTuple):
    aws_request_id: str


@pytest.mark.skip(reason="dev only")
class Test(TestCase):
    def test_cert_create_or_import(self):
        from handler import cert_create_or_import
        import handler as appsync_func
        appsync_func.raw_context = MockContext(aws_request_id='123')

        event = {
            "acm_op": "create",
            "auto_creation": "true",
            "dist_aggregate": "false",
            "enable_cname_check": "false",
            "aws_request_id": "test",
            "cnameList": [
                {
                    "domainName": "refactor-002.erinzh.com",
                    "sanList": [
                        "refactor-002.erinzh.com"
                    ],
                    "originsItemsDomainName": "",
                    "existing_cf_info": {
                        "distribution_id": "EDZ12ZYVLJ0Y1",
                        "config_version_id": '1'
                    }
                }
            ],
            "pemList": [
                {
                    "CertPem": "",
                    "PrivateKeyPem": "",
                    "ChainPem": "",
                    "originsItemsDomainName": "",
                    "existing_cf_info": {
                        "distribution_id": "EDZ12ZYVLJ0Y1",
                        "config_version_id": '1'
                    }
                }
            ]
        }
        event = Input(**event)
        cert_create_or_import(event)

    def test_manager_get_ssl_job(self):
        from handler import cert_create_or_import
        import handler as appsync_func
        appsync_func.raw_context = MockContext(aws_request_id='123')
        resp = appsync_func.manager_get_ssl_job('4593f67a-0ef3-412c-97f5-17e862eae3e0')
        print(resp)

    def test_get_all_job(self):
        import handler as appsync_func
        appsync_func.raw_context = MockContext(aws_request_id='123')
        resp = appsync_func.manager_list_ssl_jobs()
        print(resp)


    def test_import(self):
        event = {
            "acm_op": "import",
            "auto_creation": "true",
            "dist_aggregate": "false",
            "enable_cname_check": "false",
            "cnameList": [],
            "pemList": [
                {
                    "CertPem": "",
                    "PrivateKeyPem": "",
                    "ChainPem": "",
                    "existing_cf_info": {
                        "distribution_id": "EDZ12ZYVLJ0Y1",
                        "config_version_id": "1"
                    }
                }
            ]
        }
        from handler import cert_create_or_import
        import handler as appsync_func
        appsync_func.raw_context = MockContext(aws_request_id='123')
        event = Input(**event)
        cert_create_or_import(event)

