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


class TestSnsFailureNotify:

    def test_sns_failure_notify(self, monkeypatch):
        from functions.sns_failure_notify import handler
        monkeypatch.setattr(handler.job_info_client, 'get_job_info_by_id', lambda *args, **kwargs: {})
        monkeypatch.setattr(handler.job_info_client, 'update_job_field', lambda *args, **kwargs: {})
        monkeypatch.setattr(handler.sns_client, 'publish_by_topic', lambda *args, **kwargs: {})
        handler.handler({
            "input": {
                "acm_op": "create",
                "auto_creation": "true",
                "dist_aggregate": "false",
                "enable_cname_check": "false",
                "cnameList": [
                    {
                        "domainName": "web1.v2.ssl-for-saas.demo.solutions.aws.a2z.org.cn",
                        "sanList": [
                            "web1.v2.ssl-for-saas.demo.solutions.aws.a2z.org.cn"
                        ],
                        "originsItemsDomainName": "",
                        "existing_cf_info": {
                            "distribution_id": "E2CWQXEO490X1W",
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
                            "distribution_id": "E2CWQXEO490X1W",
                            "config_version_id": "1"
                        }
                    }
                ],
                "aws_request_id": "a9543ea5-96d5-4c12-9672-cf9f30bdabf2",
                "error": {
                    "Error": "AccessDenied",
                    "Cause": "{\"errorMessage\":\"An error occurred (AccessDenied) when calling the ListDistributions operation: User: arn:aws:sts::489670441870:assumed-role/CloudFrontExtnConsoleStac-StepFunctionRpTsConstruc-CE87L7NJDH83/CloudFrontExtnConsoleStac-jobcreatecheckresourceE5-Af8wxqssWRFY is not authorized to perform: cloudfront:ListDistributions because no identity-based policy allows the cloudfront:ListDistributions action\",\"errorType\":\"AccessDenied\",\"requestId\":\"dea16a3e-368b-4b4a-a26a-6bad7010a7f2\",\"stackTrace\":[\"  File \\\"/var/task/handler.py\\\", line 78, in handler\\n    cf_dist_remaining = int(get_quota_number('cloudfront', 'L-24B04930')) - get_cloudfront_number()\\n\",\"  File \\\"/var/task/handler.py\\\", line 51, in get_cloudfront_number\\n    response = cf_client.list_distributions()\\n\",\"  File \\\"/opt/python/botocore/client.py\\\", line 515, in _api_call\\n    return self._make_api_call(operation_name, kwargs)\\n\",\"  File \\\"/opt/python/botocore/client.py\\\", line 934, in _make_api_call\\n    raise error_class(parsed_response, operation_name)\\n\"]}"
                },
                "fn_failure_handling": {
                    "ExecutedVersion": "$LATEST",
                    "Payload": {
                        "statusCode": 200,
                        "body": "\"step to clean up the resources completed\""
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
                                "1fea49b5-f592-4674-9059-cf7888fa6c64"
                            ],
                            "Content-Length": [
                                "75"
                            ],
                            "Date": [
                                "Wed, 14 Dec 2022 09:14:42 GMT"
                            ],
                            "X-Amzn-Trace-Id": [
                                "root=1-63999401-2a274f6a2a1499ae50869bac;sampled=0"
                            ],
                            "Content-Type": [
                                "application/json"
                            ]
                        },
                        "HttpHeaders": {
                            "Connection": "keep-alive",
                            "Content-Length": "75",
                            "Content-Type": "application/json",
                            "Date": "Wed, 14 Dec 2022 09:14:42 GMT",
                            "X-Amz-Executed-Version": "$LATEST",
                            "x-amzn-Remapped-Content-Length": "0",
                            "x-amzn-RequestId": "1fea49b5-f592-4674-9059-cf7888fa6c64",
                            "X-Amzn-Trace-Id": "root=1-63999401-2a274f6a2a1499ae50869bac;sampled=0"
                        },
                        "HttpStatusCode": 200
                    },
                    "SdkResponseMetadata": {
                        "RequestId": "1fea49b5-f592-4674-9059-cf7888fa6c64"
                    },
                    "StatusCode": 200
                }
            }
        }, {})

