from unittest.mock import MagicMock

import boto3
import pytest
from moto import mock_cloudformation, mock_cloudfront, mock_dynamodb

# Execute pip install 'moto[cloudfront,cloudformation,dynamodb]' before running the test

metadata = [['prewarm', 'https://aws-gcr-solutions.s3.amazonaws.com/Aws-cloudfront-extensions/latest/custom-domain/PrewarmStack.template.json', 'Lambda', 'This Lambda can prewarm static content in specific pop, for example, prewarm a video file in SEA19-C3. After pre-warming the resources, the user can access the resources with lower latency.', 'https://awslabs.github.io/aws-cloudfront-extensions/en/extension-repository/pre-warming/', '', '2022–09–01T07:00:00Z', 'AWS', 'enabled', 'performance', '[{"key":"ShowSuccessUrls","type":"String","desc":"Show success url list in Prewarm status API (true or false)"},{"key":"InstanceType","type":"String","desc":"EC2 spot instance type to send pre-warm requests, eg. c5a.large"},{"key":"ThreadNumber","type":"String","desc":"Thread number to run in parallel in EC2, eg. 4"}]'],
            ['redirect-by-country', 'https://aws-gcr-solutions.s3.amazonaws.com/Aws-cloudfront-extensions/latest/custom-domain/RedirectStack.template.json', 'CFF',
             'This function redirects a user to a country-specific version of a site based on the country of the user. For example, if the user is in Germany, the function redirects the user to the /de/index.html page which is the Germany-specific version of the site. If the user is not in Germany, the request passes through with no modification to the URL. This functions is building the whole URL(https://host/de/index.html) to redirect.', 'https://awslabs.github.io/aws-cloudfront-extensions/en/extension-repository/redirect-by-country/', 'viewer-request', '2022–08–29T08:00:00Z', 'AWS', 'enabled', 'redirection', ''],
            ['true-client-ip', 'https://aws-gcr-solutions.s3.amazonaws.com/Aws-cloudfront-extensions/latest/custom-domain/ClientIP.template.json', 'CFF', 'True-Client-IP is a request HTTP header that you can add to incoming CloudFront requests to include the IP address of a client connecting to CloudFront. Without this header, connections from CloudFront to your origin contain the IP address of the CloudFront server making the request to your origin, not the IP address of the client connected to CloudFront. This CloudFront function adds the True-Client-IP HTTP header to the incoming CloudFront request so your origin has access to the IP address of the client connecting to CloudFront',
             'https://awslabs.github.io/aws-cloudfront-extensions/en/extension-repository/true-client-ip/', 'viewer-request', '2022–08–29T08:00:00Z', 'AWS', 'enabled', 'header', ''],
            ['image-resize', 'https://aws-gcr-solutions.s3.amazonaws.com/Aws-cloudfront-extensions/latest/custom-domain/ResizeImageStack.template.json', 'LambdaEdge', "This solution resizes your images on the fly. The user is able to resize images by Lambda function which is deployed in CloudFront distributions. It will be really useful when there are lots of pictures need to be resized, the user doesn't need to resize them manually", 'https://awslabs.github.io/aws-cloudfront-extensions/en/extension-repository/resize-image/', 'origin-response', '2022–08–29T08:00:00Z', 'AWS', 'enabled', 'image',
             '[{"key":"FitType","type":"String","desc":"How to fit the image. Valid values are cover(Preserving aspect ratio, ensure the image covers both provided dimensions by cropping to fit); contain(Preserving aspect ratio, contain within both provided dimensions using letterboxing where necessary); fill(Ignore the aspect ratio of the input and stretch to both provided dimensions); inside(Preserving aspect ratio, resize the image to be as large as possible while ensuring its dimensions are less than or equal to both those specified), outside (Preserving aspect ratio, resize the image to be as small as possible while ensuring its dimensions are greater than or equal to both those specified)"},{"key":"S3BucketName","type":"String","desc":"S3 bucket name to store the images"}]'],
            ['redirect-by-device', 'https://aws-gcr-solutions.s3.amazonaws.com/Aws-cloudfront-extensions/latest/custom-domain/RedirectDeviceStack.template.json', 'CFF', 'The CloudFront Function will redirect url based on device type, for example, Android device will be forwarded to access content for Android, iPhone will be forwarded to access content for iPhone, desktop device will be forwarded to access content for PC browser.', 'https://github.com/awslabs/aws-cloudfront-extensions/blob/main/edge/nodejs/serving-based-on-device/README_cff.md', 'viewer-request', '2022–10–21T08:00:00Z', 'AWS', 'enabled', 'redirection', '']]

default_distribution_config = {
    "CallerReference": "e1ced1b1-2275-bdf5-a4af-123456789",
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
                "DomainName": "test.s3.us-east-1.amazonaws.com",
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
        "Compress": True,
        "LambdaFunctionAssociations": {
            "Quantity": 0
        },
        "FunctionAssociations": {
            "Quantity": 0
        },
        "FieldLevelEncryptionId": "",
        "CachePolicyId": "658327ea-f89d-4fab-a63d-123456789"
    },
    "CacheBehaviors": {
        "Quantity": 1,
        "Items": [
            {
                "PathPattern": "/test",
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
                "Compress": True,
                "LambdaFunctionAssociations": {
                    "Quantity": 0
                },
                "FunctionAssociations": {
                    "Quantity": 0
                },
                "FieldLevelEncryptionId": "",
                "CachePolicyId": "658327ea-f89d-4fab-a63d-123456789"
            }
        ]
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
        "CloudFrontDefaultCertificate": False,
        "ACMCertificateArn": "arn:aws:acm:us-east-1:123456789:certificate/27708eff-1612-4e47-8e31-123456789",
        "SSLSupportMethod": "sni-only",
        "MinimumProtocolVersion": "TLSv1.2_2021",
        "Certificate": "arn:aws:acm:us-east-1:123456789:certificate/27708eff-1612-4e47-8e31-123456789",
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


def mock_get_distribution_config(*args, **kwargs):
    return {
        "ETag": "E12MXSA1DO1234",
        "DistributionConfig": default_distribution_config
    }


@mock_cloudfront
def test_list_cf_dist(monkeypatch):
    monkeypatch.setenv('AWS_REGION', 'us-east-1', prepend=False)
    monkeypatch.setenv('DDB_TABLE_NAME',
                       'DDB_TABLE_NAME', prepend=False)
    monkeypatch.setenv('EXT_META_DATA_URL', '', prepend=False)

    cf_client = boto3.client('cloudfront', region_name='us-east-1')
    resp = cf_client.create_distribution(
        DistributionConfig=default_distribution_config)
    from deployer import list_cf_dist_with_id

    distribution_id = resp['Distribution']['Id']
    result = list_cf_dist_with_id(-1, '')

    assert result['dist'][0]['id'] == distribution_id
    assert result['total'] == 1


@mock_cloudfront
def test_list_cf_dist_with_marker(monkeypatch):
    monkeypatch.setenv('DDB_TABLE_NAME',
                       'DDB_TABLE_NAME', prepend=False)
    monkeypatch.setenv('AWS_REGION', 'us-east-1', prepend=False)
    monkeypatch.setenv('EXT_META_DATA_URL', '', prepend=False)

    cf_client = boto3.client('cloudfront', region_name='us-east-1')
    resp = cf_client.create_distribution(
        DistributionConfig=default_distribution_config)
    from deployer import list_cf_dist_with_id
    result2 = list_cf_dist_with_id(-1, '')
    print(result2)

    distribution_id = resp['Distribution']['Id']
    result = list_cf_dist_with_id(1, 'TESTMARKER')

    assert result['dist'][0]['id'] == distribution_id
    assert result['total'] == 1


@mock_cloudfront
def test_get_behavior_by_id(monkeypatch):
    cloudfront = boto3.client('cloudfront', region_name='us-west-2')
    resp = cloudfront.create_distribution(
        DistributionConfig=default_distribution_config)
    print(resp['Distribution']['Id'])

    monkeypatch.setenv('DDB_TABLE_NAME',
                       'DDB_TABLE_NAME', prepend=False)
    monkeypatch.setenv('AWS_REGION', 'us-east-1', prepend=False)
    monkeypatch.setenv('EXT_META_DATA_URL', '', prepend=False)

    cf_client = boto3.client('cloudfront')
    monkeypatch.setattr(cf_client, "get_distribution_config",
                        mock_get_distribution_config)
    # resp = cf_client.create_distribution(
    #     DistributionConfig=default_distribution_config)
    from deployer import get_behavior_by_id_impl

    distribution_id = resp['Distribution']['Id']
    result = get_behavior_by_id_impl(str(distribution_id), cf_client)

    print(result)

    assert len(result) == 2
    assert 'Default (*)' in result
    assert '/test' in result


@mock_dynamodb
def test_query_ddb_with_one_result(monkeypatch):
    monkeypatch.setenv('DDB_TABLE_NAME',
                       'DDB_TABLE_NAME', prepend=False)
    monkeypatch.setenv('AWS_REGION', 'us-east-1', prepend=False)
    monkeypatch.setenv('EXT_META_DATA_URL', '', prepend=False)

    from deployer import query_ddb

    ext_name = 'redirect-by-country'

    ddb = boto3.resource(service_name="dynamodb", region_name="us-east-1")
    ddb.create_table(
        TableName='DDB_TABLE_NAME',
        AttributeDefinitions=[
            {
                'AttributeName': 'name',
                'AttributeType': 'S'
            }
        ],
        KeySchema=[
            {
                'AttributeName': 'name',
                'KeyType': 'HASH'
            }
        ],
        BillingMode='PAY_PER_REQUEST'
    )
    ddb_table = ddb.Table('DDB_TABLE_NAME')

    ddb_table.put_item(
        Item={
            'name': ext_name,
            'author': 'test author',
            'desc': 'test desc'
        }
    )
    ddb_table.put_item(
        Item={
            'name': 'another name',
            'author': 'test author',
            'desc': 'test desc'
        }
    )

    result = query_ddb(ext_name)
    assert result == {'name': 'redirect-by-country',
                      'author': 'test author', 'desc': 'test desc'}


@mock_dynamodb
def test_query_ddb_without_result(monkeypatch):
    monkeypatch.setenv('DDB_TABLE_NAME',
                       'DDB_TABLE_NAME', prepend=False)
    monkeypatch.setenv('AWS_REGION', 'us-east-1', prepend=False)
    monkeypatch.setenv('EXT_META_DATA_URL', '', prepend=False)

    from deployer import query_ddb

    ext_name = 'redirect-by-country'

    ddb = boto3.resource(service_name="dynamodb", region_name="us-east-1")
    ddb.create_table(
        TableName='DDB_TABLE_NAME',
        AttributeDefinitions=[
            {
                'AttributeName': 'name',
                'AttributeType': 'S'
            }
        ],
        KeySchema=[
            {
                'AttributeName': 'name',
                'KeyType': 'HASH'
            }
        ],
        BillingMode='PAY_PER_REQUEST'
    )
    ddb_table = ddb.Table('DDB_TABLE_NAME')

    ddb_table.put_item(
        Item={
            'name': ext_name,
            'author': 'test author',
            'desc': 'test desc'
        }
    )

    with pytest.raises(Exception):
        query_ddb('not-existed-name')


@mock_dynamodb
def test_list_extension(monkeypatch):
    monkeypatch.setenv('DDB_TABLE_NAME',
                       'DDB_TABLE_NAME', prepend=False)
    monkeypatch.setenv('AWS_REGION', 'us-east-1', prepend=False)
    monkeypatch.setenv('EXT_META_DATA_URL', '', prepend=False)

    from deployer import list_ext

    ddb = boto3.resource(service_name="dynamodb", region_name="us-east-1")
    ddb.create_table(
        TableName='DDB_TABLE_NAME',
        AttributeDefinitions=[
            {
                'AttributeName': 'name',
                'AttributeType': 'S'
            }
        ],
        KeySchema=[
            {
                'AttributeName': 'name',
                'KeyType': 'HASH'
            }
        ],
        BillingMode='PAY_PER_REQUEST'
    )
    ddb_table = ddb.Table('DDB_TABLE_NAME')

    ddb_table.put_item(
        Item={
            'name': 'redirect-by-country',
            'type': 'test type 1',
            'desc': 'test desc 1',
            'status': 'enabled'
        }
    )
    ddb_table.put_item(
        Item={
            'name': 'true-client-ip',
            'type': 'test type 2',
            'desc': 'test desc 2',
            'status': 'enabled'
        }
    )
    ddb_table.put_item(
        Item={
            'name': 'resize-image',
            'type': 'test type 3',
            'desc': 'test desc 3',
            'status': 'disabled'
        }
    )

    result = list_ext(page=1, count=50)
    assert result['extension'] == [{'name': 'redirect-by-country', 'type': 'test type 1', 'desc': 'test desc 1',
                                    'status': 'enabled'}, {'name': 'true-client-ip', 'type': 'test type 2', 'desc': 'test desc 2', 'status': 'enabled'}]
    assert result['total'] == 2


@mock_dynamodb
def test_check_need_to_sync_count_different(monkeypatch):
    monkeypatch.setenv('DDB_TABLE_NAME',
                       'DDB_TABLE_NAME', prepend=False)
    monkeypatch.setenv('AWS_REGION', 'us-east-1', prepend=False)
    monkeypatch.setenv('EXT_META_DATA_URL', 'test_url', prepend=False)

    ddb = boto3.resource(service_name="dynamodb", region_name="us-east-1")
    ddb.create_table(
        TableName='DDB_TABLE_NAME',
        AttributeDefinitions=[
            {
                'AttributeName': 'name',
                'AttributeType': 'S'
            }
        ],
        KeySchema=[
            {
                'AttributeName': 'name',
                'KeyType': 'HASH'
            }
        ],
        BillingMode='PAY_PER_REQUEST'
    )
    ddb_table = ddb.Table('DDB_TABLE_NAME')

    ddb_table.put_item(
        Item={
            'name': 'redirect-by-country',
            'type': 'test type 1',
            'desc': 'test desc 1',
            'status': 'enabled'
        }
    )
    ddb_table.put_item(
        Item={
            'name': 'true-client-ip',
            'type': 'test type 2',
            'desc': 'test desc 2',
            'status': 'enabled'
        }
    )
    ddb_table.put_item(
        Item={
            'name': 'resize-image',
            'type': 'test type 3',
            'desc': 'test desc 3',
            'status': 'disabled'
        }
    )
    import deployer
    deployer.ext_metadata = MagicMock(return_value=metadata)
    result = deployer.check_sync_status_impl('test_url')

    assert result == 'true'


@mock_dynamodb
def test_check_not_need_to_sync_date_different(monkeypatch):
    monkeypatch.setenv('DDB_TABLE_NAME',
                       'DDB_TABLE_NAME', prepend=False)
    monkeypatch.setenv('AWS_REGION', 'us-east-1', prepend=False)
    monkeypatch.setenv('EXT_META_DATA_URL', 'test_url', prepend=False)

    ddb = boto3.resource(service_name="dynamodb", region_name="us-east-1")
    ddb.create_table(
        TableName='DDB_TABLE_NAME',
        AttributeDefinitions=[
            {
                'AttributeName': 'name',
                'AttributeType': 'S'
            }
        ],
        KeySchema=[
            {
                'AttributeName': 'name',
                'KeyType': 'HASH'
            }
        ],
        BillingMode='PAY_PER_REQUEST'
    )
    ddb_table = ddb.Table('DDB_TABLE_NAME')

    ddb_table.put_item(
        Item={
            'name': 'redirect-by-country',
            'type': 'test type 1',
            'desc': 'test desc 1',
            'status': 'enabled',
            'updateDate': '2022–08–29T08:00:00Z'
        }
    )
    ddb_table.put_item(
        Item={
            'name': 'true-client-ip',
            'type': 'test type 2',
            'desc': 'test desc 2',
            'status': 'enabled',
            'updateDate': '2022–08–29T08:00:00Z'
        }
    )
    ddb_table.put_item(
        Item={
            'name': 'image-resize',
            'type': 'test type 3',
            'desc': 'test desc 3',
            'status': 'disabled',
            'updateDate': '2022–09–29T08:00:00Z'
        }
    )
    ddb_table.put_item(
        Item={
            'name': 'redirect-by-device',
            'type': 'test type 2',
            'desc': 'test desc 2',
            'status': 'enabled',
            'updateDate': '2022–11–21T08:00:00Z'
        }
    )
    ddb_table.put_item(
        Item={
            'name': 'prewarm',
            'type': 'test type 3',
            'desc': 'test desc 3',
            'status': 'disabled',
            'updateDate': '2022–09–01T07:00:00Z'
        }
    )
    import deployer
    deployer.ext_metadata = MagicMock(return_value=metadata)
    result = deployer.check_sync_status_impl('test_url')

    assert result == 'true'


@mock_dynamodb
def test_check_not_need_to_sync(monkeypatch):
    monkeypatch.setenv('DDB_TABLE_NAME',
                       'DDB_TABLE_NAME', prepend=False)
    monkeypatch.setenv('AWS_REGION', 'us-east-1', prepend=False)
    monkeypatch.setenv('EXT_META_DATA_URL', 'test_url', prepend=False)

    ddb = boto3.resource(service_name="dynamodb", region_name="us-east-1")
    ddb.create_table(
        TableName='DDB_TABLE_NAME',
        AttributeDefinitions=[
            {
                'AttributeName': 'name',
                'AttributeType': 'S'
            }
        ],
        KeySchema=[
            {
                'AttributeName': 'name',
                'KeyType': 'HASH'
            }
        ],
        BillingMode='PAY_PER_REQUEST'
    )
    ddb_table = ddb.Table('DDB_TABLE_NAME')

    ddb_table.put_item(
        Item={
            'name': 'redirect-by-country',
            'type': 'test type 1',
            'desc': 'test desc 1',
            'status': 'enabled',
            'updateDate': '2022–08–29T08:00:00Z'
        }
    )
    ddb_table.put_item(
        Item={
            'name': 'true-client-ip',
            'type': 'test type 2',
            'desc': 'test desc 2',
            'status': 'enabled',
            'updateDate': '2022–08–29T08:00:00Z'
        }
    )
    ddb_table.put_item(
        Item={
            'name': 'image-resize',
            'type': 'test type 3',
            'desc': 'test desc 3',
            'status': 'disabled',
            'updateDate': '2022–08–29T08:00:00Z'
        }
    )
    ddb_table.put_item(
        Item={
            'name': 'redirect-by-device',
            'type': 'test type 2',
            'desc': 'test desc 2',
            'status': 'enabled',
            'updateDate': '2022–10–21T08:00:00Z'
        }
    )
    ddb_table.put_item(
        Item={
            'name': 'prewarm',
            'type': 'test type 3',
            'desc': 'test desc 3',
            'status': 'disabled',
            'updateDate': '2022–09–01T07:00:00Z'
        }
    )
    import deployer
    deployer.ext_metadata = MagicMock(return_value=metadata)
    result = deployer.check_sync_status_impl('test_url')

    assert result == 'false'


@mock_dynamodb
@mock_cloudformation
def test_deploy_ext(monkeypatch):
    mock_stack_response = {'StackId': 'teststackid'}

    monkeypatch.setenv('DDB_TABLE_NAME',
                       'DDB_TABLE_NAME', prepend=False)
    monkeypatch.setenv('AWS_REGION', 'us-east-1', prepend=False)
    monkeypatch.setenv('EXT_META_DATA_URL', 'test_url', prepend=False)

    from deployer import deploy_ext_impl

    ext_name = 'image-resize'
    cfn_client = boto3.client('cloudformation', region_name='us-east-1')
    monkeypatch.setattr(cfn_client, "create_stack", mock_stack_response)

    ddb = boto3.resource(service_name="dynamodb", region_name="us-east-1")
    ddb.create_table(
        TableName='DDB_TABLE_NAME',
        AttributeDefinitions=[
            {
                'AttributeName': 'name',
                'AttributeType': 'S'
            }
        ],
        KeySchema=[
            {
                'AttributeName': 'name',
                'KeyType': 'HASH'
            }
        ],
        BillingMode='PAY_PER_REQUEST'
    )
    ddb_table = ddb.Table('DDB_TABLE_NAME')

    ddb_table.put_item(
        Item={
            'name': 'redirect-by-country',
            'type': 'test type 1',
            'desc': 'test desc 1',
            'status': 'enabled',
            'templateUri': 'https://redirect-by-country/template.url',
            'updateDate': '2022–08–29T08:00:00Z'
        }
    )
    ddb_table.put_item(
        Item={
            'name': 'true-client-ip',
            'type': 'test type 2',
            'desc': 'test desc 2',
            'status': 'enabled',
            'templateUri': 'https://true-client-ip/template.url',
            'updateDate': '2022–08–29T08:00:00Z'
        }
    )
    ddb_table.put_item(
        Item={
            'name': 'image-resize',
            'type': 'test type 3',
            'desc': 'test desc 3',
            'status': 'disabled',
            'templateUri': 'https://image-resize/template.url',
            'updateDate': '2022–08–29T08:00:00Z'
        }
    )
    ddb_table.put_item(
        Item={
            'name': 'redirect-by-device',
            'type': 'test type 2',
            'desc': 'test desc 2',
            'status': 'enabled',
            'templateUri': 'https://redirect-by-device/template.url',
            'updateDate': '2022–10–21T08:00:00Z'
        }
    )
    ddb_table.put_item(
        Item={
            'name': 'prewarm',
            'type': 'test type 3',
            'desc': 'test desc 3',
            'status': 'disabled',
            'templateUri': 'https://prewarm/template.url',
            'updateDate': '2022–09–01T07:00:00Z'
        }
    )

    para = [{
            'parameterKey': 'cfDistId',
            'parameterValue': '12312312'
            },
            {
            'parameterKey': 'behavior',
            'parameterValue': 'Default (*)'
            },
            {
            'parameterKey': 'stage',
            'parameterValue': 'origin-response'
            },
            {
            'parameterKey': 'FitType',
            'parameterValue': 'fill'
            },
            {
            'parameterKey': 'S3BucketName',
            'parameterValue': 'test'
            }]
    
    cfn_client.create_stack = MagicMock(return_value=mock_stack_response)
    result = deploy_ext_impl(cfn_client, ext_name, para)
    assert result == 'teststackid'


# @mock_dynamodb
# def test_sync_extensions(monkeypatch):
#     metadata_url = 'https://aws-cloudfront-ext-metadata.s3.amazonaws.com/metadata.csv'
#     monkeypatch.setenv('DDB_TABLE_NAME',
#                        'DDB_TABLE_NAME', prepend=False)
#     monkeypatch.setenv('AWS_REGION', 'us-east-1', prepend=False)
#     monkeypatch.setenv('EXT_META_DATA_URL', metadata_url, prepend=False)

#     from common.ext_repo import sync_ext


#     ddb = boto3.resource(service_name="dynamodb", region_name="us-east-1")
#     ddb.create_table(
#         TableName='DDB_TABLE_NAME',
#         AttributeDefinitions=[
#             {
#                 'AttributeName': 'name',
#                 'AttributeType': 'S'
#             }
#             # {
#             #     'AttributeName': 'templateUri',
#             #     'AttributeType': 'S'
#             # },
#             # {
#             #     'AttributeName': 'type',
#             #     'AttributeType': 'S'
#             # }
#         ],
#         KeySchema=[
#             {
#                 'AttributeName': 'name',
#                 'KeyType': 'HASH'
#             }
#             # {
#             #     'AttributeName': 'templateUri',
#             #     'KeyType': 'HASH'
#             # },
#             # {
#             #     'AttributeName': 'type',
#             #     'KeyType': 'HASH'
#             # }
#         ],
#         BillingMode='PAY_PER_REQUEST'
#     )
#     ddb_table = ddb.Table('DDB_TABLE_NAME')

#     result = sync_ext(metadata_url, ddb_table)
#     print(result)
