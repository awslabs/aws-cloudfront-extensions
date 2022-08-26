import boto3
import pytest
from moto import mock_dynamodb2
from metric_manager import query_metric_ddb
from metric_manager import get_metric_data
from metric_manager import format_date_time
from metric_manager import lambda_handler

@mock_dynamodb2
def test_query_metric_ddb(monkeypatch):
    ddb = boto3.resource(service_name="dynamodb",region_name="us-east-1")

    ddb.create_table(
        TableName='CloudFrontMetricsTable',
        AttributeDefinitions=[
            {
                'AttributeName': 'metricId',
                'AttributeType': 'S'
            },
            {
                'AttributeName': 'timestamp',
                'AttributeType': 'S'
            },

        ],
        KeySchema=[
            {
                'AttributeName': 'metricId',
                'KeyType': 'HASH'
            },
            {
                'AttributeName': 'timestamp',
                'KeyType': 'RANGE'
            }
        ],
        BillingMode='PROVISIONED',
        ProvisionedThroughput={
            'ReadCapacityUnits': 10,
            'WriteCapacityUnits': 10
        },
    )

    date_time_str_start = '234234'
    date_time_str_end = '333333'
    metric = 'request'
    domain_name = "TESTDOMAIN"
    monkeypatch.setenv('DDB_TABLE_NAME', 'CloudFrontMetricsTable', prepend=False)
    monkeypatch.setenv('REGION_NAME', 'us-east-1', prepend=False)
    result = query_metric_ddb(date_time_str_start, date_time_str_end, metric, domain_name)
    print(result)

    assert len(result) == 0

@mock_dynamodb2
def test_get_metric_data(monkeypatch):
    ddb = boto3.resource(service_name="dynamodb",region_name="us-east-1")

    ddb.create_table(
        TableName='CloudFrontMetricsTable',
        AttributeDefinitions=[
            {
                'AttributeName': 'metricId',
                'AttributeType': 'S'
            },
            {
                'AttributeName': 'timestamp',
                'AttributeType': 'S'
            },

        ],
        KeySchema=[
            {
                'AttributeName': 'metricId',
                'KeyType': 'HASH'
            },
            {
                'AttributeName': 'timestamp',
                'KeyType': 'RANGE'
            }
        ],
        BillingMode='PROVISIONED',
        ProvisionedThroughput={
            'ReadCapacityUnits': 10,
            'WriteCapacityUnits': 10
        },
    )

    date_time_str_start = '234234'
    date_time_str_end = '333333'
    metric = 'request'
    domain_name = "TESTDOMAIN"
    monkeypatch.setenv('DDB_TABLE_NAME', 'CloudFrontMetricsTable', prepend=False)
    monkeypatch.setenv('REGION_NAME', 'us-east-1', prepend=False)
    result = get_metric_data(date_time_str_start, date_time_str_end, metric, domain_name)
    assert len(result) == 1

def test_format_date_time():
   data_string = '2022-01-22 12:33:09'
   result = format_date_time(data_string)
   assert result == 1642825989

class Context:
    aws_request_id = '0000000'

def test_lambda_handler():
    date_time_str_start = '2022-01-22 12:33:09'
    date_time_str_end = '2022-01-22 12:50:09'
    metric = 'request'
    domain_name = "TESTDOMAIN"
    event = {
        "queryStringParameters" :{
            "StartTime": date_time_str_start,
            "EndTime": date_time_str_end,
            "Domain": domain_name,
            "Metric": metric
        }
    }
    context = Context()

    result = lambda_handler(event, context)
    assert result != None