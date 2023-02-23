import boto3
import pytest
import custom_resource
from moto import mock_lambda

from custom_resource import lambda_handler


@mock_lambda
def test_lambda_handler(monkeypatch):
 
    conn = boto3.client('lambda')
    monkeypatch.setenv('LAMBDA_ARN', 'LAMBDA_ARN')
    monkeypatch.setattr(custom_resource, "lambda_client", conn)
    monkeypatch,setattr(conn, "invoke", mock_invoke)
    event = {
        "ResourceType": 'Custom::AddPartNonRealtime',
        "RequestType": 'CREATE'
    }
    lambda_handler(event, None)

def mock_invoke(*args, **kwargs):
    return {}