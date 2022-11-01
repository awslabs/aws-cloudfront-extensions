import json

import boto3
import pytest
from moto import mock_sns, mock_acm, mock_dynamodb, mock_stepfunctions, mock_cloudfront
from moto import mock_resourcegroupstaggingapi
from tenacity import wait_none, RetryError
from requests import exceptions
from aws_lambda_powertools.event_handler import APIGatewayRestResolver
from aws_lambda_powertools.utilities.typing import LambdaContext

default_distribution_config = {
    "CallerReference": "",
    "Aliases": {
        "Quantity": 1,
        "Items": []
    },
    "DefaultRootObject": "",
    "Origins": {
        "Quantity": 1,
        "Items": [
            {
                "Id": "",
                "DomainName": "cloudfrontextnconsolesta-cloudfrontconfigversionc-152y5mcxm4aj9.s3.us-west-1.amazonaws.com",
                "OriginPath": "",
                "CustomHeaders": {
                    "Quantity": 0
                },
                "S3OriginConfig": {
                    "OriginAccessIdentity": ""
                },
                "ConnectionAttempts": 3,
                "ConnectionTimeout": 10,
                "OriginShield": {
                    "Enabled": False
                }
            }
        ]
    },
    "OriginGroups": {
        "Quantity": 0
    },
    "DefaultCacheBehavior": {
        "TargetOriginId": "",
        "TrustedSigners": {
            "Enabled": False,
            "Quantity": 0
        },
        "TrustedKeyGroups": {
            "Enabled": False,
            "Quantity": 0
        },
        "ViewerProtocolPolicy": "allow-all",
        "AllowedMethods": {
            "Quantity": 2,
            "Items": [
                "HEAD",
                "GET"
            ],
            "CachedMethods": {
                "Quantity": 2,
                "Items": [
                    "HEAD",
                    "GET"
                ]
            }
        },
        "SmoothStreaming": False,
        "Compress": False,
        "LambdaFunctionAssociations": {
            "Quantity": 0
        },
        "FieldLevelEncryptionId": "",
        "CachePolicyId": "",
    },
    "CacheBehaviors": {
        "Quantity": 0
    },
    "CustomErrorResponses": {
        "Quantity": 0
    },
    "Comment": "",
    "Logging": {
        "Enabled": False,
        "IncludeCookies": False,
        "Bucket": "",
        "Prefix": ""
    },
    "PriceClass": "PriceClass_All",
    "Enabled": True,
    "ViewerCertificate": {
        "ACMCertificateArn": "",
        "SSLSupportMethod": "sni-only",
        "MinimumProtocolVersion": "TLSv1.2_2019",
        "Certificate": "",
        "CertificateSource": "acm"
    },
    "Restrictions": {
        "GeoRestriction": {
            "RestrictionType": "none",
            "Quantity": 0
        }
    },
    "WebACLId": "",
    "HttpVersion": "http2",
    "IsIPV6Enabled": True
}

class MockLambdaContext(LambdaContext):

    def __init__(self):
        self._function_name = 'test-fn'
        self._memory_limit_in_mb = 128
        self._invoked_function_arn = 'arn:aws:lambda:us-east-1:12345678:function:test-fn'
        self._aws_request_id = '52fdfc07-2182-154f-163f-5f0f9a621d72'


@mock_sns
def test_notify_sns_subscriber(monkeypatch):
    monkeypatch.setenv("LAMBDA_TASK_ROOT", "Lambda root", prepend=False)

    from ssl_api_handler import notify_sns_subscriber
    import ssl_api_handler
    sns = boto3.client('sns')

    resp = sns.create_topic(
        Name='CloudFront_Distribution_Notification',
        Attributes={
            'string': 'string'
        },
        Tags=[
            {
                'Key': 'string',
                'Value': 'string'
            },
        ],
    )
    ssl_api_handler.snsTopicArn = resp['TopicArn']
    notify_sns_subscriber('test msg')


@mock_acm
def test_fetch_dcv_value(monkeypatch):
    monkeypatch.setenv("LAMBDA_TASK_ROOT", "Lambda root", prepend=False)

    from ssl_api_handler import fetch_dcv_value
    import ssl_api_handler

    acm = boto3.client('acm')
    ssl_api_handler.acm = acm
    monkeypatch.setattr(acm, 'describe_certificate', lambda *args, **kwargs: {
        'Certificate': {
            'DomainValidationOptions': [{
                'ResourceRecord': {}
            }],
        }
    })

    fetch_dcv_value.retry.wait = wait_none()
    fetch_dcv_value.retry.reraise = True

    resp = fetch_dcv_value('cert_arn')
    assert resp is not None

    monkeypatch.setattr(acm, 'describe_certificate', lambda *args, **kwargs: {
        'Certificate': {}
    })

    with pytest.raises(exceptions.Timeout):
        fetch_dcv_value('cert_arn')

    monkeypatch.setattr(acm, 'describe_certificate', lambda *args, **kwargs: {
        'Certificate': {
            'DomainValidationOptions': [{}],
        }
    })

    with pytest.raises(exceptions.Timeout):
        fetch_dcv_value('cert_arn')


# fixme: duplicated code
def test_check_generate_task_token(monkeypatch):
    monkeypatch.setenv("LAMBDA_TASK_ROOT", "Lambda root", prepend=False)

    from ssl_api_handler import check_generate_task_token
    resp = check_generate_task_token('')
    assert resp is not None
    resp = check_generate_task_token('test task token')
    assert resp is not None


def test_tag_certificate(monkeypatch):
    monkeypatch.setenv("LAMBDA_TASK_ROOT", "Lambda root", prepend=False)

    from ssl_api_handler import _tag_certificate
    import ssl_api_handler
    acm = boto3.client('acm')
    ssl_api_handler.acm = acm
    monkeypatch.setattr(acm, 'add_tags_to_certificate', lambda *args, **kwargs: {})
    _tag_certificate('cert_arn', 'task_token')


# fixme: dulicated code
@mock_acm
@mock_dynamodb
@mock_sns
def test_request_certificate(monkeypatch):
    callable_table = 'acm_metadata'
    monkeypatch.setenv("LAMBDA_TASK_ROOT", "Lambda root", prepend=False)
    monkeypatch.setenv("CALLBACK_TABLE", callable_table, prepend=False)
    monkeypatch.setenv("JOB_INFO_TABLE", "ssl_for_saas_job_info_table", prepend=False)  # fixme: not working?
    monkeypatch.setenv("CONFIG_VERSION_DDB_TABLE_NAME", "CloudFrontConfigVersionTable",
                       prepend=False)  # fixme: not working?

    test_domain = "test.com"
    test_task_token = "token"
    certificate = {'DomainName': test_domain,
                   'SubjectAlternativeNames': ['a.' + test_domain, 'b.' + test_domain, '*.' + test_domain]}
    # cert['SubjectAlternativeNames'] = cname_value[sanList]
    from ssl_api_handler import request_certificate
    import ssl_api_handler

    cert_resp = request_certificate(certificate)
    assert cert_resp is not None


# fixme: duplicated code
def test_is_valid_domain(monkeypatch):
    monkeypatch.setenv("LAMBDA_TASK_ROOT", "Lambda root", prepend=False)

    from ssl_api_handler import isValidDomain

    invalid_domains = [
        ''
        'www.mydom-ain-.com.uk',
        'bad_domain.com',
        'bad:domain.com',
        'http://only.domains.com',
    ]

    for d in invalid_domains:
        resp = isValidDomain(d)
        assert not resp

    valid_domains = [
        '1.mydomain.com',
        '1.2.mydomain.com',
        'www.domain.com',
        '*.domain.com',
    ]

    for d in valid_domains:
        resp = isValidDomain(d)
        assert resp


# fixme: duplicated code
@mock_acm
def test_is_valid_certificate(monkeypatch):
    monkeypatch.setenv("LAMBDA_TASK_ROOT", "Lambda root", prepend=False)

    from ssl_api_handler import isValidCertificate
    import ssl_api_handler
    acm = boto3.client('acm')
    ssl_api_handler.acm = acm

    def mock_import_cert(*args, **kwargs):
        return {}

    monkeypatch.setattr(acm, 'describe_certificate', mock_import_cert)
    resp = isValidCertificate({
        'CertificateArn': 'arn',
        'DomainName': '5test.com'
    })
    assert resp is not None


# fixme: will create a file
def test_convert_string_to_file(monkeypatch):
    monkeypatch.setenv("LAMBDA_TASK_ROOT", "Lambda root", prepend=False)

    from ssl_api_handler import convert_string_to_file
    convert_string_to_file('test', '.testfile_not_used')


# fixme: duplicated code
def test_get_domain_list_from_cert(monkeypatch):
    monkeypatch.setenv("LAMBDA_TASK_ROOT", "Lambda root", prepend=False)

    from ssl_api_handler import get_domain_list_from_cert
    import ssl_api_handler

    with pytest.raises(Exception):
        ssl_api_handler.PEM_FILE = './test/test_failed_cert.pem'
        resp = get_domain_list_from_cert()
        assert resp is not None

    ssl_api_handler.PEM_FILE = './test/test_cert.pem'
    resp = get_domain_list_from_cert()
    assert resp is not None

    monkeypatch.setattr(ssl_api_handler, 'isValidDomain', lambda *args, **kwargs: False)
    resp = get_domain_list_from_cert()
    assert resp is not None


# fixme: duplicated code
@mock_acm
def test_import_certificate(monkeypatch):
    monkeypatch.setenv("LAMBDA_TASK_ROOT", "Lambda root", prepend=False)

    from ssl_api_handler import import_certificate
    import ssl_api_handler

    acm = boto3.client('acm')
    ssl_api_handler.acm = acm

    def mock_import_cert(*args, **kwargs):
        return {}

    monkeypatch.setattr(acm, 'import_certificate', mock_import_cert)
    resp = import_certificate({
        'CertPem': 'cert_pem',
        'PrivateKeyPem': 'private_key',
        'ChainPem': 'chain_pem',
        'DomainName': 'test.com',
    })
    assert resp is not None

    monkeypatch.setattr(acm, 'import_certificate', lambda *args, **kwargs: 1 / 0)
    resp = import_certificate({
        'CertPem': 'cert_pem',
        'PrivateKeyPem': 'private_key',
        'ChainPem': 'chain_pem',
        'DomainName': 'test.com',
    })

@mock_stepfunctions
def test_invoke_step_function(monkeypatch):
    from ssl_api_handler import invoke_step_function
    import ssl_api_handler

    invoke_step_function('arn', 'input')
    stepfunc = boto3.client('stepfunctions')

    ssl_api_handler.step_function = stepfunc
    monkeypatch.setattr(stepfunc, 'start_execution', lambda *args, **kwargs: {})
    invoke_step_function('arn', 'input')

    monkeypatch.setattr(stepfunc, 'start_execution', lambda *args, **kwargs: 1 / 0)
    invoke_step_function('arn', 'input')


# fixme: duplicated code
def test_is_subset(monkeypatch):
    monkeypatch.setenv("LAMBDA_TASK_ROOT", "Lambda root", prepend=False)

    from ssl_api_handler import is_wildcard, is_subset
    san = ["*.test.com"]
    res = is_wildcard(san)
    assert res == san[0]
    not_wild = is_wildcard(["test.com", "test2.com"])
    assert not_wild is None
    res = is_subset(san, {san[0]: "certArn"})
    assert res == "certArn"
    res = is_subset(san, {"not.com": "notSub"})
    assert res is None

    from ssl_api_handler import check_generate_task_token
    task_token_resp = check_generate_task_token("")
    assert task_token_resp != ""


def test_validate_input_parameters(monkeypatch):
    from ssl_api_handler import validate_input_parameters

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
    validate_input_parameters(event)
    with pytest.raises(Exception):
        validate_input_parameters({})


def test_cert_create_or_import(monkeypatch):
    monkeypatch.setenv("LAMBDA_TASK_ROOT", "Lambda root", prepend=False)
    from ssl_api_handler import cert_create_or_import
    import ssl_api_handler

    monkeypatch.setattr(ssl_api_handler, 'validate_input_parameters', lambda *args, **kwargs: {})
    monkeypatch.setattr(ssl_api_handler, 'update_job_field', lambda *args, **kwargs: {})
    monkeypatch.setattr(ssl_api_handler, 'convert_string_to_file', lambda *args, **kwargs: {})

    app = APIGatewayRestResolver()
    body = {
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
    event = {
        'body': json.dumps(body),
        'aws_request_id': 'request_id',
        'httpMethod': 'GET',
        'path': '/ssl_for_saas'
    }

    context = MockLambdaContext()
    ssl_api_handler.raw_context = context
    app.resolve(event, context)
    resp = cert_create_or_import()

    body = {
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
    }
    event = {
        'body': json.dumps(body),
        'aws_request_id': 'request_id',
        'httpMethod': 'GET',
        'path': '/ssl_for_saas'
    }

    context = MockLambdaContext()
    ssl_api_handler.raw_context = context
    app.resolve(event, context)
    resp = cert_create_or_import()

    body = {
        "acm_op": "create",  # "import"
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
    }
    event = {
        'body': json.dumps(body),
        'aws_request_id': 'request_id',
        'httpMethod': 'GET',
        'path': '/ssl_for_saas'
    }

    context = MockLambdaContext()
    ssl_api_handler.raw_context = context
    app.resolve(event, context)
    resp = cert_create_or_import()

    monkeypatch.setattr(ssl_api_handler, 'create_job_info', lambda *args, **kwargs: {})
    monkeypatch.setattr(ssl_api_handler, 'notify_sns_subscriber', lambda *args, **kwargs: {})
    monkeypatch.setattr(ssl_api_handler, 'request_certificate', lambda *args, **kwargs: {
        'CertificateArn': 'arn',
        'DomainValidationOptions': [{
            'ValidationMethod': 'DNS',
            'ResourceRecord': 'record'
        }]
    })

    monkeypatch.setattr(ssl_api_handler, 'fetch_dcv_value', lambda *args, **kwargs: {
        'Certificate': {
            'CertificateArn': 'arn',
            'DomainValidationOptions': [{
                'ValidationMethod': 'DNS',
                'ResourceRecord': 'record'
            }]
        }
    })

    body = {
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
    }
    event = {
        'body': json.dumps(body),
        'aws_request_id': 'request_id',
        'httpMethod': 'GET',
        'path': '/ssl_for_saas'
    }

    context = MockLambdaContext()
    ssl_api_handler.raw_context = context
    app.resolve(event, context)
    resp = cert_create_or_import()

    body = {
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
    event = {
        'body': json.dumps(body),
        'aws_request_id': 'request_id',
        'httpMethod': 'GET',
        'path': '/ssl_for_saas'
    }

    # monkeypatch.setattr(ssl_api_handler, 'import_certificate', lambda *args, **kwargs: {})
    context = MockLambdaContext()
    ssl_api_handler.raw_context = context
    app.resolve(event, context)
    resp = cert_create_or_import()

    body = {
        "acm_op": "import",  # "import"
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
                "CertPem": "xx",
                "PrivateKeyPem": "xx",
                "ChainPem": "xx",
                "existing_cf_info": {
                    'distribution_id': '1',
                    'config_version_id': '1'
                },
            },
            {
                "CertPem": "xx",
                "PrivateKeyPem": "xx",
                "ChainPem": "xx",
                "existing_cf_info": {
                    'distribution_id': '1',
                    'config_version_id': '1'
                },
            }
        ]
    }
    event = {
        'body': json.dumps(body),
        'aws_request_id': 'request_id',
        'httpMethod': 'GET',
        'path': '/ssl_for_saas'
    }

    # monkeypatch.setattr(ssl_api_handler, 'import_certificate', lambda *args, **kwargs: {})
    context = MockLambdaContext()
    ssl_api_handler.raw_context = context
    app.resolve(event, context)
    resp = cert_create_or_import()

    body = {
        "acm_op": "import",  # "import"
        "auto_creation": "extra",
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
                "ChainPem": "xx",
                "existing_cf_info": {
                    'distribution_id': '1',
                    'config_version_id': '1'
                },
            },
            {
                "CertPem": "xx",
                "PrivateKeyPem": "xx",
                "ChainPem": "xx",
                "existing_cf_info": {
                    'distribution_id': '1',
                    'config_version_id': '1'
                },
            }
        ]
    }
    event = {
        'body': json.dumps(body),
        'aws_request_id': 'request_id',
        'httpMethod': 'GET',
        'path': '/ssl_for_saas'
    }

    # monkeypatch.setattr(ssl_api_handler, 'import_certificate', lambda *args, **kwargs: {})
    context = MockLambdaContext()
    ssl_api_handler.raw_context = context
    app.resolve(event, context)
    resp = cert_create_or_import()

    body = {}
    event = {
        'body': json.dumps(body),
        'aws_request_id': 'request_id',
        'httpMethod': 'GET',
        'path': '/ssl_for_saas'
    }

    # monkeypatch.setattr(ssl_api_handler, 'import_certificate', lambda *args, **kwargs: {})
    context = MockLambdaContext()
    ssl_api_handler.raw_context = context
    app.resolve(event, context)
    with pytest.raises(Exception):
        resp = cert_create_or_import()


def test_aggregate_cert_operation(monkeypatch):
    monkeypatch.setenv("LAMBDA_TASK_ROOT", "Lambda root", prepend=False)
    from ssl_api_handler import aggregate_cert_operation
    import ssl_api_handler
    domain_list = [
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
    ]
    context = MockLambdaContext()
    monkeypatch.setattr(ssl_api_handler, 'update_job_field', lambda *args, **kwargs: {})
    monkeypatch.setattr(ssl_api_handler, 'request_certificate', lambda *args, **kwargs: {
        'CertificateArn': 'arn'
    })
    aggregate_cert_operation(1, domain_list, context)
    monkeypatch.setattr(ssl_api_handler, 'is_wildcard', lambda *args, **kwargs: True)
    aggregate_cert_operation(1, domain_list, context)


@mock_acm
def test_manager_certification_list(monkeypatch):
    monkeypatch.setenv("LAMBDA_TASK_ROOT", "Lambda root", prepend=False)
    from ssl_api_handler import manager_certification_list
    import ssl_api_handler

    event = {
        'aws_request_id': 'request_id',
        'httpMethod': 'GET',
        'path': '/ssl_for_saas/cert_list'
    }
    app = APIGatewayRestResolver()
    context = MockLambdaContext()

    app.resolve(event, context)
    acm = boto3.client('acm')
    test_domain = 'test.com'
    certificate = {'DomainName': test_domain,
                   'SubjectAlternativeNames': ['a.' + test_domain, 'b.' + test_domain, '*.' + test_domain]}
    cert = acm.request_certificate(
        DomainName=certificate['DomainName'],
        ValidationMethod='DNS',
        SubjectAlternativeNames=certificate['SubjectAlternativeNames'],
        Options={
            'CertificateTransparencyLoggingPreference': 'ENABLED'
        },
        Tags=[
            {
                'Key': 'issuer',
                'Value': certificate['DomainName'].replace('*.', '')
            }
        ]
    )
    resp = manager_certification_list()


@mock_acm
def test_manager_certification_list_jobId(monkeypatch):
    monkeypatch.setenv("LAMBDA_TASK_ROOT", "Lambda root", prepend=False)
    from ssl_api_handler import manager_certification_list_jobId
    import ssl_api_handler

    event = {
        'aws_request_id': 'request_id',
        'httpMethod': 'GET',
        'path': '/ssl_for_saas/list_ssl_certification_with_jobId?jobId=123',
        'queryStringParameters': {
            'jobId': '123'
        }
    }
    app = APIGatewayRestResolver()
    context = MockLambdaContext()

    app.resolve(event, context)
    acm = boto3.client('acm')
    test_domain = 'test.com'
    certificate = {'DomainName': test_domain,
                   'SubjectAlternativeNames': ['a.' + test_domain, 'b.' + test_domain, '*.' + test_domain]}
    cert = acm.request_certificate(
        DomainName=certificate['DomainName'],
        ValidationMethod='DNS',
        SubjectAlternativeNames=certificate['SubjectAlternativeNames'],
        Options={
            'CertificateTransparencyLoggingPreference': 'ENABLED'
        },
        Tags=[
            {
                'Key': 'issuer',
                'Value': certificate['DomainName'].replace('*.', '')
            }
        ]
    )

    acm.add_tags_to_certificate(
        CertificateArn=cert['CertificateArn'],
        Tags=[
            {
                'Key': 'job_token',
                'Value': '123'
            }
        ]
    )

    result = manager_certification_list_jobId()


@mock_cloudfront
@mock_resourcegroupstaggingapi
def test_manager_cloudfront_arn_list_with_jobId(monkeypatch):
    monkeypatch.setenv("LAMBDA_TASK_ROOT", "Lambda root", prepend=False)
    from ssl_api_handler import manager_cloudfront_arn_list_with_jobId
    import ssl_api_handler
    event = {
        'aws_request_id': 'request_id',
        'httpMethod': 'GET',
        'path': '/ssl_for_saas/list_cloudfront_arn_with_jobId',
        'queryStringParameters': {
            'jobId': '123'
        }
    }
    app = APIGatewayRestResolver()
    context = MockLambdaContext()

    app.resolve(event, context)

    cloudfront = boto3.client('cloudfront')
    cloudfront_config = default_distribution_config
    tags = {
        'Items': [
            {
                'Key': 'job_token',
                'Value': '123'
            },
        ]
    }
    config_with_tag = {
        'DistributionConfig': cloudfront_config,
        'Tags': tags
    }
    cloudfront.create_distribution_with_tags(DistributionConfigWithTags=config_with_tag)
    resp = manager_cloudfront_arn_list_with_jobId()


@mock_dynamodb
def test_manager_list_ssl_jobs(monkeypatch):
    monkeypatch.setenv("LAMBDA_TASK_ROOT", "Lambda root", prepend=False)
    monkeypatch.setenv("JOB_INFO_TABLE", "ssl_for_saas_job_info_table", prepend=False)

    from ssl_api_handler import manager_get_ssl_job, manager_list_ssl_jobs
    import ssl_api_handler
    event = {
        'aws_request_id': 'request_id',
        'httpMethod': 'GET',
        'path': '/ssl_for_saas/get_ssl_job',
        'queryStringParameters': {
            'jobId': '123'
        }
    }
    app = APIGatewayRestResolver()
    context = MockLambdaContext()

    app.resolve(event, context)

    ddb = boto3.resource(service_name="dynamodb", region_name="us-east-1")
    ddb.create_table(
        TableName='ssl_for_saas_job_info_table',
        AttributeDefinitions=[
            {
                'AttributeName': 'jobId',
                'AttributeType': 'S'
            },

        ],
        KeySchema=[
            {
                'AttributeName': 'jobId',
                'KeyType': 'HASH'
            },
        ],
        BillingMode='PROVISIONED',
        ProvisionedThroughput={
            'ReadCapacityUnits': 10,
            'WriteCapacityUnits': 10
        },
    )
    ssl_api_handler.JOB_INFO_TABLE_NAME = 'ssl_for_saas_job_info_table'
    resp = manager_get_ssl_job()
    assert resp is not None

    ddb_table = ddb.Table('ssl_for_saas_job_info_table')
    ddb_table.put_item(Item={
        'jobId': '123',
    })

    resp = manager_get_ssl_job()
    assert resp is not None
    resp = manager_list_ssl_jobs()
    assert resp is not None

    event = {
        'aws_request_id': 'request_id',
        'httpMethod': 'GET',
        'path': '/ssl_for_saas/get_ssl_job',
    }
    app = APIGatewayRestResolver()
    context = MockLambdaContext()

    app.resolve(event, context)
    resp = manager_get_ssl_job()
    assert resp['statusCode'] == 400


def test_lambda_handler(monkeypatch):
    monkeypatch.setenv("LAMBDA_TASK_ROOT", "Lambda root", prepend=False)

    from ssl_api_handler import lambda_handler
    import ssl_api_handler
    app = APIGatewayRestResolver()
    context = MockLambdaContext()
    monkeypatch.setattr(app, 'resolve', lambda *args, **kwargs: {})
    ssl_api_handler.app = app
    resp = lambda_handler({}, context)
