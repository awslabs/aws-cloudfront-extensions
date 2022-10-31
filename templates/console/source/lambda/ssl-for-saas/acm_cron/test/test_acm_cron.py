import boto3
from moto import mock_acm
from moto import mock_dynamodb
from moto import mock_stepfunctions


@mock_acm
def test_query_certificate_status(monkeypatch):
    monkeypatch.setenv("LAMBDA_TASK_ROOT", "Lambda root", prepend=False)

    from acm_cron import query_certificate_status
    import acm_cron

    acm = boto3.client('acm')
    acm_cron.acm = acm
    task_token = 'test_task_token'
    def mock_acm_list_issued(*args, **kwargs):
        return {
            'CertificateSummaryList': [
                {'CertificateArn': 'arn'}
            ],
            'Tags': [
                {
                    'Key': 'task_token',
                    'Value': task_token
                }
            ],
            'CertificateArn': 'cert_arn',
            'Certificate': {
                'Status': 'ISSUED'
            }
        }

    monkeypatch.setattr(acm, 'list_certificates', mock_acm_list_issued)
    monkeypatch.setattr(acm, 'list_tags_for_certificate', mock_acm_list_issued)
    monkeypatch.setattr(acm, 'describe_certificate', mock_acm_list_issued)

    resp = query_certificate_status(task_token)
    assert resp == 'certIssued'

    def mock_acm_list_pending(*args, **kwargs):
        return {
            'CertificateSummaryList': [
                {'CertificateArn': 'arn'}
            ],
            'Tags': [
                {
                    'Key': 'task_token',
                    'Value': task_token
                }
            ],
            'CertificateArn': 'cert_arn',
            'Certificate': {
                'Status': 'PENDING_VALIDATION'
            }
        }

    monkeypatch.setattr(acm, 'list_certificates', mock_acm_list_pending)
    monkeypatch.setattr(acm, 'list_tags_for_certificate', mock_acm_list_pending)
    monkeypatch.setattr(acm, 'describe_certificate', mock_acm_list_pending)

    resp = query_certificate_status(task_token)
    assert resp == 'certNotIssued'

    def mock_acm_list_timeout(*args, **kwargs):
        return {
            'CertificateSummaryList': [
                {'CertificateArn': 'arn'}
            ],
            'Tags': [
                {
                    'Key': 'task_token',
                    'Value': task_token
                }
            ],
            'CertificateArn': 'cert_arn',
            'Certificate': {
                'Status': 'VALIDATION_TIMED_OUT'
            }
        }

    monkeypatch.setattr(acm, 'list_certificates', mock_acm_list_timeout)
    monkeypatch.setattr(acm, 'list_tags_for_certificate', mock_acm_list_timeout)
    monkeypatch.setattr(acm, 'describe_certificate', mock_acm_list_timeout)

    resp = query_certificate_status(task_token)
    assert resp == 'certFailed'

    def mock_acm_list_failed(*args, **kwargs):
        return {
            'CertificateSummaryList': [
                {'CertificateArn': 'arn'}
            ],
            'Tags': [
                {
                    'Key': 'task_token',
                    'Value': task_token
                }
            ],
            'CertificateArn': 'cert_arn',
            'Certificate': {
                'Status': 'FAILED'
            }
        }

    monkeypatch.setattr(acm, 'list_certificates', mock_acm_list_failed)
    monkeypatch.setattr(acm, 'list_tags_for_certificate', mock_acm_list_failed)
    monkeypatch.setattr(acm, 'describe_certificate', mock_acm_list_failed)

    resp = query_certificate_status(task_token)
    assert resp == 'certFailed'

    from acm_cron import query_certificate_job_id
    resp = query_certificate_job_id(task_token)
    assert resp is None

    def mock_acm_list_has_tag_value(*args, **kwargs):
        return {
            'CertificateSummaryList': [
                {'CertificateArn': 'arn'}
            ],
            'Tags': [
                {
                    'Key': 'task_token',
                    'Value': task_token
                },
                {
                    'Key': 'job_token',
                    'Value': 'job_token'
                }
            ],
            'CertificateArn': 'cert_arn',
            'Certificate': {
                'Status': 'FAILED'
            }
        }

    monkeypatch.setattr(acm, 'list_certificates', mock_acm_list_has_tag_value)
    monkeypatch.setattr(acm, 'list_tags_for_certificate', mock_acm_list_has_tag_value)
    monkeypatch.setattr(acm, 'describe_certificate', mock_acm_list_has_tag_value)

    resp = query_certificate_job_id(task_token)
    assert resp == 'job_token'


@mock_dynamodb
def test_fetch_acm_status_from_waiting_list(monkeypatch):
    monkeypatch.setenv("LAMBDA_TASK_ROOT", "Lambda root", prepend=False)

    from acm_cron import fetch_acm_status_from_waiting_list
    import acm_cron

    ddb = boto3.client('dynamodb')
    acm_cron.dynamo_client = ddb
    table_name = 'table_name'
    task_type = 'task_type'
    task_status = 'task_status'

    def mock_ddb_scan_no_result(*args, **kwargs):
        return {
            'Count': 0
        }

    monkeypatch.setattr(ddb, 'scan', mock_ddb_scan_no_result)
    fetch_acm_status_from_waiting_list(table_name, task_type, task_status)

    def mock_ddb_scan_no_result(*args, **kwargs):
        return {
            'Count': 0
        }

    monkeypatch.setattr(ddb, 'scan', mock_ddb_scan_no_result)

    def mock_ddb_scan_with_result(*args, **kwargs):
        return {
            'Count': 1,
            'Items': [
                {
                    'taskToken': {'S': 'token'},
                    'domainName': {'S': 'test.com'}
                }
            ]
        }

    monkeypatch.setattr(ddb, 'scan', mock_ddb_scan_with_result)
    monkeypatch.setattr(acm_cron, 'query_update_metadata', mock_ddb_scan_with_result)
    fetch_acm_status_from_waiting_list(table_name, task_type, task_status)

@mock_dynamodb
@mock_acm
@mock_stepfunctions
def test_query_update_metadata(monkeypatch):
    monkeypatch.setenv("LAMBDA_TASK_ROOT", "Lambda root", prepend=False)

    from acm_cron import query_update_metadata
    import acm_cron
    query_update_metadata({}, {}, 'placeholder')

    acm_dcv_dict = {
        'taskToken_01': ['01.domain.com']
    }

    item = {
        'taskToken': {'S': 'task_token'}
    }

    query_update_metadata(acm_dcv_dict, {}, 'placeholder')
    statuxx = ['certIssued', 'certNotIssued', 'certFailed']
    ddb = boto3.client(service_name="dynamodb", region_name="us-east-1")
    acm_cron.dynamo_client = ddb
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
    stepfunction = boto3.client('stepfunctions')
    acm_cron.sf_client = stepfunction

    def mock_send_task_xx(*args, **kwargs):
        return {}

    monkeypatch.setattr(stepfunction, 'send_task_success', mock_send_task_xx)
    monkeypatch.setattr(stepfunction, 'send_task_failure', mock_send_task_xx)
    monkeypatch.setattr(stepfunction, 'send_task_heartbeat', mock_send_task_xx)
    for status in statuxx:
        def mock_query_certificate_status_issued(*args, **kwargs):
            return status


        monkeypatch.setattr(acm_cron, 'query_certificate_status', mock_query_certificate_status_issued)

        def mock_get_job_with_items(*args, **kwargs):
            return {
                'Items': [
                    {
                        'cert_total_number': 1
                    }
                ]
            }

        monkeypatch.setattr(acm_cron, 'get_job_info', mock_get_job_with_items)
        monkeypatch.setattr(acm_cron, 'update_job_cert_completed_number', mock_query_certificate_status_issued)
        query_update_metadata(acm_dcv_dict, item, 'acm_metadata')

        def mock_get_job_with_no_items(*args, **kwargs):
            return {}

        monkeypatch.setattr(acm_cron, 'get_job_info', mock_get_job_with_no_items)
        monkeypatch.setattr(acm_cron, 'update_job_cert_completed_number', mock_query_certificate_status_issued)
        query_update_metadata(acm_dcv_dict, item, 'acm_metadata')


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


def test_lambda_handler(monkeypatch):
    import acm_cron
    def mock_fetch(*args, **kwargs):
        return {}

    monkeypatch.setattr(acm_cron, 'fetch_acm_status_from_waiting_list', mock_fetch)
    acm_cron.lambda_handler({}, {})


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
