import uuid
import boto3
import pytest

from moto import mock_acm
from moto import mock_dynamodb
from moto import mock_sns
from requests import exceptions
from tenacity import wait_none, RetryError

certificate = {}


def test_is_subset(monkeypatch):
    monkeypatch.setenv("LAMBDA_TASK_ROOT", "Lambda root", prepend=False)

    from acm_cb import is_wildcard, is_subset
    san = ["*.test.com"]
    res = is_wildcard(san)
    assert res == san[0]
    not_wild = is_wildcard(["test.com", "test2.com"])
    assert not_wild is None
    res = is_subset(san, {san[0]: "certArn"})
    assert res == "certArn"
    res = is_subset(san, {"not.com": "notSub"})
    assert res is None

    from acm_cb import check_generate_task_token
    task_token_resp = check_generate_task_token("")
    assert task_token_resp != ""

    from acm_cb import aggregate_dist
    import acm_cb

    def mock_publish(*args, **kwargs):
        return True
    domain_name_list = [
        {
            "domainName": "demo4api.erinzh.com",
            "sanList": [
                "demo4api.erinzh.com"
            ],
            "existing_cf_info":
                {
                    "distribution_id": "ED1GHHCCBZVHL",
                    "config_version_id": "1"
                }
        }
    ]
    monkeypatch.setattr(acm_cb, '_create_acm_metadata', mock_publish)

    def mock_common(*args, **kwargs):
        return {
            "CertificateArn": "placeholder"
        }
    monkeypatch.setattr(acm_cb, '_common_cert_operations', mock_common)
    aggregate_dist('placeholder', domain_name_list, 'sns_msg', task_token_resp, "create", "job_token")
    domain_name_list_wildcard = [
        {
            "domainName": "demo4api.erinzh.com",
            "sanList": [
                "demo4api.erinzh.com",
                "*.erinzh.com",
            ],
            "existing_cf_info":
                {
                    "distribution_id": "ED1GHHCCBZVHL",
                    "config_version_id": "1"
                }
        }
    ]
    aggregate_dist('placeholder', domain_name_list_wildcard, 'sns_msg', task_token_resp, "create", "job_token")
    monkeypatch.setattr(acm_cb, 'is_subset', mock_publish)
    aggregate_dist('placeholder', domain_name_list, 'sns_msg', task_token_resp, "create", "job_token")


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
    certificate['DomainName'] = test_domain
    certificate['SubjectAlternativeNames'] = ['a.' + test_domain, 'b.' + test_domain, '*.' + test_domain]
    # cert['SubjectAlternativeNames'] = cname_value[sanList]
    from acm_cb import request_certificate, _tag_certificate, _tag_job_certificate
    import acm_cb

    cert_resp = request_certificate(certificate)
    assert cert_resp is not None
    _tag_certificate(cert_resp['CertificateArn'], test_task_token)
    _tag_job_certificate(cert_resp['CertificateArn'], test_task_token)

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

    from acm_cb import _create_acm_metadata, fetch_dcv_value
    _create_acm_metadata(callable_table, test_domain, [dict(zip(['S'], [test_domain]))], str(uuid.uuid4()),
                         test_task_token, 'create', 'TASK_TOKEN_TAGGED', cert_resp['CertificateArn'], 'test_token')
    fetch_resp = fetch_dcv_value(cert_resp["CertificateArn"])
    assert fetch_resp is not None

    with pytest.raises(exceptions.Timeout):
        acm_client = boto3.client('acm')

        def mock_describe_certificate(*args, **kwargs):
            return {'Certificate': {}}

        monkeypatch.setattr(acm_client, 'describe_certificate', mock_describe_certificate)
        acm_cb.acm = acm_client
        fetch_dcv_value.retry.wait = wait_none()
        fetch_dcv_value.retry.reraise = True
        fetch_dcv_value(cert_resp["CertificateArn"])

    with pytest.raises(exceptions.Timeout):
        acm_client = boto3.client('acm')

        def mock_describe_certificate(*args, **kwargs):
            return {'Certificate': {'DomainValidationOptions': [{}]}}

        monkeypatch.setattr(acm_client, 'describe_certificate', mock_describe_certificate)
        acm_cb.acm = acm_client
        fetch_dcv_value.retry.wait = wait_none()
        fetch_dcv_value.retry.reraise = True
        fetch_dcv_value(cert_resp["CertificateArn"])

    from acm_cb import _common_cert_operations
    acm_cb.acm = boto3.client('acm')
    resp = _common_cert_operations(callable_table, certificate, [dict(zip(['S'], [test_domain]))], str(uuid.uuid4()),
                                   test_task_token, 'create', ['sns_msg'], 'job_token')
    assert resp is not None

    event = {
        "task_token": "test task token",
        "input": {
            "aws_request_id": "request_id",
            "acm_op": "create",
            "auto_creation": "true",
            "cnameList": [
                {
                    "domainName": "demo4api.erinzh.com",
                    "sanList": [
                        "demo4api.erinzh.com"
                    ],
                    "existing_cf_info":
                        {
                            "distribution_id": "ED1GHHCCBZVHL",
                            "config_version_id": "1"
                        }
                }
            ]
        },
    }
    from acm_cb import lambda_handler

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
    ddb_table = ddb.Table('CloudFrontConfigVersionTable')
    ddb_table.put_item(Item={
        'distributionId': 'ED1GHHCCBZVHL',
        'versionId': 1
    })

    acm_cb.JOB_INFO_TABLE_NAME = "ssl_for_saas_job_info_table"

    with pytest.raises(Exception):
        resp = lambda_handler(event, None)

    monkeypatch.setenv("TASK_TYPE", "placeholder", prepend=False)
    # monkeypatch.setenv("SNS_TOPIC", "placeholder", prepend=False)
    acm_cb.snsTopicArn = 'placeholder'

    sns = boto3.client('sns')

    def mock_publish(*args, **kwargs):
        return True

    monkeypatch.setattr(sns, 'publish', mock_publish)
    acm_cb.sns_client = sns
    resp = lambda_handler(event, None)
    assert resp['statusCode'] == 200


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