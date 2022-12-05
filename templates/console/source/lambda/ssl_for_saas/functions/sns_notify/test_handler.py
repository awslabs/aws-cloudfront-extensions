import os
from unittest import TestCase
import pytest
from layer.common.constants_ import *

os.environ.setdefault('AWS_PROFILE', 'cloudfront_ext')
os.environ.setdefault(ACM_METADATA_TABLE,
                      'CloudFrontExtnConsoleStack-StepFunctionRpTsConstructacmmetadataAE01DAD1-1V8Y8Y8EKVW5K')
os.environ.setdefault(CONFIG_VERSION_TABLE,
                      'CloudFrontExtnConsoleStack-CloudFrontConfigVersionConstructCloudFrontConfigVersionTableF219CCBB-15HF8YDW5AVJ4')
os.environ.setdefault('GRAPHQL_API_KEY', 'da2-y2k7si5ctzaetppba56r7nb754')
os.environ.setdefault('GRAPHQL_API_URL', 'https://gtjgvw6jk5fxvklgk7yge7kzqq.appsync-api.us-east-1.amazonaws.com/graphql')
os.environ.setdefault(JOB_INFO_TABLE_NAME,
                      'CloudFrontExtnConsoleStack-StepFunctionRpTsConstructsslforsaasjobinfotable199EF239-1JYPAMATXT90U')
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
                        "domainName": "workflow007.erinzh.com",
                        "sanList": [
                            "workflow007.erinzh.com"
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
                "aws_request_id": "c7170b21-9590-4cae-b747-664f6707f4a0",
                "fn_acm_cb_handler_map": [
                    {
                        "domainName": "workflow007.erinzh.com",
                        "sanList": [
                            "workflow007.erinzh.com"
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
                                    "distributionId": "E2S108W0OK8TGR",
                                    "distributionArn": "arn:aws:cloudfront::648149843064:distribution/E2S108W0OK8TGR",
                                    "distributionDomainName": "d1xsutn96i86o3.cloudfront.net",
                                    "aliases": {
                                        "Quantity": 0
                                    }
                                }
                            }
                        }
                    }
                ],
                "fn_acm_cb": {
                    "status": "SUCCEEDED"
                },
                "fn_cloudfront_acm_bind_map": [
                    {
                        "domainName": "workflow007.erinzh.com",
                        "sanList": [
                            "workflow007.erinzh.com"
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
                                    "distributionId": "E2S108W0OK8TGR",
                                    "distributionArn": "arn:aws:cloudfront::648149843064:distribution/E2S108W0OK8TGR",
                                    "distributionDomainName": "d1xsutn96i86o3.cloudfront.net",
                                    "aliases": {
                                        "Quantity": 0
                                    },
                                    "certificateArn": "arn:aws:acm:us-east-1:648149843064:certificate/7ca79b75-60dd-4700-b4b2-48f6b3c6d0f6",
                                }
                            }
                        },
                        "fn_acm_cb_handler": {
                            "ExecutedVersion": "$LATEST",
                            "Payload": {
                                "statusCode": 200,
                                "body": {
                                    "certificateArn": "arn:aws:acm:us-east-1:648149843064:certificate/7ca79b75-60dd-4700-b4b2-48f6b3c6d0f6",
                                    "distributionId": "E2S108W0OK8TGR",
                                    "distributionArn": "arn:aws:cloudfront::648149843064:distribution/E2S108W0OK8TGR",
                                    "distributionDomainName": "d1xsutn96i86o3.cloudfront.net",
                                    "aliases": {
                                        "Quantity": 1,
                                        "Items": [
                                            "workflow007.erinzh.com"
                                        ]
                                    }
                                }
                            },
                            "SdkHttpMetadata": {
                                "AllHttpHeaders": {
                                    "X-Amz-Executed-Version": [
                                        "$LATEST"
                                    ],
                                    "x-amzn-Remapped-Content-Length": [
                                        "0"
                                    ],
                                    "Connection": [
                                        "keep-alive"
                                    ],
                                    "x-amzn-RequestId": [
                                        "b03ab092-3a5c-48f7-b48b-4cb7f9c562c2"
                                    ],
                                    "Content-Length": [
                                        "272"
                                    ],
                                    "Date": [
                                        "Mon, 05 Dec 2022 10:08:57 GMT"
                                    ],
                                    "X-Amzn-Trace-Id": [
                                        "root=1-638dc2b0-62c927d31baaa2e1083d55dc;parent=412410e7b93df204;sampled=0"
                                    ],
                                    "Content-Type": [
                                        "application/json"
                                    ]
                                },
                                "HttpHeaders": {
                                    "Connection": "keep-alive",
                                    "Content-Length": "272",
                                    "Content-Type": "application/json",
                                    "Date": "Mon, 05 Dec 2022 10:08:57 GMT",
                                    "X-Amz-Executed-Version": "$LATEST",
                                    "x-amzn-Remapped-Content-Length": "0",
                                    "x-amzn-RequestId": "b03ab092-3a5c-48f7-b48b-4cb7f9c562c2",
                                    "X-Amzn-Trace-Id": "root=1-638dc2b0-62c927d31baaa2e1083d55dc;parent=412410e7b93df204;sampled=0"
                                },
                                "HttpStatusCode": 200
                            },
                            "SdkResponseMetadata": {
                                "RequestId": "b03ab092-3a5c-48f7-b48b-4cb7f9c562c2"
                            },
                            "StatusCode": 200
                        }
                    }
                ]
            }
        }
        from handler import handler

        handler(event, {})


