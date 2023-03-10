import os
from typing import NamedTuple

from aws_lambda_powertools.event_handler import APIGatewayRestResolver
from aws_lambda_powertools.utilities.typing import LambdaContext

from layer.common.constants_ import ACM_METADATA_TABLE, CONFIG_VERSION_TABLE, JOB_INFO_TABLE_NAME

# os.environ.setdefault('AWS_PROFILE', 'cloudfront_ext')
os.environ.setdefault(ACM_METADATA_TABLE,
                      'acm_metadata')
os.environ.setdefault(CONFIG_VERSION_TABLE,
                      'config_version')
os.environ.setdefault(JOB_INFO_TABLE_NAME,
                      'job_info')
os.environ.setdefault('STEP_FUNCTION_ARN',
                      'step_arn')
os.environ.setdefault('SNS_TOPIC', 'topic')

class TestAppsyncFunc:

    def test_cert_create_or_import(self, monkeypatch):
        from functions.appsync_func import handler

        class MockContext(NamedTuple):
            aws_request_id: str
        handler.raw_context = MockContext(aws_request_id='123')

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
        from functions.appsync_func.types_ import Input
        event = Input(**event)
        monkeypatch.setattr(handler.job_info_client, 'create_job_info', lambda *args, **kwargs: {})
        monkeypatch.setattr(handler.acm_client, 'request_certificate', lambda *args, **kwargs: {})
        monkeypatch.setattr(handler.acm_client, 'tag_job_certificate', lambda *args, **kwargs: {})
        monkeypatch.setattr(handler.acm_client, 'fetch_dcv_value', lambda *args, **kwargs: {})
        monkeypatch.setattr(handler.job_info_client, 'update_job_fields_by_dict', lambda *args, **kwargs: {})
        monkeypatch.setattr(handler.sns_client, 'notify_sns_subscriber', lambda *args, **kwargs: {})
        monkeypatch.setattr(handler.acm_client, 'import_certificate_by_pem', lambda *args, **kwargs: {})
        monkeypatch.setattr(handler.stepfunctions_client, 'invoke_step_function', lambda *args, **kwargs: {})
        handler.cert_create_or_import(event)

        event = {
            "acm_op": "create",  # "import"
            "dist_aggregate": "false",
            "auto_creation": "true",
            "cnameList": [
                {
                    "domainName": "cdn2.risetron.cn",
                    "sanList": [
                        "cdn3.risetron.cn"
                    ],
                    "existing_cf_info": {
                        'distribution_id': '1'
                    },
                    "originsItemsDomainName": "risetron.s3.ap-east-1.amazonaws.com"
                },
                {
                    "domainName": "cdn3.risetron.cn",
                    "sanList": [
                        "cdn4.risetron.cn"
                    ],
                    "existing_cf_info": {
                        'distribution_id': '1'
                    },
                    "originsItemsDomainName": "risetron.s3.ap-east-1.amazonaws.com"
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
        handler.cert_create_or_import(event)


        event = {
            "acm_op": "create",  # "import"
            "auto_creation": "false",
            "cnameList": [
                {
                    "domainName": "cdn2.risetron.cn",
                    "sanList": [
                        "cdn3.risetron.cn"
                    ],
                    "existing_cf_info": {
                        'distribution_id': '1'
                    },
                    "originsItemsDomainName": "risetron.s3.ap-east-1.amazonaws.com"
                },
                {
                    "domainName": "cdn3.risetron.cn",
                    "sanList": [
                        "cdn4.risetron.cn"
                    ],
                    "existing_cf_info": {
                        'distribution_id': '1'
                    },
                    "originsItemsDomainName": "risetron.s3.ap-east-1.amazonaws.com"
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
        monkeypatch.setattr(handler.acm_client, 'fetch_dcv_value', lambda *args, **kwargs: {
            'CertificateArn': 'arn',
            'DomainValidationOptions': [{
                'ValidationMethod': 'DNS',
                'ResourceRecord': 'record'
            }]
        })
        handler.cert_create_or_import(event)

        event = {
            "acm_op": "import",  # "import"
            "auto_creation": "false",
            "cnameList": [
                {
                    "domainName": "cdn2.risetron.cn",
                    "sanList": [
                        "cdn3.risetron.cn"
                    ],
                    "existing_cf_info": {
                        'distribution_id': '1'
                    },
                    "originsItemsDomainName": "risetron.s3.ap-east-1.amazonaws.com"
                },
                {
                    "domainName": "cdn3.risetron.cn",
                    "sanList": [
                        "cdn4.risetron.cn"
                    ],
                    "existing_cf_info": {
                        'distribution_id': '1'
                    },
                    "originsItemsDomainName": "risetron.s3.ap-east-1.amazonaws.com"
                }
            ],
            "pemList": [
                {
                    "CertPem": "xx",
                    "PrivateKeyPem": "xx",
                    "ChainPem": "xx"
                },
                {
                    "CertPem": "xx",
                    "PrivateKeyPem": "xx",
                    "ChainPem": "xx"
                }
            ]
        }
        event = Input(**event)

        handler.cert_create_or_import(event)


    def test_manager_certification_list(self, monkeypatch):
        from functions.appsync_func import handler
        monkeypatch.setattr(handler.acm_client, 'list_certificates', lambda *args, **kwargs: {})
        handler.manager_certification_list()

    def test_manager_certification_list_with_jobId(self, monkeypatch):
        from functions.appsync_func import handler
        monkeypatch.setattr(handler.acm_client, 'list_certificates', lambda *args, **kwargs: {})
        monkeypatch.setattr(handler.acm_client, 'get_results', lambda *args, **kwargs: {})
        handler.manager_certification_list()

    def test_manager_cloudfront_arn_list_with_jobId(self, monkeypatch):
        from functions.appsync_func import handler
        monkeypatch.setattr(handler.resource_client, 'get_resource_by_job_id', lambda *args, **kwargs: {})
        handler.manager_cloudfront_arn_list_with_jobId('')


    def test_manager_list_ssl_jobs(self, monkeypatch):
        from functions.appsync_func import handler
        monkeypatch.setattr(handler.lambda_client, 'invoke', lambda *args, **kwargs: {})
        monkeypatch.setattr(handler.job_info_client, 'get_job_info_by_id', lambda *args, **kwargs: {})

        handler.manager_get_ssl_job('')

    def test_handler(self, monkeypatch):
        from functions.appsync_func import handler
        app = APIGatewayRestResolver()

        class MockLambdaContext(LambdaContext):

            def __init__(self):
                self._function_name = 'test-fn'
                self._memory_limit_in_mb = 128
                self._invoked_function_arn = 'arn:aws:lambda:us-east-1:12345678:function:test-fn'
                self._aws_request_id = '52fdfc07-2182-154f-163f-5f0f9a621d72'


        context = MockLambdaContext()
        handler.app = app
        monkeypatch.setattr(app, 'resolve', lambda *args, **kwargs: {})
        handler.handler({}, context)
