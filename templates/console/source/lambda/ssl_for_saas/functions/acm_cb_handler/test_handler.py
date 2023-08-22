import os
from unittest import TestCase

import pytest

from types_ import Event
from layer.common.constants_ import *

os.environ.setdefault('AWS_PROFILE', 'cloudfront_ext')
os.environ.setdefault(ACM_METADATA_TABLE,
                      'CloudFrontExtnConsoleStack-StepFunctionRpTsConstructacmmetadataAE01DAD1-1PSG8OYZCNPE5')
os.environ.setdefault(CONFIG_VERSION_TABLE,
                      'CloudFrontExtnConsoleStack-CloudFrontConfigVersionConstructCloudFrontConfigVersionTableF219CCBB-15HF8YDW5AVJ4')
os.environ.setdefault('GRAPHQL_API_KEY', 'da2-y2k7si5ctzaetppba56r7nb754')
os.environ.setdefault('GRAPHQL_API_URL', 'https://gtjgvw6jk5fxvklgk7yge7kzqq.appsync-api.us-east-1.amazonaws.com/graphql')
os.environ.setdefault(JOB_INFO_TABLE_NAME,
                      'CloudFrontExtnConsoleStack-StepFunctionRpTsConstructsslforsaasjobinfotable199EF239-R0CQ1O54JK2T')
os.environ.setdefault('STEP_FUNCTION_ARN',
                      'arn:aws:sns:us-east-1:${account_id}:CloudFront_Distribution_Notification')
os.environ.setdefault('SNS_TOPIC', 'arn:aws:sns:us-east-1:${ACCOUNT_ID}:CloudFront_Distribution_Notification')


@pytest.mark.skip(reason="dev only")
class Test(TestCase):
    def test_handler(self):
        from handler import handler
        event = {
            "input": {
                "domainName": "refactoring-015.erinzh.com",
                "sanList": [
                    "refactoring-015.erinzh.com"
                ],
                "originsItemsDomainName": "",
                "existing_cf_info": {
                    "distribution_id": "EDZ12ZYVLJ0Y1",
                    "config_version_id": "1"
                }
            }
        }
        event = Event(**event)
        handler(event, {})
        # self.fail()
