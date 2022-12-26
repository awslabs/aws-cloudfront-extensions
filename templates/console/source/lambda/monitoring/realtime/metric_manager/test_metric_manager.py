import boto3
import pytest
from moto import mock_dynamodb
from metric_manager import query_metric_ddb
from metric_manager import get_metric_data
from metric_manager import format_date_time
from metric_manager import lambda_handler
from metric_manager import get_real_metric
import metric_manager

@mock_dynamodb
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
    domain_name = "TESTDOMAIN"
    monkeypatch.setenv('DDB_TABLE_NAME', 'CloudFrontMetricsTable', prepend=False)
    monkeypatch.setenv('REGION_NAME', 'us-east-1', prepend=False)
    country = "all"
    monkeypatch.setattr(metric_manager, "dynamodb", ddb)
    monkeypatch.setattr(ddb, "Table", mock_Table)
    metrics = ['request', 'statusCode', 'statusCodeLatency', 'edgeType', 'edgeTypeLatency']
    for i in metrics:
        result = query_metric_ddb(date_time_str_start, date_time_str_end, i, domain_name, country)
        print(result)
    
    monkeypatch.setattr(ddb, "Table", mock_Table_country)
    country = 'US'
    metrics = ['topNUrlRequests', 'topNUrlSize','chr','latencyRatio']
    for i in metrics:
        result = query_metric_ddb(date_time_str_start, date_time_str_end, i, domain_name, country)
        assert len(result) == 1

def test_get_real_metric():
    get_real_metric('statusCodeLatency')
    get_real_metric('statusCode')
    get_real_metric('statusCodeOriginLatency')
    get_real_metric('edgeTypeLatency')
    
@mock_dynamodb
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
    ori_interval = 1
    interval = 1
    country = "all"
    monkeypatch.setattr(metric_manager, "dynamodb", ddb)
    result = get_metric_data(date_time_str_start, date_time_str_end, metric, domain_name, country)
    assert len(result) == 1
    
    metric = 'all'
    result = get_metric_data(date_time_str_start, date_time_str_end, metric, domain_name, country)

def test_format_date_time():
   data_string = '2022-01-22 12:33:09'
   result = format_date_time(data_string)
   assert result == 1642825989

class Context:
    aws_request_id = '0000000'

def test_lambda_handler(monkeypatch):

    date_time_str_start = '2022-01-22 12:33:09'
    date_time_str_end = '2022-01-22 12:50:09'
    metric = 'request'
    domain_name = "TESTDOMAIN"
    event = {
        "queryStringParameters" :{
            "StartTime": date_time_str_start,
            "EndTime": date_time_str_end,
            "Domain": domain_name,
            "Metric": metric,
            "Country": "all"
        }
    }
    context = Context()
    monkeypatch.setattr(metric_manager, "get_metric_data", mock_get_metric_data)
    result = lambda_handler(event, context)
    assert result != None
    
def mock_get_metric_data(*args, **kwargs):
    return 1

def mock_Table(*args, **kwargs):
    return mock_Table_class()

class mock_Table_class:
    def query(*args, **kwargs):
        return {
            "Items": [
                {
                    "timestamp": "0",
                    "metricData":
                                []
                    
                }
            ]
        }

def mock_Table_country(*args, **kwargs):
    return mock_Table_country_class()

class mock_Table_country_class:
    def query(*args, **kwargs):
        return {
            "Items": [
                {
                    "metricId": "statusCode-cfe-workshop.demo.solutions.aws.a2z.org.cn",
                    "timestamp": 1670578440,
                    "metricData": {
                        "US": [
                        {
                        "Latency": "0.100",
                        "Metric": "latencyRatio",
                        "DetailData": [
                            {
                                "Time": "2022-12-20 22:31:00",
                                "Value": "0.00"
                            },
                            {
                                "Time": "2022-12-20 22:34:00",
                                "Value": "0.00"
                            },
                            {
                                "Time": "2022-12-20 22:46:00",
                                "Value": "0.00"
                            },
                            {
                                "Time": "2022-12-21 01:16:00",
                                "Value": "0.00"
                            }
                        ]
                        },
                        {
                            "Count": "11",
                            "Latency": "0.100",
                            "StatusCode": "200"
                        },
                        {
                            "Count": "10",
                            "Latency": "0.012",
                            "StatusCode": "302"
                        }],
                        "KR": [
                        {
                            "Count": "11",
                            "Latency": "0.050", 
                            "StatusCode": "200"
                        }]   
                    }
                }
            ]
        }