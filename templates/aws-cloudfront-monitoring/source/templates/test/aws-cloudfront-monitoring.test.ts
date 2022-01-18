import '@aws-cdk/assert/jest';
import * as cdk from '@aws-cdk/core';
import {CloudFrontMonitoringStack} from '../lib/aws-cloudfront-monitoring-stack';

test('Stack contains S3 bucket', () => {
    const app = new cdk.App();
    const stack = new CloudFrontMonitoringStack(app, 'MyMonitoringTestStack');

    expect(stack).toHaveResourceLike('AWS::S3::Bucket', {
        "AccessControl": "LogDeliveryWrite",
        "BucketEncryption": {
            "ServerSideEncryptionConfiguration": [
                {
                    "ServerSideEncryptionByDefault": {
                        "SSEAlgorithm": "AES256"
                    }
                }
            ]
        },
        "LoggingConfiguration": {
            "LogFilePrefix": {
                "Fn::Join": [
                    "",
                    [
                        "accessLogBucketAccessLog-",
                        {
                            "Ref": "deployStage"
                        }
                    ]
                ]
            }
        },
        "Tags": [
            {
                "Key": "stage",
                "Value": {
                    "Ref": "deployStage"
                }
            }
        ]
    });

    expect(stack).toHaveResourceLike('AWS::S3::Bucket', {
        "BucketEncryption": {
            "ServerSideEncryptionConfiguration": [
                {
                    "ServerSideEncryptionByDefault": {
                        "SSEAlgorithm": "AES256"
                    }
                }
            ]
        },
        "LifecycleConfiguration": {
            "Rules": [
                {
                    "ExpirationInDays": {
                        "Ref": "CloudFrontLogKeepDays"
                    },
                    "Status": "Enabled"
                }
            ]
        }
    });
    expect(stack).toHaveResource("AWS::S3::BucketPolicy")
    expect(stack).toCountResources("AWS::S3::Bucket", 2)
    expect(stack).toHaveResource("Custom::S3AutoDeleteObjects")
});

test('Stack contains IAM Role', () => {
    const app = new cdk.App();
    const stack = new CloudFrontMonitoringStack(app, 'MyMonitoringTestStack');
    expect(stack).toHaveResource("AWS::IAM::Role")
    expect(stack).toCountResources("AWS::IAM::Role", 6)
    expect(stack).toHaveResourceLike("AWS::IAM::Policy", {
        "PolicyDocument": {
            "Statement": [
                {
                    "Action": [
                        "logs:PutRetentionPolicy",
                        "logs:DeleteRetentionPolicy"
                    ],
                    "Effect": "Allow",
                    "Resource": "*"
                }
            ],
            "Version": "2012-10-17"
        },
    })
});

test('Stack contains Lambda', () => {
    const app = new cdk.App();
    const stack = new CloudFrontMonitoringStack(app, 'MyMonitoringTestStack');
    expect(stack).toHaveResource("AWS::Lambda::Function")
    expect(stack).toHaveResource("AWS::Lambda::LayerVersion")
    expect(stack).toCountResources("AWS::Lambda::Function", 16)
    expect(stack).toHaveResource("Custom::LogRetention")
});

test('Stack contains DynamoDB', () => {
    const app = new cdk.App();
    const stack = new CloudFrontMonitoringStack(app, 'MyMonitoringTestStack');
    expect(stack).toHaveResourceLike("AWS::DynamoDB::Table", {
        "KeySchema": [
            {
                "AttributeName": "metricId",
                "KeyType": "HASH"
            },
            {
                "AttributeName": "timestamp",
                "KeyType": "RANGE"
            }
        ],
        "AttributeDefinitions": [
            {
                "AttributeName": "metricId",
                "AttributeType": "S"
            },
            {
                "AttributeName": "timestamp",
                "AttributeType": "S"
            }
        ],
        "PointInTimeRecoverySpecification": {
            "PointInTimeRecoveryEnabled": true
        },
        "ProvisionedThroughput": {
            "ReadCapacityUnits": 10,
            "WriteCapacityUnits": 10
        },
    })
    expect(stack).toHaveResourceLike("AWS::ApplicationAutoScaling::ScalableTarget", {
        "MaxCapacity": 10,
        "MinCapacity": 1,
    })
    expect(stack).toHaveResourceLike("AWS::ApplicationAutoScaling::ScalingPolicy", {
        "TargetTrackingScalingPolicyConfiguration": {
            "PredefinedMetricSpecification": {
                "PredefinedMetricType": "DynamoDBReadCapacityUtilization"
            },
            "TargetValue": 75
        }
    })
});

test('Stack contains Glue table', () => {
    const app = new cdk.App();
    const stack = new CloudFrontMonitoringStack(app, 'MyMonitoringTestStack');
    expect(stack).toHaveResourceLike("AWS::Glue::Database", {
        "CatalogId": {
            "Ref": "AWS::AccountId"
        },
        "DatabaseInput": {
            "Name": "glue_cf_realtime_log_database"
        }
    })
    expect(stack).toHaveResourceLike("AWS::Glue::Table", {
        "CatalogId": {
            "Ref": "AWS::AccountId"
        },
        "TableInput": {
            "Name": "cloudfront_realtime_log",
            "Parameters": {
                "external": "TRUE",
                "skip.header.line.count": "2"
            },
            "PartitionKeys": [
                {
                    "Name": "year",
                    "Type": "int"
                },
                {
                    "Name": "month",
                    "Type": "int"
                },
                {
                    "Name": "day",
                    "Type": "int"
                },
                {
                    "Name": "hour",
                    "Type": "int"
                },
                {
                    "Name": "minute",
                    "Type": "int"
                }
            ],
            "Retention": 0,
            "StorageDescriptor": {
                "Columns": [
                    {
                        "Name": "timestamp",
                        "Type": "bigint"
                    },
                    {
                        "Name": "c-ip",
                        "Type": "string"
                    },
                    {
                        "Name": "time-to-first-byte",
                        "Type": "float"
                    },
                    {
                        "Name": "sc-status",
                        "Type": "int"
                    },
                    {
                        "Name": "sc-bytes",
                        "Type": "int"
                    },
                    {
                        "Name": "cs-method",
                        "Type": "string"
                    },
                    {
                        "Name": "cs-protocol",
                        "Type": "string"
                    },
                    {
                        "Name": "cs-host",
                        "Type": "string"
                    },
                    {
                        "Name": "cs-uri-stem",
                        "Type": "string"
                    },
                    {
                        "Name": "cs-bytes",
                        "Type": "int"
                    },
                    {
                        "Name": "x-edge-location",
                        "Type": "string"
                    },
                    {
                        "Name": "x-edge-request-id",
                        "Type": "string"
                    },
                    {
                        "Name": "x-host-header",
                        "Type": "string"
                    },
                    {
                        "Name": "time-taken",
                        "Type": "float"
                    },
                    {
                        "Name": "cs-protocol-version",
                        "Type": "string"
                    },
                    {
                        "Name": "c-ip-version",
                        "Type": "string"
                    },
                    {
                        "Name": "cs-user-agent",
                        "Type": "string"
                    },
                    {
                        "Name": "cs-referer",
                        "Type": "string"
                    },
                    {
                        "Name": "cs-cookie",
                        "Type": "string"
                    },
                    {
                        "Name": "cs-uri-query",
                        "Type": "string"
                    },
                    {
                        "Name": "x-edge-response-result-type",
                        "Type": "string"
                    },
                    {
                        "Name": "x-forwarded-for",
                        "Type": "string"
                    },
                    {
                        "Name": "ssl-protocol",
                        "Type": "string"
                    },
                    {
                        "Name": "ssl-cipher",
                        "Type": "string"
                    },
                    {
                        "Name": "x-edge-result-type",
                        "Type": "string"
                    },
                    {
                        "Name": "fle-encrypted-fields",
                        "Type": "string"
                    },
                    {
                        "Name": "fle-status",
                        "Type": "string"
                    },
                    {
                        "Name": "sc-content-type",
                        "Type": "string"
                    },
                    {
                        "Name": "sc-content-len",
                        "Type": "int"
                    },
                    {
                        "Name": "sc-range-start",
                        "Type": "int"
                    },
                    {
                        "Name": "sc-range-end",
                        "Type": "int"
                    },
                    {
                        "Name": "c-port",
                        "Type": "int"
                    },
                    {
                        "Name": "x-edge-detailed-result-type",
                        "Type": "string"
                    },
                    {
                        "Name": "c-country",
                        "Type": "string"
                    },
                    {
                        "Name": "cs-accept-encoding",
                        "Type": "string"
                    },
                    {
                        "Name": "cs-accept",
                        "Type": "string"
                    },
                    {
                        "Name": "cache-behavior-path-pattern",
                        "Type": "string"
                    },
                    {
                        "Name": "cs-headers",
                        "Type": "string"
                    },
                    {
                        "Name": "cs-header-names",
                        "Type": "string"
                    },
                    {
                        "Name": "cs-headers-count",
                        "Type": "int"
                    },
                    {
                        "Name": "isp",
                        "Type": "string"
                    },
                    {
                        "Name": "country-name",
                        "Type": "string"
                    }
                ],
                "Compressed": false,
                "InputFormat": "org.apache.hadoop.mapred.TextInputFormat",
                "NumberOfBuckets": -1,
                "OutputFormat": "org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat",
                "Parameters": {},
                "SerdeInfo": {
                    "Parameters": {
                        "field.delim": "\t",
                        "serialization.format": "\t"
                    },
                    "SerializationLibrary": "org.apache.hadoop.hive.serde2.lazy.LazySimpleSerDe"
                },
                "SkewedInfo": {
                    "SkewedColumnValueLocationMaps": {}
                },
                "StoredAsSubDirectories": false
            },
            "TableType": "EXTERNAL_TABLE"
        }
    })
})

test('Stack contains ApiGateway', () => {
    const app = new cdk.App();
    const stack = new CloudFrontMonitoringStack(app, 'MyMonitoringTestStack');
    expect(stack).toHaveResourceLike("AWS::ApiGateway::RestApi", {
        "Description": "restful api to get the cloudfront performance data",
        "EndpointConfiguration": {
            "Types": [
                "EDGE"
            ]
        },
        "Name": "CloudfrontPerformanceMetrics",
        "Tags": [
            {
                "Key": "stage",
                "Value": {
                    "Ref": "deployStage"
                }
            }
        ]
    })
    expect(stack).toHaveResource("AWS::ApiGateway::Deployment")

    expect(stack).toHaveResource("AWS::ApiGateway::Stage")
    expect(stack).toHaveResource("AWS::ApiGateway::Resource")
    expect(stack).toHaveResourceLike("AWS::ApiGateway::Method", {
        "HttpMethod": "GET",
        "AuthorizationScopes": [
            "cloudfront-metrics-api/getMetrics"
        ],
        "AuthorizationType": "COGNITO_USER_POOLS",
        "RequestParameters": {
            "method.request.querystring.Action": false,
            "method.request.querystring.Domains": false,
            "method.request.querystring.StartTime": true,
            "method.request.querystring.EndTime": true,
            "method.request.querystring.Metric": true,
            "method.request.querystring.Project": false
        },
    })
    expect(stack).toHaveResourceLike("AWS::ApiGateway::Authorizer", {
        "Type": "COGNITO_USER_POOLS",
        "IdentitySource": "method.request.header.Authorization",
        "Name": "Metric-Cognito-Authorizer",
    })
    expect(stack).toHaveResourceLike("AWS::ApiGateway::RequestValidator", {
        "Name": "defaultValidator",
        "ValidateRequestBody": false,
        "ValidateRequestParameters": true
    })
});

test('Stack contains Cognito UserPool', () => {
    const app = new cdk.App();
    const stack = new CloudFrontMonitoringStack(app, 'MyMonitoringTestStack');
    expect(stack).toHaveResourceLike("AWS::Cognito::UserPool", {
        "AccountRecoverySetting": {
            "RecoveryMechanisms": [
                {
                    "Name": "verified_email",
                    "Priority": 1
                }
            ]
        },
        "AdminCreateUserConfig": {
            "AllowAdminCreateUserOnly": false
        },
        "AutoVerifiedAttributes": [
            "email"
        ],
        "EmailVerificationMessage": "The verification code to your new account is {####}",
        "EmailVerificationSubject": "Verify your new account",
        "SmsVerificationMessage": "The verification code to your new account is {####}",
        "UsernameAttributes": [
            "email"
        ],
        "VerificationMessageTemplate": {
            "DefaultEmailOption": "CONFIRM_WITH_CODE",
            "EmailMessage": "The verification code to your new account is {####}",
            "EmailSubject": "Verify your new account",
            "SmsMessage": "The verification code to your new account is {####}"
        }
    })
    expect(stack).toHaveResourceLike("AWS::Cognito::UserPoolClient", {
        "AllowedOAuthFlows": [
            "client_credentials"
        ],
        "AllowedOAuthFlowsUserPoolClient": true,
        "ClientName": "cloudfront-log-metrics-client",
        "GenerateSecret": true,
        "SupportedIdentityProviders": [
            "COGNITO"
        ]
    })

    expect(stack).toHaveResourceLike("AWS::Cognito::UserPoolDomain")

    expect(stack).toHaveResourceLike("AWS::Cognito::UserPoolResourceServer", {
        "Identifier": "cloudfront-metrics-api",
        "Name": "cloudfront-metrics-api",
    })

});

test('Stack contains KinesisFirehose', () => {
    const app = new cdk.App();
    const stack = new CloudFrontMonitoringStack(app, 'MyMonitoringTestStack');
    expect(stack).toHaveResourceLike("AWS::KinesisFirehose::DeliveryStream", {
        "DeliveryStreamType": "KinesisStreamAsSource",
        "ExtendedS3DestinationConfiguration": {
            "BufferingHints": {
                "IntervalInSeconds": 60,
                "SizeInMBs": 128
            },
            "DataFormatConversionConfiguration": {
                "Enabled": false
            },
            "DynamicPartitioningConfiguration": {
                "Enabled": true,
                "RetryOptions": {
                    "DurationInSeconds": 20
                }
            },
            "EncryptionConfiguration": {
                "NoEncryptionConfig": "NoEncryption"
            },
            "ErrorOutputPrefix": "failed/",
            "Prefix": "year=!{partitionKeyFromLambda:year}/month=!{partitionKeyFromLambda:month}/day=!{partitionKeyFromLambda:day}/hour=!{partitionKeyFromLambda:hour}/minute=!{partitionKeyFromLambda:minute}/domain=!{partitionKeyFromLambda:domain}/",
        },
    })
});

test('Stack contains eventBridge', () => {
    const app = new cdk.App();
    const stack = new CloudFrontMonitoringStack(app, 'MyMonitoringTestStack');
    expect(stack).toHaveResourceLike("AWS::Events::Rule", {
        "ScheduleExpression": "cron(0/5 * * * ? *)",
        "State": "ENABLED",
    })
    expect(stack).toHaveResourceLike("AWS::Events::Rule", {
        "ScheduleExpression": "cron(0 22 * * ? *)",
        "State": "ENABLED",
    })
    expect(stack).toCountResources("AWS::Events::Rule", 4)
});