import boto3
from moto import mock_acm, mock_dynamodb

event = {
    "job_id": "2f193ef0-5210-44d6-bb8f-559a8690461d",
    "body": "eyJ0ZXN0IjoiYm9keSJ9",
    "resource": "/{proxy+}",
    "path": "/cf_config_manager/versions",
    "httpMethod": "GET",
    "isBase64Encoded": True,
    "queryStringParameters": {
        "distributionId": "EZVWX0EG9VYPE"
    },
    "multiValueQueryStringParameters": {
        "foo": [
            "EZVWX0EG9VYPE"
        ]
    },
    "pathParameters": {
        "proxy": "/cf_config_manager/versions"
    },
    "stageVariables": {
        "baz": "qux"
    },
    "headers": {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Encoding": "gzip, deflate, sdch",
        "Accept-Language": "en-US,en;q=0.8",
        "Cache-Control": "max-age=0",
        "CloudFront-Forwarded-Proto": "https",
        "CloudFront-Is-Desktop-Viewer": "true",
        "CloudFront-Is-Mobile-Viewer": "false",
        "CloudFront-Is-SmartTV-Viewer": "false",
        "CloudFront-Is-Tablet-Viewer": "false",
        "CloudFront-Viewer-Country": "US",
        "Host": "1234567890.execute-api.us-east-1.amazonaws.com",
        "Upgrade-Insecure-Requests": "1",
        "User-Agent": "Custom User Agent String",
        "Via": "1.1 08f323deadbeefa7af34d5feb414ce27.cloudfront.net (CloudFront)",
        "X-Amz-Cf-Id": "cDehVQoZnx43VYQb9j2-nvCh-9z396Uhbp027Y2JvkCPNLmGJHqlaA==",
        "X-Forwarded-For": "127.0.0.1, 127.0.0.2",
        "X-Forwarded-Port": "443",
        "X-Forwarded-Proto": "https"
    },
    "multiValueHeaders": {
        "Accept": [
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
        ],
        "Accept-Encoding": [
            "gzip, deflate, sdch"
        ],
        "Accept-Language": [
            "en-US,en;q=0.8"
        ],
        "Cache-Control": [
            "max-age=0"
        ],
        "CloudFront-Forwarded-Proto": [
            "https"
        ],
        "CloudFront-Is-Desktop-Viewer": [
            "true"
        ],
        "CloudFront-Is-Mobile-Viewer": [
            "false"
        ],
        "CloudFront-Is-SmartTV-Viewer": [
            "false"
        ],
        "CloudFront-Is-Tablet-Viewer": [
            "false"
        ],
        "CloudFront-Viewer-Country": [
            "US"
        ],
        "Host": [
            "0123456789.execute-api.us-east-1.amazonaws.com"
        ],
        "Upgrade-Insecure-Requests": [
            "1"
        ],
        "User-Agent": [
            "Custom User Agent String"
        ],
        "Via": [
            "1.1 08f323deadbeefa7af34d5feb414ce27.cloudfront.net (CloudFront)"
        ],
        "X-Amz-Cf-Id": [
            "cDehVQoZnx43VYQb9j2-nvCh-9z396Uhbp027Y2JvkCPNLmGJHqlaA=="
        ],
        "X-Forwarded-For": [
            "127.0.0.1, 127.0.0.2"
        ],
        "X-Forwarded-Port": [
            "443"
        ],
        "X-Forwarded-Proto": [
            "https"
        ]
    },
    "requestContext": {
        "accountId": "123456789012",
        "resourceId": "123456",
        "stage": "prod",
        "requestId": "c6af9ac6-7b61-11e6-9a41-93e8deadbeef",
        "requestTime": "09/Apr/2015:12:34:56 +0000",
        "requestTimeEpoch": 1428582896000,
        "identity": {
            "cognitoIdentityPoolId": None,
            "accountId": None,
            "cognitoIdentityId": None,
            "caller": None,
            "accessKey": None,
            "sourceIp": "127.0.0.1",
            "cognitoAuthenticationType": None,
            "cognitoAuthenticationProvider": None,
            "userArn": None,
            "userAgent": "Custom User Agent String",
            "user": None
        },
        "path": "/cf_config_manager/versions",
        "resourcePath": "/{proxy+}",
        "httpMethod": "GET",
        "apiId": "1234567890",
        "protocol": "HTTP/1.1"
    },
    'job_input': {
        'cert_total_number': 1,
        'auto_creation': 'false',
        'certValidationStageStatus': 'SUCCESS'
    }
}

@mock_dynamodb
@mock_acm
def test_lambda_handler(monkeypatch):
    monkeypatch.setenv("LAMBDA_TASK_ROOT", "Lambda root", prepend=False)

    from job_status_update import lambda_handler
    import job_status_update
    acm = boto3.client('acm')
    monkeypatch.setattr(acm, 'list_tags_for_certificate', lambda *args, **kwargs: {
        'Tags': [
            {
                'Key': 'job_token',
                'Value': '2f193ef0-5210-44d6-bb8f-559a8690461d'
            }
        ],
        'CertificateSummaryList': [
            {'CertificateArn': 'arn'}
        ]
    })
    job_status_update.acm_client = acm
    job_status_update.JOB_INFO_TABLE_NAME = 'ssl_for_saas_job_info_table'

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
        'jobId': '2f193ef0-5210-44d6-bb8f-559a8690461d',
        'cert_total_number': 1,
        'certValidationStageStatus': 'FAIL',
        'job_input': '{\"cert_total_number\": 1, \"auto_creation\": \"false\",\"certValidationStageStatus\": \"SUCCESS\"}'
    })

    monkeypatch.setattr(job_status_update, 'update_job_field', lambda *args, **kwargs: {})
    monkeypatch.setattr(acm, 'list_certificates', lambda *args, **kwargs: {
        'CertificateSummaryList': [
            {'CertificateArn': ''}
        ]
    })
    monkeypatch.setattr(acm, 'list_tags_for_certificate', lambda *args, **kwargs: {
        'Tags': [{'Key': 'job_token', 'Value': '2f193ef0-5210-44d6-bb8f-559a8690461d'}]
    })

    lambda_handler(event, {})

    ddb_table.put_item(Item={
        'jobId': '2f193ef0-5210-44d6-bb8f-559a8690461d',
        'cert_total_number': 2,
        'certValidationStageStatus': 'FAIL',
        'job_input': '{\"cert_total_number\": 1, \"auto_creation\": \"false\",\"certValidationStageStatus\": \"SUCCESS\"}'
    })
    lambda_handler(event, {})


