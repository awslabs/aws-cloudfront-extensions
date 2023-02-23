import pytest


@pytest.mark.skip(reason="dev only")
def create_job_info_table(ddb, table_name: str):
    ddb.create_table(
        TableName=table_name,
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


@pytest.mark.skip(reason="dev only")
def create_acm_metadata_table(ddb, table_name: str):
    ddb.create_table(
        TableName=table_name,
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


@pytest.mark.skip(reason="dev only")
def create_config_version_table(ddb, table_name: str):
    ddb.create_table(
        TableName=table_name,
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


sample_cloudfront_config = {
    "ETag": "E2VAU5L5I1SDRU",
    "DistributionConfig": {
        "CallerReference": "bd8fd78e-390a-4a11-b5e3-4e71bc6a14e1",
        "Aliases": {
            "Quantity": 0
        },
        "DefaultRootObject": "",
        "Origins": {
            "Quantity": 1,
            "Items": [
                {
                    "Id": "cloudfrontextnconsolesta-cloudfrontconfigversionc-152y5mcxm4aj9.s3.us-west-1.amazonaws.com",
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
            "TargetOriginId": "cloudfrontextnconsolesta-cloudfrontconfigversionc-152y5mcxm4aj9.s3.us-west-1.amazonaws.com",
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
            "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6"
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
            "CloudFrontDefaultCertificate": True,
            "SSLSupportMethod": "vip",
            "MinimumProtocolVersion": "TLSv1",
            "CertificateSource": "cloudfront"
        },
        "Restrictions": {
            "GeoRestriction": {
                "RestrictionType": "blacklist",
                "Quantity": 2,
                "Items": [
                    "AO",
                    "AL"
                ]
            }
        },
        "WebACLId": "",
        "HttpVersion": "http2",
        "IsIPV6Enabled": True
    }
}