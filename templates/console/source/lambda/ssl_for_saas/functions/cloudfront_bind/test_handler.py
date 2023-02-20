import os
from unittest import TestCase

import pytest

from layer.common.constants_ import ACM_METADATA_TABLE, CONFIG_VERSION_TABLE, JOB_INFO_TABLE_NAME

os.environ.setdefault('AWS_PROFILE', 'cloudfront_ext')
os.environ.setdefault(ACM_METADATA_TABLE,
                      'CloudFrontExtnConsoleStack-StepFunctionRpTsConstructacmmetadataAE01DAD1-199T8M2BLB2RM')
os.environ.setdefault(CONFIG_VERSION_TABLE,
                      'CloudFrontExtnConsoleStack-CloudFrontConfigVersionConstructCloudFrontConfigVersionTableF219CCBB-15HF8YDW5AVJ4')
os.environ.setdefault('GRAPHQL_API_KEY', 'da2-y2k7si5ctzaetppba56r7nb754')
os.environ.setdefault('GRAPHQL_API_URL', 'https://gtjgvw6jk5fxvklgk7yge7kzqq.appsync-api.us-east-1.amazonaws.com/graphql')
os.environ.setdefault(JOB_INFO_TABLE_NAME,
                      'CloudFrontExtnConsoleStack-StepFunctionRpTsConstructsslforsaasjobinfotable199EF239-118SHL7KYLSN6')
os.environ.setdefault('STEP_FUNCTION_ARN',
                      'arn:aws:sns:us-east-1:648149843064:CloudFront_Distribution_Notification')
os.environ.setdefault('SNS_TOPIC', 'arn:aws:sns:us-east-1:648149843064:CloudFront_Distribution_Notification')


@pytest.mark.skip(reason="dev only")
class Test(TestCase):

    def test_handler(self):
        event = {
            'input': {
                "domainName": "workflow002.erinzh.com",
                "sanList": [
                    "workflow002.erinzh.com"
                ],
                "originsItemsDomainName": "",
                "existing_cf_info": {
                    "distribution_id": "EDZ12ZYVLJ0Y1",
                    "config_version_id": "1"
                },
                "fn_cloudfront_bind": {
                    "Payload": {
                        "statusCode": 200,
                        "body": {
                            "distributionId": "E3U0EWVS0978CR",
                            "distributionArn": "arn:aws:cloudfront::648149843064:distribution/E3U0EWVS0978CR",
                            "distributionDomainName": "d2tmq1ppzhlmip.cloudfront.net",
                            "aliases": {
                                "Quantity": 0
                            }
                        }
                    }
                }
            }
        }
        from handler import handler, Event
        e = Event(**event)
        handler(e, {})
        assert False
