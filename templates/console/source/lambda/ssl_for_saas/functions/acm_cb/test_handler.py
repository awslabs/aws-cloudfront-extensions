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
                      'arn:aws:sns:us-east-1:648149843064:CloudFront_Distribution_Notification')
os.environ.setdefault('SNS_TOPIC', 'arn:aws:sns:us-east-1:648149843064:CloudFront_Distribution_Notification')


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
                                    "distributionArn": "arn:aws:cloudfront::648149843064:distribution/E3QLD3IAS7JVEQ",
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
            "task_token": "AQCEAAAAKgAAAAMAAAAAAAAAAdJf5hyUIRu+fi/wd5+HXNZvJGDKmvnUtxWnJRPGIoj2qHu7jTp8jGBcB6KgBJAwoHeVIHTVphHvdpW58w6WVWmHPstMNHSkZhiCn9Civ48X5w==DHCt4p0DRHTax7PRcrF8Mfq58MY6r7Xnc9oSkZOmHezbOx+6G2TV0QFtZkFC6pF8dNK8toxwUGj0nlztoFLLUeCqYtGtY3hBC/eLPIRZw9Fo7Vl2RZx1fGHKvgDrlalXh6sEaMUODvXfwOkocXs2mUK3+bv5nv0iDcczJ9o7vmKnGdlb/hAghye50FwRgRKTJv2Mw/VhfLeoVPl8ItWkr2AdRG6zTNAdOBdcXAwgX42bqv13AUKjW1O2iIhn6rnm205NiZ6zgTIAnK6ouEqHALdQ2Nd3icGYozMoFAfeKrudvNUp9sLd5SaIZaLa6WkoaePUn1GHWqMyW7soqFEdDsb8K0IY7ODXh8bs95SzWHJhtk6gVG4+GrGSLKZoZz13uergyXyTm01psK/2esIlUizIqYmnM8hm6epmfymy5D2odtUd5JYE3SAGkZl9w1szf5FLiTU5I3gpw/Dy5YIBgDwszUMuhxfyJ99s+fxAbdIqpLE+V4hPuLMV8shFZ9NvfJCRxw5IMtm6VSS4grlg"
        }
        from handler import handler
        event = Event(**event)
        handler(event, {})


