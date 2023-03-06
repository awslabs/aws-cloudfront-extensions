import boto3
import pytest
import json
import os
from moto import mock_dynamodb, mock_sqs
from moto import mock_cloudfront
# from status_fetcher import *
from unittest.mock import MagicMock, patch
from moto import mock_dynamodb
import datetime



def test_pop_prefix(monkeypatch):
    monkeypatch.setenv('DDB_TABLE_NAME', 'Table_name', prepend=False)
    monkeypatch.setenv('AWS_REGION', 'us-west-2', prepend=False)
    monkeypatch.setenv('SHOW_SUCC_URLS', 'DDB_LATESTVERSION_TABLE_NAME', prepend=False)
    from status_fetcher import pop_prefix
    pop_list = ['aaaaa','bbbbb','ccccc']
    assert pop_prefix(pop_list) == ['aaa','bbb','ccc']


@mock_dynamodb
def test_prewarm_status_from_ddb(monkeypatch):
    monkeypatch.setenv('DDB_TABLE_NAME', 'Table_name', prepend=False)
    monkeypatch.setenv('AWS_REGION', 'us-west-2', prepend=False)
    monkeypatch.setenv('SHOW_SUCC_URLS', 'DDB_LATESTVERSION_TABLE_NAME', prepend=False)
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

    from status_fetcher import prewarm_status_from_ddb
    prewarm_status_from_ddb('1234567', dynamodb)
    ddb_table = dynamodb.Table('Table_name')
    resp = ddb_table.put_item(
        Item={
            'reqId': '1234567',
            'url': 'http://www.example.com',
            'status': 'SUCCESS',
            'create_time': '20230216T073755Z',
            'urlList': ['http://www.example.com']
        }
    )

    prewarm_status_from_ddb('1234567', dynamodb)

    resp = ddb_table.put_item(
        Item={
            'reqId': '1234562',
            'url': 'http://www.example.com',
            'status': 'SUCCESS',
            'create_time': '20230216T073755Z',
        }
    )
    prewarm_status_from_ddb('1234562', dynamodb)

    resp = ddb_table.put_item(
        Item={
            'reqId': '22222',
            'url': 'http://www.example.com',
            'status': 'FAILED',
            'create_time': '20230216T073755Z',
            'failure': 'http://www.example1.com',
            'success': 'http://www.example2.com'
        }
    )
    prewarm_status_from_ddb('22222', dynamodb)

    resp = ddb_table.put_item(
        Item={
            'reqId': '1234568',
            'url': 'http://www.example2.com',
            'status': 'INPROGRESS',
            'create_time': '20220216T073755Z',
            'urlList': ['http://www.example2.com']
        }
    )
    prewarm_status_from_ddb('1234568', dynamodb)

    resp = ddb_table.put_item(
        Item={
            'reqId': '1234569',
            'url': 'http://www.example3.com',
            'status': 'FAILED',
            'create_time': '20220216T073755Z',
            'urlList': ['http://www.example3.com'],
            'failure': ['http://www.example3.com']
        }
    )
    prewarm_status_from_ddb('1234569', dynamodb)

@mock_dynamodb
def test_lambda_handler(monkeypatch):
    monkeypatch.setenv('DDB_TABLE_NAME', 'Table_name', prepend=False)
    monkeypatch.setenv('AWS_REGION', 'us-west-2', prepend=False)
    monkeypatch.setenv('SHOW_SUCC_URLS', 'DDB_LATESTVERSION_TABLE_NAME', prepend=False)
    aws_region = os.environ['AWS_REGION']
    dynamodb = boto3.resource('dynamodb', region_name=aws_region)
    event = {
        'queryStringParameters': {
            'requestID': '1234567'
        }
    }
    context = {}
    from status_fetcher import lambda_handler
    lambda_handler(event, context)