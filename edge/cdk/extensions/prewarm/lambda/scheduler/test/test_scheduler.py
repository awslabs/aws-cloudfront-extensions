import boto3
import os
import datetime

from boto3.dynamodb.conditions import Key
from moto import mock_dynamodb
from moto import mock_lambda


@mock_dynamodb
def test_write_in_ddb(monkeypatch):
    monkeypatch.setenv('AWS_REGION', 'us-east-1', prepend=False)
    monkeypatch.setenv('DDB_TABLE_NAME', 'Table_name', prepend=False)
    monkeypatch.setenv('cache_invalidator', 'Table_name', prepend=False)
    monkeypatch.setenv('INVALIDATOR_ARN', 'CacheInvalidator', prepend=False)
    aws_region = os.environ['AWS_REGION']
    dynamodb = boto3.resource('dynamodb', region_name=aws_region)
    dynamodb.create_table(
        TableName='Table_name',
        AttributeDefinitions=[
            {
                'AttributeName': 'reqId',
                'AttributeType': 'S'
            },
            {
                'AttributeName': 'url',
                'AttributeType': 'S'
            },
        ],
        KeySchema=[
            {
                'AttributeName': 'reqId',
                'KeyType': 'HASH'
            },
            {
                'AttributeName': 'url',
                'KeyType': 'RANGE'
            }
        ],
        BillingMode='PROVISIONED',
        ProvisionedThroughput={
            'ReadCapacityUnits': 10,
            'WriteCapacityUnits': 10
        },
    )
    from scheduler import write_in_ddb
    req_id = '12345678'
    url_list = ['http://dxias1ysind2y.cloudfront.net/js/bootstrap.bundle.min.js']
    pop = ''
    create_time = ''
    protocol = 'http'
    write_in_ddb(req_id, url_list, pop, create_time, protocol)
    ddb_table = dynamodb.Table('Table_name')
    response = ddb_table.query(
        KeyConditionExpression=Key('reqId').eq(req_id))
    assert len(response['Items']) == 1


def test_compose_error_response(monkeypatch):
    monkeypatch.setenv('AWS_REGION', 'us-east-1', prepend=False)
    monkeypatch.setenv('DDB_TABLE_NAME', 'Table_name', prepend=False)
    monkeypatch.setenv('cache_invalidator', 'Table_name', prepend=False)
    monkeypatch.setenv('INVALIDATOR_ARN', 'CacheInvalidator', prepend=False)
    from scheduler import compose_error_response
    response = compose_error_response('test')
    # constant msg :no need to test!
    assert response is not None


@mock_lambda
def test_start_invalidation(monkeypatch):
    monkeypatch.setenv('AWS_REGION', 'us-east-1', prepend=False)
    monkeypatch.setenv('DDB_TABLE_NAME', 'Table_name', prepend=False)
    monkeypatch.setenv('cache_invalidator', 'Table_name', prepend=False)
    monkeypatch.setenv('INVALIDATOR_ARN', 'CacheInvalidator', prepend=False)
    # url_list, cf_domain, pop_region,
    # req_id, current_time
    req_id = '12345678'
    url_list = ['http://dxias1ysind2y.cloudfront.net/js/bootstrap.bundle.min.js']
    cf_domain = 'dxias1ysind2y.cloudfront.net'
    pop_region = ['ATL56-C1', 'DFW55-C3']
    current_time = datetime.datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')
    import scheduler
    from scheduler import start_invalidation
    conn = boto3.client('lambda')
    monkeypatch.setenv('LAMBDA_ARN', 'LAMBDA_ARN')
    monkeypatch.setattr(scheduler, "lambda_client", conn)
    monkeypatch, setattr(conn, "invoke", mock_invoke)
    response = start_invalidation(url_list, cf_domain, pop_region, req_id, current_time)
    print(response)
    assert response is not None


@mock_lambda
@mock_dynamodb
def test_lambda_handler(monkeypatch):
    monkeypatch.setenv('AWS_REGION', 'us-east-1', prepend=False)
    monkeypatch.setenv('DDB_TABLE_NAME', 'Table_name', prepend=False)
    monkeypatch.setenv('cache_invalidator', 'Table_name', prepend=False)
    monkeypatch.setenv('INVALIDATOR_ARN', 'CacheInvalidator', prepend=False)
    event = {
        'body': '{\"region\":\"all\",'
                '\"cf_domain\":\"dxias1ysind2y.cloudfront.net\",'
                '\"region_type\":\"region\",'
                '\"url_list\":[\"http://dxias1ysind2y.cloudfront.net/js/bootstrap.bundle.min.js\"]}'
    }
    req_id = '12345678'
    class context:
        aws_request_id = req_id

    aws_region = os.environ['AWS_REGION']
    dynamodb = boto3.resource('dynamodb', region_name=aws_region)
    dynamodb.create_table(
        TableName='Table_name',
        AttributeDefinitions=[
            {
                'AttributeName': 'reqId',
                'AttributeType': 'S'
            },
            {
                'AttributeName': 'url',
                'AttributeType': 'S'
            },
        ],
        KeySchema=[
            {
                'AttributeName': 'reqId',
                'KeyType': 'HASH'
            },
            {
                'AttributeName': 'url',
                'KeyType': 'RANGE'
            }
        ],
        BillingMode='PROVISIONED',
        ProvisionedThroughput={
            'ReadCapacityUnits': 10,
            'WriteCapacityUnits': 10
        },
    )
    import scheduler
    from scheduler import lambda_handler
    conn = boto3.client('lambda')
    monkeypatch.setenv('LAMBDA_ARN', 'LAMBDA_ARN')
    monkeypatch.setattr(scheduler, "lambda_client", conn)
    monkeypatch, setattr(conn, "invoke", mock_invoke)
    responses = lambda_handler(event, context)
    print(responses)
    ddb_table = dynamodb.Table('Table_name')
    rlt = ddb_table.query(
        KeyConditionExpression=Key('reqId').eq(req_id))
    assert responses['statusCode'] == 200 and len(rlt['Items']) == 1


def mock_invoke(*args, **kwargs):
    print("test invoke success")
    return {}
