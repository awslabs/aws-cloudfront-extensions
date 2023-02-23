import boto3
import pytest
import json
import urllib3


def test_send(monkeypatch):
    event = {
        "distribution_id": "E2VAU5L5I1SDRU",
        "source_snapshot_name": "Source Snapshot Name",
        "config_version_name": "Config Version Name",
        "config_version_comment": "Config Version Comment",
        "config_version_tags": "tag1,tag2",
        "httpMethod": "GET",
        "path": "/snapshot/get_distribution_cname",
        "ResponseURL": "http://localhost:5000",
        "StackId": "testStackID",
        "RequestId": "testRequestID",
        "LogicalResourceId": "testLogicalResourceID",
    }
    context = {}
    responseStatus = "SUCCESS"
    responseData = {}

    http = urllib3.PoolManager()
    from cfnresponse import send

    class Response:
        status = 200

    def mock_request(*args, **kwargs):
        resp = Response()
        return resp

    monkeypatch.setattr(http, "request", mock_request)

    response = send(event, context, responseStatus, responseData, "physicalResourceId", False, "reason")
