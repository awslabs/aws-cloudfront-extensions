import uuid

import boto3
import pytest
from moto import mock_acm, mock_dynamodb
from tenacity import wait_none, RetryError


def test_transform_json_to_bytes(monkeypatch):
    monkeypatch.setenv("LAMBDA_TASK_ROOT", "Lambda root", prepend=False)

    from acm_import_cb import transform_json_to_bytes
    resp = transform_json_to_bytes({})
    assert resp is not None


@mock_acm
def test_import_certificate(monkeypatch):
    monkeypatch.setenv("LAMBDA_TASK_ROOT", "Lambda root", prepend=False)

    from acm_import_cb import import_certificate
    import acm_import_cb

    import_certificate.retry.wait = wait_none()
    import_certificate.retry.reraise = True

    acm = boto3.client('acm')
    acm_import_cb.acm = acm

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



def test_is_valid_domain(monkeypatch):
    monkeypatch.setenv("LAMBDA_TASK_ROOT", "Lambda root", prepend=False)

    from acm_import_cb import isValidDomain

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


@mock_acm
def test_is_valid_certificate(monkeypatch):
    monkeypatch.setenv("LAMBDA_TASK_ROOT", "Lambda root", prepend=False)

    from acm_import_cb import isValidCertificate
    import acm_import_cb
    acm = boto3.client('acm')
    acm_import_cb.acm = acm

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

    from acm_import_cb import convert_string_to_file
    convert_string_to_file('test', '.testfile_not_used')


def test_get_domain_list_from_cert(monkeypatch):
    monkeypatch.setenv("LAMBDA_TASK_ROOT", "Lambda root", prepend=False)

    from acm_import_cb import get_domain_list_from_cert
    import acm_import_cb

    acm_import_cb.PEM_FILE = './test/0000_key-certbot.pem'
    resp = get_domain_list_from_cert()
    assert resp is not None

    acm_import_cb.PEM_FILE = './test/test_cert.pem'
    resp = get_domain_list_from_cert()
    assert resp is not None

    monkeypatch.setattr(acm_import_cb, 'isValidDomain', lambda *args, **kwargs: False)
    resp = get_domain_list_from_cert()
    assert resp is not None


def test_check_domain_name(monkeypatch):
    monkeypatch.setenv("LAMBDA_TASK_ROOT", "Lambda root", prepend=False)

    from acm_import_cb import check_domain_name
    # import acm_import_cb
    event = {
        'input': {
            "acm_op": "create",
            "dist_aggregate": "false",
            "auto_creation": "true",
            "enable_cname_check": "true",
            "cnameList": [
                {
                    "domainName": "cdn2.risetron.cn",
                    "sanList": [
                        "cdn3.risetron.cn"
                    ],
                    "originsItemsDomainName": "risetron.s3.ap-east-1.amazonaws.com",
                    "existing_cf_info":
                        {
                            "distribution_id": "E2SQNNA26WHYGD",
                            "config_version_id": "5"
                        }
                },
                {
                    "domainName": "cdn3.risetron.cn",
                    "sanList": [
                        "cdn4.risetron.cn"
                    ],
                    "originsItemsDomainName": "risetron.s3.ap-east-1.amazonaws.com",
                    "existing_cf_info":
                        {
                            "distribution_id": "E2SQNNA26WHYGD",
                            "config_version_id": "5"
                        }
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
    }
    with pytest.raises(Exception):
        check_domain_name(event, 0)
    event = {
        'input': {
            "acm_op": "create",
            "dist_aggregate": "false",
            "auto_creation": "true",
            "enable_cname_check": "true",
            "cnameList": [
                {
                    "domainName": "www.example.com",
                    "sanList": [
                        "cdn3.risetron.cn"
                    ],
                    "originsItemsDomainName": "risetron.s3.ap-east-1.amazonaws.com",
                    "existing_cf_info":
                        {
                            "distribution_id": "E2SQNNA26WHYGD",
                            "config_version_id": "5"
                        }
                },
                {
                    "domainName": "cdn3.risetron.cn",
                    "sanList": [
                        "cdn4.risetron.cn"
                    ],
                    "originsItemsDomainName": "risetron.s3.ap-east-1.amazonaws.com",
                    "existing_cf_info":
                        {
                            "distribution_id": "E2SQNNA26WHYGD",
                            "config_version_id": "5"
                        }
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
    }
    check_domain_name(event, 0)


@mock_dynamodb
def test_validate_source_cloudfront_dist(monkeypatch):
    monkeypatch.setenv("LAMBDA_TASK_ROOT", "Lambda root", prepend=False)
    monkeypatch.setenv("CONFIG_VERSION_DDB_TABLE_NAME", "CloudFrontConfigVersionTable", prepend=False)

    from acm_import_cb import validate_source_cloudfront_dist
    import acm_import_cb
    ddb = boto3.resource(service_name="dynamodb", region_name="us-east-1")
    ddb.create_table(
        TableName='CloudFrontConfigVersionTable',
        AttributeDefinitions=[
            {
                'AttributeName': 'distributionId',
                'AttributeType': 'S'
            },
            {
                'AttributeName': 'versionId',
                'AttributeType': 'N'
            },

        ],
        KeySchema=[
            {
                'AttributeName': 'distributionId',
                'KeyType': 'HASH'
            },
            {
                'AttributeName': 'versionId',
                'KeyType': 'HASH'
            },
        ],
        BillingMode='PROVISIONED',
        ProvisionedThroughput={
            'ReadCapacityUnits': 10,
            'WriteCapacityUnits': 10
        },
    )

    domain_name_list = [
        {
            'existing_cf_info': {
                'distribution_id': 'ED1GHHCCBZVHL',
                'config_version_id': '1'
            }
        }
    ]

    ddb_table = ddb.Table('CloudFrontConfigVersionTable')
    ddb_table.put_item(Item={
        'distributionId': 'ED1GHHCCBZVHL',
        'versionId': 1,
    })

    resp = validate_source_cloudfront_dist(domain_name_list)
    # assert resp is not None
    domain_name_list = [
        {
            'existing_cf_info': {
                'distribution_id': 'not_exist',
                'config_version_id': 0
            }
        }
    ]
    with pytest.raises(Exception):
        resp = validate_source_cloudfront_dist(domain_name_list)

    domain_name_list = [
        {
            'existing_cf_info': {
                'distribution_id': 'ED1GHHCCBZVHL',
            }
        }
    ]
    cf = boto3.client('cloudfront')
    monkeypatch.setattr(cf, 'get_distribution', lambda *args, **kwargs: {})
    acm_import_cb.cf = cf

    with pytest.raises(Exception):
        validate_source_cloudfront_dist(domain_name_list)

    monkeypatch.setattr(cf, 'get_distribution', lambda *args, **kwargs: {
        'Distribution': {}
    })
    acm_import_cb.cf = cf

    validate_source_cloudfront_dist(domain_name_list)

    domain_name_list = [{}]
    with pytest.raises(Exception):
        validate_source_cloudfront_dist(domain_name_list)


def test_check_generate_task_token(monkeypatch):
    monkeypatch.setenv("LAMBDA_TASK_ROOT", "Lambda root", prepend=False)

    from acm_import_cb import check_generate_task_token
    resp = check_generate_task_token('')
    assert resp is not None
    resp = check_generate_task_token('test task token')
    assert resp is not None


@mock_dynamodb
def test_create_acm_metadata(monkeypatch):
    callable_table = 'acm_metadata'
    test_task_token = "token"
    monkeypatch.setenv("CALLBACK_TABLE", callable_table, prepend=False)
    test_domain = "test.com"
    from acm_import_cb import _create_acm_metadata
    ddb = boto3.resource(service_name="dynamodb", region_name="us-east-1")
    ddb.create_table(
        TableName='acm_metadata',
        AttributeDefinitions=[
            {
                'AttributeName': 'taskToken',
                'AttributeType': 'S'
            },
            {
                'AttributeName': 'domainName',
                'AttributeType': 'S'
            },
        ],
        KeySchema=[
            {
                'AttributeName': 'taskToken',
                'KeyType': 'HASH'
            },
            {
                'AttributeName': 'domainName',
                'KeyType': 'HASH'
            },
        ],
        BillingMode='PROVISIONED',
        ProvisionedThroughput={
            'ReadCapacityUnits': 10,
            'WriteCapacityUnits': 10
        },

    )
    _create_acm_metadata(callable_table, test_domain, [dict(zip(['S'], [test_domain]))], str(uuid.uuid4()),
                         test_task_token, 'create', 'TASK_TOKEN_TAGGED', 'cert_arn', 'test_token')

    from acm_import_cb import _tag_job_certificate
    import acm_import_cb
    acm = boto3.client('acm')
    acm_import_cb.acm = acm
    monkeypatch.setattr(acm, 'add_tags_to_certificate', lambda *args, **kwargs: {})
    _tag_job_certificate('cert_arn', 'job_token')

    from acm_import_cb import _tag_certificate
    _tag_certificate('cert_arn', 'task_token')


def test_lambda_handle(monkeypatch):
    callable_table = 'acm_metadata'
    test_task_token = "token"
    monkeypatch.setenv("LAMBDA_TASK_ROOT", "Lambda root", prepend=False)
    monkeypatch.setenv("CALLBACK_TABLE", callable_table, prepend=False)
    monkeypatch.setenv("TASK_TYPE", 'task_type', prepend=False)
    from acm_import_cb import lambda_handler
    import acm_import_cb

    event = {
        'task_token': 'tasktoken',
        'input': {
            'aws_request_id': 'aws_request_id',
            "acm_op": "create",
            "dist_aggregate": "false",
            "auto_creation": "true",
            "enable_cname_check": "true",
            "cnameList": [
                {
                    "domainName": "www.example.com",
                    "sanList": [
                        "cdn3.risetron.cn"
                    ],
                    "originsItemsDomainName": "risetron.s3.ap-east-1.amazonaws.com",
                    "existing_cf_info":
                        {
                            "distribution_id": "E2SQNNA26WHYGD",
                            "config_version_id": "5"
                        }
                },
                {
                    "domainName": "cdn3.risetron.cn",
                    "sanList": [
                        "cdn4.risetron.cn"
                    ],
                    "originsItemsDomainName": "risetron.s3.ap-east-1.amazonaws.com",
                    "existing_cf_info":
                        {
                            "distribution_id": "E2SQNNA26WHYGD",
                            "config_version_id": "5"
                        }
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
    }

    monkeypatch.setattr(acm_import_cb, 'create_job_info', lambda *args, **kwargs: {})
    monkeypatch.setattr(acm_import_cb, 'validate_source_cloudfront_dist', lambda *args, **kwargs: {})
    monkeypatch.setattr(acm_import_cb, 'import_certificate', lambda *args, **kwargs: {'CertificateArn': 'cert_arn'})
    monkeypatch.setattr(acm_import_cb, '_create_acm_metadata', lambda *args, **kwargs: {})
    monkeypatch.setattr(acm_import_cb, '_tag_certificate', lambda *args, **kwargs: {})
    monkeypatch.setattr(acm_import_cb, '_tag_job_certificate', lambda *args, **kwargs: {})
    monkeypatch.setattr(acm_import_cb, 'update_job_field', lambda *args, **kwargs: {})
    monkeypatch.setattr(acm_import_cb, 'convert_string_to_file', lambda *args, **kwargs: {})

    resp = lambda_handler(event, {})
    assert resp['statusCode'] == 200

    monkeypatch.setattr(acm_import_cb, 'validate_source_cloudfront_dist', lambda *args, **kwargs: 1/0)
    with pytest.raises(Exception):
        lambda_handler(event, {})


# fixme: duplicated ut
@mock_dynamodb
def test_create_job_info(monkeypatch):
    from job_table_utils import create_job_info

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

    create_job_info('ssl_for_saas_job_info_table', '1', 'job_input', 2, 2, 1, 1, 'create', 0, 'placeholder', 'placeholder', 'placeholder')

    from job_table_utils import update_job_field
    update_job_field('ssl_for_saas_job_info_table', '1', 'status_', 'failed')

# fixme: duplicated test
@mock_dynamodb
def test_get_job_info(monkeypatch):
    from job_table_utils import get_job_info
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
    ddb_table = ddb.Table('ssl_for_saas_job_info_table')
    ddb_table.put_item(Item={
        'jobId': 'jobID01',
    })
    resp = get_job_info('ssl_for_saas_job_info_table', 'jobID01')
    assert resp is not None
    from job_table_utils import update_job_cert_completed_number
    update_job_cert_completed_number('ssl_for_saas_job_info_table', 'jobID01', '1')
    from job_table_utils import update_job_cloudfront_distribution_created_number
    update_job_cloudfront_distribution_created_number('ssl_for_saas_job_info_table', 'jobID01', '0')

