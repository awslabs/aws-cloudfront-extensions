import os
from unittest import TestCase
import pytest
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
                      'arn:aws:sns:us-east-1:648149843064:CloudFront_Distribution_Notification')
os.environ.setdefault('SNS_TOPIC', 'arn:aws:sns:us-east-1:648149843064:CloudFront_Distribution_Notification')


@pytest.mark.skip(reason="dev only")
class Test(TestCase):
    def test_handler(self):
        event = {
            "input": {
                "acm_op": "create",
                "auto_creation": "true",
                "dist_aggregate": "false",
                "enable_cname_check": "false",
                "cnameList": [
                    {
                        "domainName": "refactor-18.erinzh.com",
                        "sanList": [
                            "refactor-18.erinzh.com"
                        ],
                        "originsItemsDomainName": "",
                        "existing_cf_info": {
                            "distribution_id": "EDZ12ZYVLJ0Y1",
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
                            "distribution_id": "EDZ12ZYVLJ0Y1",
                            "config_version_id": "1"
                        }
                    }
                ],
                "aws_request_id": "0a92db0b-82ce-4173-8064-6078469624a7",
                "fn_acm_cb": {
                    "status": "SUCCEEDED"
                },
                "fn_acm_cb_handler_map": [
                    {
                        "domainName": "refactor-18.erinzh.com",
                        "sanList": [
                            "refactor-18.erinzh.com"
                        ],
                        "originsItemsDomainName": "",
                        "existing_cf_info": {
                            "distribution_id": "EDZ12ZYVLJ0Y1",
                            "config_version_id": "1"
                        },
                        "fn_acm_cb_handler": {
                            "Payload": {
                                "statusCode": 200,
                                "body": {"distributionId": "EBUV7M9IG1NYG",
                                         "distributionArn": "arn:aws:cloudfront::648149843064:distribution/EBUV7M9IG1NYG",
                                         "distributionDomainName": "d3s1uedylotkpz.cloudfront.net",
                                         "aliases": {"Quantity": 1, "Items": ["refactor-18.erinzh.com"]}
                                         }
                            }
                        }
                    }
                ]
            }
        }
        from handler import handler

        handler(event, {})


