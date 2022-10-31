import boto3
from moto import mock_dynamodb


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
    from job_table_utils import update_job_field
    update_job_field('ssl_for_saas_job_info_table', 'jobID01', 'test', 1)


