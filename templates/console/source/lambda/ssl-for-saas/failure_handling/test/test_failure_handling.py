from moto import mock_dynamodb
import boto3


@mock_dynamodb
def test_lambda_handler(monkeypatch):
    monkeypatch.setenv("LAMBDA_TASK_ROOT", "Lambda root", prepend=False)
    monkeypatch.setenv("CALLBACK_TABLE", "acm_metadata", prepend=False)
    request_id = 'request id'
    from failure_handling import lambda_handler
    import failure_handling
    event = {
        'input': {
            'aws_request_id': request_id
        }
    }
    failure_handling.CALLBACK_TABLE='acm_metadata'
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
    ddb_table = ddb.Table('acm_metadata')
    ddb_table.put_item(Item={
        'taskToken': '1234',
        'domainName': 'test.com',
        'jobToken': request_id,
    })
    lambda_handler(event, {})
    event = {
        'input': {
            'aws_request_id': 1
        }
    }
    lambda_handler(event, {})



