import json

import boto3
import pytest

from moto import mock_cloudfront
from moto import mock_acm
from moto import mock_dynamodb
from moto import mock_s3

from tenacity import wait_none, RetryError
from requests import exceptions


default_distribution_config = {
    "CallerReference": "",
    "Aliases": {
        "Quantity": 1,
        "Items": []
    },
    "DefaultRootObject": "",
    "Origins": {
        "Quantity": 1,
        "Items": [
            {
                "Id": "",
                "DomainName": "cloudfrontextnconsolesta-cloudfrontconfigversionc-152y5mcxm4aj9.s3.us-west-1.amazonaws.com",
                "OriginPath": "",
                "CustomHeaders": {
                    "Quantity": 0
                },
                "S3OriginConfig": {
                    "OriginAccessIdentity": ""
                },
                "ConnectionAttempts": 3,
                "ConnectionTimeout": 10,
                "OriginShield": {
                    "Enabled": False
                }
            }
        ]
    },
    "OriginGroups": {
        "Quantity": 0
    },
    "DefaultCacheBehavior": {
        "TargetOriginId": "",
        "TrustedSigners": {
            "Enabled": False,
            "Quantity": 0
        },
        "TrustedKeyGroups": {
            "Enabled": False,
            "Quantity": 0
        },
        "ViewerProtocolPolicy": "allow-all",
        "AllowedMethods": {
            "Quantity": 2,
            "Items": [
                "HEAD",
                "GET"
            ],
            "CachedMethods": {
                "Quantity": 2,
                "Items": [
                    "HEAD",
                    "GET"
                ]
            }
        },
        "SmoothStreaming": False,
        "Compress": False,
        "LambdaFunctionAssociations": {
            "Quantity": 0
        },
        "FieldLevelEncryptionId": "",
        "CachePolicyId": "",
    },
    "CacheBehaviors": {
        "Quantity": 0
    },
    "CustomErrorResponses": {
        "Quantity": 0
    },
    "Comment": "",
    "Logging": {
        "Enabled": False,
        "IncludeCookies": False,
        "Bucket": "",
        "Prefix": ""
    },
    "PriceClass": "PriceClass_All",
    "Enabled": True,
    "ViewerCertificate": {
        "ACMCertificateArn": "",
        "SSLSupportMethod": "sni-only",
        "MinimumProtocolVersion": "TLSv1.2_2019",
        "Certificate": "",
        "CertificateSource": "acm"
    },
    "Restrictions": {
        "GeoRestriction": {
            "RestrictionType": "none",
            "Quantity": 0
        }
    },
    "WebACLId": "",
    "HttpVersion": "http2",
    "IsIPV6Enabled": True
}


@mock_cloudfront
@mock_dynamodb
@mock_s3
def test_create_distribution(monkeypatch):
    monkeypatch.setenv("LAMBDA_TASK_ROOT", "Lambda root", prepend=False)
    cloudfront_config = default_distribution_config

    from acm_cb_handler import create_distribution
    import acm_cb_handler

    cf_resp = create_distribution(cloudfront_config)

    assert cf_resp is not None

    from acm_cb_handler import create_distribution_with_tags
    create_distribution_with_tags.retry.wait = wait_none()
    create_distribution_with_tags.retry.reraise = True
    tags = {
        'Items': [
            {
                'Key': 'job_token',
                'Value': 'placeholder'
            },
        ]
    }
    config_with_tag = {
        'DistributionConfig': cloudfront_config,
        'Tags': tags
    }
    with pytest.raises(Exception):
        tags_resp = create_distribution_with_tags(config_with_tag)

    from acm_cb_handler import scan_for_cert
    ddb = boto3.client(service_name="dynamodb", region_name="us-east-1")

    acm_cb_handler.dynamo_client = ddb

    def mock_scan_for_cert_ddb_no_resp(*args, **kwargs):
        return {
            'Items': []
        }
    monkeypatch.setattr(ddb, 'scan', mock_scan_for_cert_ddb_no_resp)
    scan_for_cert.retry.wait = wait_none()
    scan_for_cert.retry.reraise = True

    with pytest.raises(exceptions.Timeout):
        resp = scan_for_cert('acm_metadata', 'test.com')

    def mock_scan_for_cert_ddb_with_resp(*args, **kwargs):
        return {
            'Items': [{"place_holder": "placeholder"}]
        }
    monkeypatch.setattr(ddb, 'scan', mock_scan_for_cert_ddb_with_resp)
    resp = scan_for_cert('acm_metadata', 'test.com')
    assert resp is not None

    from acm_cb_handler import fetch_cloudfront_config_version
    ddb.create_table(
        TableName='CloudFrontConfigVersionTable',
        AttributeDefinitions=[
            {
                'AttributeName': 'distributionId',
                'AttributeType': 'S'
            },
            {
                'AttributeName': 'versionId',
                'AttributeType': 'N'
            },

        ],
        KeySchema=[
            {
                'AttributeName': 'distributionId',
                'KeyType': 'HASH'
            },
            {
                'AttributeName': 'versionId',
                'KeyType': 'HASH'
            },
        ],
        BillingMode='PROVISIONED',
        ProvisionedThroughput={
            'ReadCapacityUnits': 10,
            'WriteCapacityUnits': 10
        },
    )

    ddb_resource = boto3.resource('dynamodb')
    ddb_table = ddb_resource.Table('CloudFrontConfigVersionTable')
    distribution_id = 'E1Z2Y3'
    resp = ddb_table.put_item(
        Item={
            'distributionId': distribution_id,
            'versionId': 0,
            'config_link': "test",
            's3_bucket': 'CONFIG_VERSION_S3_BUCKET',
            's3_key': 'config_version_1.json'
        }
    )
    s3_client = boto3.client('s3')
    s3_client.create_bucket(Bucket='CONFIG_VERSION_S3_BUCKET')
    s3_client.put_object(Bucket='CONFIG_VERSION_S3_BUCKET', Key='config_version_1.json',
                     Body=json.dumps({"distributionId": distribution_id, "versionId": 0}))
    # monkeypatch.setattr(ddb_table, 'get_item', mock_scan_for_cert_ddb_with_resp())
    fetch_cloudfront_config_version(distribution_id, 0, "CloudFrontConfigVersionTable")


@mock_cloudfront
def test_create_distribution_with_tags(monkeypatch):
    monkeypatch.setenv("LAMBDA_TASK_ROOT", "Lambda root", prepend=False)
    cloudfront_config = default_distribution_config

    from acm_cb_handler import create_distribution_with_tags
    create_distribution_with_tags.retry.wait = wait_none()
    create_distribution_with_tags.retry.reraise = True
    tags = {
        'Items': [
            {
                'Key': 'job_token',
                'Value': 'placeholder'
            },
        ]
    }
    config_with_tag = {
        'DistributionConfig': cloudfront_config,
        'Tags': tags
    }
    tags_resp = create_distribution_with_tags(config_with_tag)
    assert tags_resp is not None


@mock_cloudfront
def test_fetch_cloudfront_config(monkeypatch):
    monkeypatch.setenv("LAMBDA_TASK_ROOT", "Lambda root", prepend=False)

    from acm_cb_handler import fetch_cloudfront_config
    import acm_cb_handler
    cloudfront = boto3.client('cloudfront')
    with pytest.raises(Exception):
        fetch_resp = fetch_cloudfront_config('placeholder')

    def mock_scan_for_cert_ddb_no_resp(*args, **kwargs):
        return {
            'DistributionConfig': {}
        }

    monkeypatch.setattr(cloudfront, 'get_distribution_config', mock_scan_for_cert_ddb_no_resp)
    acm_cb_handler.cf = cloudfront
    fetch_resp = fetch_cloudfront_config('placeholder')
    assert fetch_resp is not None


def test_lambda_handler(monkeypatch):
    from acm_cb_handler import lambda_handler
    import acm_cb_handler
    event = {
        "input": {
            "domainName": "cdn2.risetron.cn",
            "sanList": [
                "cdn3.risetron.cn"
            ],
            # "originsItemsDomainName": "risetron.s3.ap-east-1.amazonaws.com",
            "existing_cf_info":
                {
                    "distribution_id": "E2SQNNA26WHYGD",
                    "config_version_id": "5"
                }
        }
    }

    def mock_scan_for_cert_ddb_with_resp(*args, **kwargs):
        return {
            'Distribution': {
                'Id': '1',
                'ARN': 'ARN',
                'DomainName': 'test.com',
                'DistributionConfig': {
                    'Aliases': 'placeholder'
                }
            },
            'Items': [{
                'certArn': {'S': 'certArn'},
                'taskToken': {'S': 'taskToken'},
                'jobToken': {'S': 'jobToken'},
                'cloudfront_distribution_created_number': 1,
            }]
        }
    monkeypatch.setattr(acm_cb_handler, 'scan_for_cert', mock_scan_for_cert_ddb_with_resp)
    monkeypatch.setattr(acm_cb_handler, 'update_job_field', mock_scan_for_cert_ddb_with_resp)
    with pytest.raises(Exception):
        resp = lambda_handler(event, {})
    ddb = boto3.client('dynamodb')
    monkeypatch.setattr(ddb, 'delete_item', mock_scan_for_cert_ddb_with_resp)
    monkeypatch.setattr(acm_cb_handler, 'construct_cloudfront_config_with_version', mock_scan_for_cert_ddb_with_resp)
    monkeypatch.setattr(acm_cb_handler, 'create_distribution_with_tags', mock_scan_for_cert_ddb_with_resp)
    monkeypatch.setattr(acm_cb_handler, 'get_job_info', mock_scan_for_cert_ddb_with_resp)
    monkeypatch.setattr(acm_cb_handler, 'update_job_cloudfront_distribution_created_number', mock_scan_for_cert_ddb_with_resp)

    acm_cb_handler.dynamo_client = ddb
    resp = lambda_handler(event, {})
    assert resp['statusCode'] == 200
    event = {
        "input": {
            "domainName": "cdn2.risetron.cn",
            "sanList": [
                "cdn3.risetron.cn"
            ],
            "originsItemsDomainName": "risetron.s3.ap-east-1.amazonaws.com",
            "existing_cf_info":
                {
                    "distribution_id": "E2SQNNA26WHYGD",
                    "config_version_id": "5"
                }
        }
    }

    resp = lambda_handler(event, {})
    assert resp['statusCode'] == 200
    event = {
        "input": {
            "domainName": "cdn2.risetron.cn",
            "sanList": [
                "cdn3.risetron.cn"
            ],
            "originsItemsDomainName": "risetron.s3.ap-east-1.amazonaws.com",
            "existing_cf_info":
                {
                    "distribution_id": "E2SQNNA26WHYGD",
                }

        }
    }
    monkeypatch.setattr(acm_cb_handler, 'construct_cloudfront_config_with_dist_id', mock_scan_for_cert_ddb_with_resp)
    resp = lambda_handler(event, {})
    assert resp['statusCode'] == 200
    def mock_scan_for_cert_ddb_with_no_items(*args, **kwargs):
        return {
            'Distribution': {
                'Id': '1',
                'ARN': 'ARN',
                'DomainName': 'test.com',
                'DistributionConfig': {
                    'Aliases': 'placeholder'
                }
            },
        }
    monkeypatch.setattr(acm_cb_handler, 'get_job_info', mock_scan_for_cert_ddb_with_no_items)

    resp = lambda_handler(event, {})
    assert resp['statusCode'] == 200


def test_construct_cloudfront_config_with_version(monkeypatch):
    from acm_cb_handler import construct_cloudfront_config_with_version
    import acm_cb_handler
    def mock_scan_for_cert_ddb_with_resp(*args, **kwargs):
        return {
            'Aliases': {
                'Items': []
            },
            'ViewerCertificate': {
                'CloudFrontDefaultCertificate': {}
            }
        }

    monkeypatch.setattr(acm_cb_handler, 'fetch_cloudfront_config_version', mock_scan_for_cert_ddb_with_resp)
    construct_cloudfront_config_with_version('cert', 'ddb_table', 'orig_id', {}, 0, 1, 'test.com', 0, '/path', ['list'])
    from acm_cb_handler import construct_cloudfront_config_with_dist_id
    monkeypatch.setattr(acm_cb_handler, 'fetch_cloudfront_config', mock_scan_for_cert_ddb_with_resp)
    construct_cloudfront_config_with_dist_id('cert', 'orig_id', {}, 0, 'test.com', 0, '/path', ['list'])


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
    from job_table_utils import update_job_cloudfront_distribution_created_number
    update_job_cloudfront_distribution_created_number('ssl_for_saas_job_info_table', '1', '1')
    from job_table_utils import update_job_field
    update_job_field('ssl_for_saas_job_info_table', '1', 'test', 'test')
