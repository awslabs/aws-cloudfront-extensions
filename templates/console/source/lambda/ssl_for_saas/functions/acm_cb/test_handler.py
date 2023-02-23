import os
from unittest import TestCase

import pytest

from types_ import Event
from layer.common.constants_ import ACM_METADATA_TABLE, JOB_INFO_TABLE_NAME, CONFIG_VERSION_TABLE

os.environ.setdefault('AWS_PROFILE', 'cloudfront_ext')
os.environ.setdefault(ACM_METADATA_TABLE,
                      'CloudFrontExtnConsoleStack-StepFunctionRpTsConstructacmmetadataAE01DAD1-1V8Y8Y8EKVW5K')
os.environ.setdefault(CONFIG_VERSION_TABLE,
                      'CloudFrontExtnConsoleStack-CloudFrontConfigVersionConstructCloudFrontConfigVersionTableF219CCBB-1LUWEV4S9EAIP')
os.environ.setdefault(JOB_INFO_TABLE_NAME,
                      'CloudFrontExtnConsoleStack-StepFunctionRpTsConstructsslforsaasjobinfotable199EF239-1JYPAMATXT90U')
os.environ.setdefault('STEP_FUNCTION_ARN',
                      'arn:aws:sns:us-east-1:${ACCOUNT_ID}:CloudFront_Distribution_Notification')
os.environ.setdefault('SNS_TOPIC', 'arn:aws:sns:us-east-1:${ACCOUNT_ID}:CloudFront_Distribution_Notification')


@pytest.mark.skip(reason="dev only")
class Test(TestCase):
    def test_handler(self):
        event = {
            "callback": "true",
            "input": {
                "acm_op": "create",
                "auto_creation": "true",
                "dist_aggregate": "false",
                "enable_cname_check": "false",
                "cnameList": [
                    {
                        "domainName": "workflow302.erinzh.com",
                        "sanList": [
                            "workflow302.erinzh.com"
                        ],
                        "originsItemsDomainName": "",
                        "existing_cf_info": {
                            "distribution_id": "E34C5PBCSFTUN9",
                            "config_version_id": "1"
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
                            "distribution_id": "E34C5PBCSFTUN9",
                            "config_version_id": "1"
                        }
                    }
                ],
                "aws_request_id": "642c257c-0b0d-48a4-b791-8647385c9b21",
                "fn_acm_cb_handler_map": [
                    {
                        "domainName": "workflow302.erinzh.com",
                        "sanList": [
                            "workflow302.erinzh.com"
                        ],
                        "originsItemsDomainName": "",
                        "existing_cf_info": {
                            "distribution_id": "E34C5PBCSFTUN9",
                            "config_version_id": "1"
                        },
                        "fn_cloudfront_bind": {
                            "Payload": {
                                "statusCode": 200,
                                "body": {
                                    "distributionId": "E3QLD3IAS7JVEQ",
                                    "distributionArn": "arn:aws:cloudfront::${account_id}:distribution/E3QLD3IAS7JVEQ",
                                    "distributionDomainName": "d2hvdoqthkhrrv.cloudfront.net",
                                    "aliases": {
                                        "Quantity": 0
                                    }
                                }
                            }
                        }
                    }
                ]
            },
            "task_token": ""
        }
        from handler import handler
        event = Event(**event)
        handler(event, {})



