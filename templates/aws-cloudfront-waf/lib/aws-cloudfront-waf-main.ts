import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as s3 from '@aws-cdk/aws-s3';
import * as iam from '@aws-cdk/aws-iam';
import * as path from 'path';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as firehose from '@aws-cdk/aws-kinesisfirehose';
import * as glue from '@aws-cdk/aws-glue';
import * as athena from '@aws-cdk/aws-athena';
import * as wafv2 from '@aws-cdk/aws-wafv2';
import * as cloudwatch from '@aws-cdk/aws-cloudwatch';
import * as events from '@aws-cdk/aws-events';
import * as targets from '@aws-cdk/aws-events-targets';
import * as s3n from '@aws-cdk/aws-s3-notifications';
import * as cr from '@aws-cdk/custom-resources';
import { CustomResource } from '@aws-cdk/core';

export class AwsCloudfrontWafStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: cdk.StackProps = {}) {
    super(scope, id, props);

    this.templateOptions.description = `(SO8128) - WAF & Shield deployment. Template version v1.0`;

    const cloudWatchDashboardName = 'WAFMonitoringDashboard-us-east-1';
    const reputationListName = cdk.Fn.ref("AWS::StackName") + 'IPReputationListsRule';
    const allowListName = cdk.Fn.ref("AWS::StackName") + 'WhitelistRule';
    const blacklistRuleName = cdk.Fn.ref("AWS::StackName") + 'BlacklistRule';
    const httpFloodRegularRuleName = cdk.Fn.ref("AWS::StackName") + 'HttpFloodRegularRule';
    const scannersProbesRuleName = cdk.Fn.ref("AWS::StackName") + 'ScannersProbesRule';
    const badBotRuleName = cdk.Fn.ref("AWS::StackName") + 'BadBotRule';
    const sqlInjectionRuleName = cdk.Fn.ref("AWS::StackName") + 'SqlInjectionRule';
    const xssRuleName = cdk.Fn.ref("AWS::StackName") + 'XssRule';

    const logLevel = 'INFO';

    const appAccessLogBucketName = new cdk.CfnParameter(this, "appAccessLogBucket", {
      default: 'access-log-bucket-cloudfront',
      description: "The name for the Amazon S3 bucket where you want to store Cloud Front access logs for your CloudFront distribution. More about bucket name restriction here: http://amzn.to/1p1YlU5."
    });

    const wafLogBucketName = new cdk.CfnParameter(this, "wafLogBucketName", {
      default: 'waf-log-bucket-cloudfront',
      description: "The name for the Amazon S3 bucket where you want to store WAF access Cloud Front logs. More about bucket name restriction here: http://amzn.to/1p1YlU5."
    });

    const errorThreshold = new cdk.CfnParameter(this, "errorThreshold", {
      default: 50,
      description: "The maximum acceptable bad requests per minute per IP. "
    });

    const requestThreshold = new cdk.CfnParameter(this, "requestThreshold", {
      default: 100,
      description: "The maximum acceptable requests per FIVE-minute period per IP address."
    });

    const blockPeriod = new cdk.CfnParameter(this, "WAFBlockPeriod", {
      default: 240,
      description: "The period (in minutes) to block applicable IP addresses."
    });

    const waf2Scope = new cdk.CfnParameter(this, "WAFScope", {
      default: 'CLOUDFRONT',
      type: 'String',
      description: "Specifies whether this is for an AWS CloudFront distribution or for a regional application. A regional application can be an Application Load Balancer (ALB), an Amazon API Gateway REST API, or an AWS AppSync GraphQL API. Valid Values are CLOUDFRONT and REGIONAL. For CLOUDFRONT, you must create your WAFv2 resources in the US East (N. Virginia) Region, us-east-1."
    });

    //WafLogBucket
    const wafLogBucket = new s3.Bucket(this, "WafLogBucket", {
      bucketName: wafLogBucketName.valueAsString,
      publicReadAccess: false,
      encryption: s3.BucketEncryption.KMS_MANAGED
    });

    const accessLogBucket = new s3.Bucket(this, "AccessLogBucket", {
      bucketName: appAccessLogBucketName.valueAsString,
      publicReadAccess: false,
      encryption: s3.BucketEncryption.KMS_MANAGED
    });

    // Setup Whitelist IP Set
    const whitelistIpSetV4 = new wafv2.CfnIPSet(this, 'WhitelistSetIPV4', {
      addresses: [],
      ipAddressVersion: 'IPV4',
      scope: waf2Scope.valueAsString,
      name: cdk.Fn.ref("AWS::StackName") + 'WhitelistSetIPV4',
      description: 'Allow whitelist for IPV4 addresses',
    });

    const whitelistIpSetV6 = new wafv2.CfnIPSet(this, 'WhitelistSetIPV6', {
      addresses: [],
      ipAddressVersion: 'IPV6',
      scope: waf2Scope.valueAsString,
      name: cdk.Fn.ref("AWS::StackName") + 'WhitelistSetIPV6',
      description: 'Allow whitelist for IPV6 addresses',
    });

    // Setup Blacklist IP Set
    const blacklistIpSetV4 = new wafv2.CfnIPSet(this, 'BlacklistSetIPV4', {
      addresses: [],
      ipAddressVersion: 'IPV4',
      scope: waf2Scope.valueAsString,
      name: cdk.Fn.ref("AWS::StackName") + 'BlacklistSetIPV4',
      description: 'Allow blacklist for IPV4 addresses',
    });

    const blacklistIpSetV6 = new wafv2.CfnIPSet(this, 'BlacklistSetIPV6', {
      addresses: [],
      ipAddressVersion: 'IPV6',
      scope: waf2Scope.valueAsString,
      name: cdk.Fn.ref("AWS::StackName") + 'BlacklistSetIPV6',
      description: 'Allow blacklist for IPV6 addresses',
    });

    // Setup HTTP Flood IP Set
    const httpFloodIpSetV4 = new wafv2.CfnIPSet(this, 'HTTPFloodSetIPV4', {
      addresses: [],
      ipAddressVersion: 'IPV4',
      scope: waf2Scope.valueAsString,
      name: cdk.Fn.ref("AWS::StackName") + 'HTTPFloodSetIPV4',
      description: 'Block HTTP Flood IPV4 addresses',
    });

    const httpFloodIpSetV6 = new wafv2.CfnIPSet(this, 'HTTPFloodSetIPV6', {
      addresses: [],
      ipAddressVersion: 'IPV6',
      scope: waf2Scope.valueAsString,
      name: cdk.Fn.ref("AWS::StackName") + 'HTTPFloodSetIPV6',
      description: 'Block HTTP Flood IPV6 addresses',
    });

    // Block Scanners/Probes IP Set
    const scannersProbesIpSetV4 = new wafv2.CfnIPSet(this, 'ScannersProbesSetIPV4', {
      addresses: [],
      ipAddressVersion: 'IPV4',
      scope: waf2Scope.valueAsString,
      name: cdk.Fn.ref("AWS::StackName") + 'ScannersProbesSetIPV4',
      description: 'Block Scanners/Probes IPV4 addresses',
    });

    const scannersProbesIpSetV6 = new wafv2.CfnIPSet(this, 'ScannersProbesSetIPV6', {
      addresses: [],
      ipAddressVersion: 'IPV6',
      scope: waf2Scope.valueAsString,
      name: cdk.Fn.ref("AWS::StackName") + 'ScannersProbesSetIPV6',
      description: 'Block Scanners/Probes IPV6 addresses',
    });

    // Block Reputation List IP Set
    const reputationListsIpSetV4 = new wafv2.CfnIPSet(this, 'IPReputationListsSetIPV4', {
      addresses: [],
      ipAddressVersion: 'IPV4',
      scope: waf2Scope.valueAsString,
      name: cdk.Fn.ref("AWS::StackName") + 'IPReputationListsSetIPV4',
      description: 'Block Reputation List IPV4 addresses',
    });

    const reputationListsIpSetV6 = new wafv2.CfnIPSet(this, 'IPReputationListsSetIPV6', {
      addresses: [],
      ipAddressVersion: 'IPV6',
      scope: waf2Scope.valueAsString,
      name: cdk.Fn.ref("AWS::StackName") + 'IPReputationListsSetIPV6',
      description: 'Block Reputation List IPV6 addresses',
    });

    // Block Bad Bot IP Set
    const badBotIpSetV4 = new wafv2.CfnIPSet(this, 'IPBadBotSetIPV4', {
      addresses: [],
      ipAddressVersion: 'IPV4',
      scope: waf2Scope.valueAsString,
      name: cdk.Fn.ref("AWS::StackName") + 'IPBadBotSetIPV4',
      description: 'Block Bad Bot IPV4 addresses',
    });

    const badBotIpSetV6 = new wafv2.CfnIPSet(this, 'IPBadBotSetIPV6', {
      addresses: [],
      ipAddressVersion: 'IPV6',
      scope: waf2Scope.valueAsString,
      name: cdk.Fn.ref("AWS::StackName") + 'IPBadBotSetIPV6',
      description: 'Block Bad Bot IPV6 addresses',
    });

    // WAF Web ACL
    const wafweb = new wafv2.CfnWebACL(this, 'wafweb', {
      name: 'CloudFront-Web-WAF',
      description: 'Custom WAFWebACL',
      defaultAction: {
        allow: {},
      },
      scope: waf2Scope.valueAsString,
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        sampledRequestsEnabled: true,
        metricName: 'CloudFront-Web-WAF',
      },
      rules: [
        {
          name: 'AWS-AWSManagedRulesCommonRuleSet',
          priority: 0,
          overrideAction: {
            none: {},
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            sampledRequestsEnabled: true,
            metricName: 'cloudfront-waf-ipset-metrics',
          },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
            },
          },
        },
        {
          name: allowListName,
          priority: 1,
          action: {
            allow: {},
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: allowListName,
          },
          statement: {
            orStatement: {
              statements: [
                {
                  ipSetReferenceStatement: {
                    arn: cdk.Fn.getAtt(whitelistIpSetV4.logicalId, 'Arn').toString(),
                  },
                },
                {
                  ipSetReferenceStatement: {
                    arn: cdk.Fn.getAtt(whitelistIpSetV6.logicalId, 'Arn').toString(),
                  },
                },
              ],
            },
          },
        },
        {
          name: blacklistRuleName,
          priority: 2,
          action: {
            block: {},
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: blacklistRuleName,
          },
          statement: {
            orStatement: {
              statements: [
                {
                  ipSetReferenceStatement: {
                    arn: cdk.Fn.getAtt(blacklistIpSetV4.logicalId, 'Arn').toString(),
                  },
                },
                {
                  ipSetReferenceStatement: {
                    arn: cdk.Fn.getAtt(blacklistIpSetV6.logicalId, 'Arn').toString(),
                  },
                },
              ],
            },
          },
        },
        {
          name: httpFloodRegularRuleName,
          priority: 3,
          action: {
            block: {},
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: httpFloodRegularRuleName,
          },
          statement: {
            orStatement: {
              statements: [
                {
                  ipSetReferenceStatement: {
                    arn: cdk.Fn.getAtt(httpFloodIpSetV4.logicalId, 'Arn').toString(),
                  },
                },
                {
                  ipSetReferenceStatement: {
                    arn: cdk.Fn.getAtt(httpFloodIpSetV6.logicalId, 'Arn').toString(),
                  },
                },
              ],
            },
          },
        },
        {
          name: scannersProbesRuleName,
          priority: 5,
          action: {
            block: {}
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: scannersProbesRuleName,
          },
          statement: {
            orStatement: {
              statements: [
                {
                  ipSetReferenceStatement: {
                    arn: cdk.Fn.getAtt(scannersProbesIpSetV4.logicalId, 'Arn').toString(),
                  }
                },
                {
                  ipSetReferenceStatement: {
                    arn: cdk.Fn.getAtt(scannersProbesIpSetV6.logicalId, 'Arn').toString(),
                  }
                }
              ]
            }
          }
        },
        {
          name: reputationListName,
          priority: 6,
          action: {
            block: {},
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: reputationListName,
          },
          statement: {
            orStatement: {
              statements: [
                {
                  ipSetReferenceStatement: {
                    arn: cdk.Fn.getAtt(reputationListsIpSetV4.logicalId, 'Arn').toString(),
                  },
                },
                {
                  ipSetReferenceStatement: {
                    arn: cdk.Fn.getAtt(reputationListsIpSetV6.logicalId, 'Arn').toString(),
                  },
                },
              ],
            },
          },
        },
        {
          name: badBotRuleName,
          priority: 7,
          action: {
            block: {},
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: badBotRuleName,
          },
          statement: {
            orStatement: {
              statements: [
                {
                  ipSetReferenceStatement: {
                    arn: cdk.Fn.getAtt(badBotIpSetV4.logicalId, 'Arn').toString(),
                  },
                },
                {
                  ipSetReferenceStatement: {
                    arn: cdk.Fn.getAtt(badBotIpSetV6.logicalId, 'Arn').toString(),
                  },
                },
              ],
            },
          },
        },
        {
          name: sqlInjectionRuleName,
          priority: 20,
          action: {
            block: {},
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: sqlInjectionRuleName,
          },
          statement: {
            orStatement: {
              statements: [
                {
                  sqliMatchStatement: {
                    fieldToMatch: {
                      queryString: {},
                    },
                    textTransformations: [
                      {
                        priority: 1,
                        type: 'URL_DECODE',
                      },
                      {
                        priority: 2,
                        type: 'HTML_ENTITY_DECODE',
                      },
                    ],
                  },
                },
                {
                  sqliMatchStatement: {
                    fieldToMatch: {
                      body: {},
                    },
                    textTransformations: [
                      {
                        priority: 1,
                        type: 'URL_DECODE',
                      },
                      {
                        priority: 2,
                        type: 'HTML_ENTITY_DECODE',
                      },
                    ],
                  },
                },
                {
                  sqliMatchStatement: {
                    fieldToMatch: {
                      uriPath: {},
                    },
                    textTransformations: [
                      {
                        priority: 1,
                        type: 'URL_DECODE',
                      },
                      {
                        priority: 2,
                        type: 'HTML_ENTITY_DECODE',
                      },
                    ],
                  },
                },
                {
                  sqliMatchStatement: {
                    fieldToMatch: {
                      singleHeader: { Name: 'Authorization' },
                    },
                    textTransformations: [
                      {
                        priority: 1,
                        type: 'URL_DECODE',
                      },
                      {
                        priority: 2,
                        type: 'HTML_ENTITY_DECODE',
                      },
                    ],
                  },
                },
                {
                  sqliMatchStatement: {
                    fieldToMatch: {
                      singleHeader: { Name: 'Cookie' },
                    },
                    textTransformations: [
                      {
                        priority: 1,
                        type: 'URL_DECODE',
                      },
                      {
                        priority: 2,
                        type: 'HTML_ENTITY_DECODE',
                      },
                    ],
                  },
                },
              ],
            },
          },
        },
        {
          name: xssRuleName,
          priority: 30,
          action: {
            block: {},
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: xssRuleName,
          },
          statement: {
            orStatement: {
              statements: [
                {
                  xssMatchStatement: {
                    fieldToMatch: {
                      queryString: {},
                    },
                    textTransformations: [
                      {
                        priority: 1,
                        type: 'URL_DECODE',
                      },
                      {
                        priority: 2,
                        type: 'HTML_ENTITY_DECODE',
                      },
                    ],
                  },
                },
                {
                  xssMatchStatement: {
                    fieldToMatch: {
                      body: {},
                    },
                    textTransformations: [
                      {
                        priority: 1,
                        type: 'URL_DECODE',
                      },
                      {
                        priority: 2,
                        type: 'HTML_ENTITY_DECODE',
                      },
                    ],
                  },
                },
                {
                  xssMatchStatement: {
                    fieldToMatch: {
                      uriPath: {},
                    },
                    textTransformations: [
                      {
                        priority: 1,
                        type: 'URL_DECODE',
                      },
                      {
                        priority: 2,
                        type: 'HTML_ENTITY_DECODE',
                      },
                    ],
                  },
                },
                {
                  xssMatchStatement: {
                    fieldToMatch: {
                      singleHeader: {
                        name: 'Cookie',
                      },
                    },
                    textTransformations: [
                      {
                        priority: 1,
                        type: 'URL_DECODE',
                      },
                      {
                        priority: 2,
                        type: 'HTML_ENTITY_DECODE',
                      },
                    ],
                  },
                },
              ],
            },
          },
        },
      ],
    });

    //Lambda
    const helperLambda = new lambda.Function(this, "Helper", {
      description: "This lambda function verifies the main project's dependencies, requirements and implement auxiliary functions.",
      runtime: lambda.Runtime.PYTHON_3_8,
      code: lambda.Code.fromAsset(path.join(__dirname, './lambda-assets/helper.zip')),
      handler: "helper.lambda_handler",
      memorySize: 512,
      timeout: cdk.Duration.seconds(300),
      environment: {
        "LOG_LEVEL": logLevel,
        "SCOPE": waf2Scope.valueAsString
      }
    });

    const logParserLambda = new lambda.Function(this, "LogParser", {
      description: "This function parses access logs to identify suspicious behavior, such as an abnormal amount of errors. It then blocks those IP addresses for a customer-defined period of time.",
      runtime: lambda.Runtime.PYTHON_3_8,
      code: lambda.Code.fromAsset(path.join(__dirname, './lambda-assets/log_parser.zip')),
      handler: "log-parser.lambda_handler",
      memorySize: 512,
      timeout: cdk.Duration.seconds(300),
      environment: {
        "APP_ACCESS_LOG_BUCKET": accessLogBucket.bucketName,
        "WAF_ACCESS_LOG_BUCKET": wafLogBucket.bucketName,
        "SEND_ANONYMOUS_USAGE_DATA": "No",
        "UUID": "CreateUniqueID.UUID",
        "LIMIT_IP_ADDRESS_RANGES_PER_IP_MATCH_CONDITION": "10000",
        "MAX_AGE_TO_UPDATE": "30",
        "REGION": "AWS::Region",
        "SCOPE": waf2Scope.valueAsString,
        "LOG_TYPE": "cloudfront",
        "METRIC_NAME_PREFIX": cdk.Fn.ref("AWS::StackName"),
        "LOG_LEVEL": logLevel,
        "STACK_NAME": cdk.Fn.ref("AWS::StackName"),
        "IP_SET_ID_HTTP_FLOODV4": httpFloodIpSetV4.attrArn,
        "IP_SET_ID_HTTP_FLOODV6": httpFloodIpSetV6.attrArn,
        "IP_SET_NAME_HTTP_FLOODV4": httpFloodIpSetV4.name!,
        "IP_SET_NAME_HTTP_FLOODV6": httpFloodIpSetV6.name!,
        "IP_SET_ID_SCANNERS_PROBESV4": scannersProbesIpSetV4.attrArn,
        "IP_SET_ID_SCANNERS_PROBESV6": scannersProbesIpSetV6.attrArn,
        "IP_SET_NAME_SCANNERS_PROBESV4": scannersProbesIpSetV4.name!,
        "IP_SET_NAME_SCANNERS_PROBESV6": scannersProbesIpSetV6.name!,
        "WAF_BLOCK_PERIOD": blockPeriod.valueAsString,
        "ERROR_THRESHOLD": errorThreshold.valueAsString,
        "REQUEST_THRESHOLD": requestThreshold.valueAsString,
        "SOLUTION_ID": "SO8128",
        "METRICS_URL": "https://metrics.awssolutionsbuilder.com/generic"
      }
    });

    const moveLogToPartitionLambda = new lambda.Function(this, "MoveS3LogsForPartition", {
      description: "This function is triggered by S3 event to move log files(upon their arrival in s3) from their original location to a partitioned folder structure created per timestamps in file names, hence allowing the usage of partitioning within AWS Athena.",
      runtime: lambda.Runtime.PYTHON_3_8,
      code: lambda.Code.fromAsset(path.join(__dirname, './lambda-assets/log_parser.zip')),
      handler: "partition_s3_logs.lambda_handler",
      memorySize: 512,
      timeout: cdk.Duration.seconds(300),
      environment: {
        "ENDPOINT": "CloudFront",
        "KEEP_ORIGINAL_DATA": "No",
        "LOG_LEVEL": logLevel
      },
    });

    const customTimerLambda = new lambda.Function(this, "CustomTimer", {
      description: "This lambda function counts X seconds and can be used to slow down component creation in CloudFormation",
      runtime: lambda.Runtime.PYTHON_3_8,
      code: lambda.Code.fromAsset(path.join(__dirname, './lambda-assets/timer.zip')),
      handler: "timer.lambda_handler",
      memorySize: 128,
      timeout: cdk.Duration.seconds(300),
      environment: {
        "LOG_LEVEL": logLevel,
        "SECONDS": "2"
      },
    });

    //IP reputation list Lambda
    const reputationListRole = new iam.Role(this, 'LambdaRoleReputationListsParser', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com')
    });
    reputationListRole.attachInlinePolicy(
      new iam.Policy(this, 'CloudWatchLogs', {
        policyName: 'CloudWatchLogs',
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            resources: ['*'],
            actions: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents'
            ]
          })
        ]
      })
    );
    reputationListRole.attachInlinePolicy(
      new iam.Policy(this, 'WAFGetAndUpdateIPSet', {
        policyName: 'WAFGetAndUpdateIPSet',
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            resources: ['*'],
            actions: [
              'wafv2:GetIPSet',
              'wafv2:UpdateIPSet'
            ]
          })
        ]
      })
    );
    reputationListRole.attachInlinePolicy(
      new iam.Policy(this, 'CloudFormationAccess', {
        policyName: 'CloudFormationAccess',
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            resources: ['*'],
            actions: [
              'cloudformation:DescribeStacks'
            ]
          })
        ]
      })
    );
    reputationListRole.attachInlinePolicy(
      new iam.Policy(this, 'CloudWatchAccess', {
        policyName: 'CloudWatchAccess',
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            resources: ['*'],
            actions: [
              'cloudwatch:GetMetricStatistics'
            ]
          })
        ]
      })
    );

    const reputationListsParserLambda = new lambda.Function(this, "ReputationListsParser", {
      description: "This lambda function checks third-party IP reputation lists hourly for new IP ranges to block. These lists include the Spamhaus Dont Route Or Peer (DROP) and Extended Drop (EDROP) lists, the Proofpoint Emerging Threats IP list, and the Tor exit node list.",
      runtime: lambda.Runtime.PYTHON_3_8,
      code: lambda.Code.fromAsset(path.join(__dirname, './lambda-assets/reputation_lists_parser.zip')),
      handler: "reputation-lists.lambda_handler",
      memorySize: 512,
      timeout: cdk.Duration.seconds(300),
      role: reputationListRole,
      environment: {
        "IP_SET_ID_REPUTATIONV4": reputationListsIpSetV4.attrArn,
        "IP_SET_ID_REPUTATIONV6": reputationListsIpSetV6.attrArn,
        "IP_SET_NAME_REPUTATIONV4": reputationListsIpSetV4.name!,
        "IP_SET_NAME_REPUTATIONV6": reputationListsIpSetV6.name!,
        "SCOPE": waf2Scope.valueAsString,
        "LOG_LEVEL": logLevel,
        "URL_LIST": "[{\"url\":\"https://www.spamhaus.org/drop/drop.txt\"},{\"url\":\"https://www.spamhaus.org/drop/edrop.txt\"},{\"url\":\"https://check.torproject.org/exit-addresses\", \"prefix\":\"ExitAddress\"},{\"url\":\"https://rules.emergingthreats.net/fwrules/emerging-Block-IPs.txt\"}]",
        "SOLUTION_ID": "SO8128",
        "METRICS_URL": "https://metrics.awssolutionsbuilder.com/generic",
        "STACK_NAME": cdk.Fn.ref("AWS::StackName"),
        "LOG_TYPE": "cloudfront",
        "SEND_ANONYMOUS_USAGE_DATA": "No",
        "IPREPUTATIONLIST_METRICNAME": reputationListName,
      }
    });

    //Add CloudWatch event to Lambda
    const reputationListsParserRule = new events.Rule(this, 'ReputationListsParserEventsRule', {
      description: "Security Automation - WAF Reputation Lists",
      schedule: events.Schedule.expression('rate(1 hour)'),
    });
    const reputationListsParserRuleInput = {
      "URL_LIST": [
        {
          "url": "https://www.spamhaus.org/drop/drop.txt"
        },
        {
          "url": "https://www.spamhaus.org/drop/edrop.txt"
        },
        {
          "url": "https://check.torproject.org/exit-addresses",
          "prefix": "ExitAddress"
        },
        {
          "url": "https://rules.emergingthreats.net/fwrules/emerging-Block-IPs.txt"
        }
      ],
      "IP_SET_ID_REPUTATIONV4": reputationListsIpSetV4.attrArn,
      "IP_SET_ID_REPUTATIONV6": reputationListsIpSetV6.attrArn,
      "IP_SET_NAME_REPUTATIONV4": reputationListsIpSetV4.name!,
      "IP_SET_NAME_REPUTATIONV6": reputationListsIpSetV6.name!,
      "SCOPE": waf2Scope.valueAsString
    }
    reputationListsParserRule.addTarget(
      new targets.LambdaFunction(
        reputationListsParserLambda,
        { event: events.RuleTargetInput.fromObject(reputationListsParserRuleInput) }
      )
    );

    //AWS Shield Advanced Lambda
    const shieldRole = new iam.Role(this, 'ShieldAdvanceRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com')
    });
    shieldRole.attachInlinePolicy(
      new iam.Policy(this, 'ShieldAdvanceAccess', {
        policyName: 'CloudFrontShieldAdvanceAccess',
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            resources: ['*'],
            actions: [
              'shield:Create*'
            ]
          })
        ]
      })
    );
    shieldRole.attachInlinePolicy(
      new iam.Policy(this, 'CloudFrontDistributionAccess', {
        policyName: 'CloudFrontDistributionAccess',
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            resources: ['*'],
            actions: [
              'cloudfront:GetDistribution'
            ]
          })
        ]
      })
    );
    shieldRole.attachInlinePolicy(
      new iam.Policy(this, 'ShieldLogAccess', {
        policyName: 'ShieldLogAccess',
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            resources: ['*'],
            actions: [
              'logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'
            ]
          })
        ]
      })
    );

    const shieldLambda = new lambda.Function(this, "ShieldAdvancedLambda", {
      description: "This lambda function create an AWS Shield resource protection and protection group for the cloudfront resource.",
      runtime: lambda.Runtime.PYTHON_3_8,
      code: lambda.Code.fromAsset(path.join(__dirname, './lambda-assets/shield_protection.zip')),
      handler: "shield-protection.lambda_handler",
      memorySize: 512,
      timeout: cdk.Duration.seconds(300),
      role: shieldRole,
      environment: {
        "SCOPE": waf2Scope.valueAsString,
        "LOG_LEVEL": logLevel,
        "SOLUTION_ID": "SO8128"
      }
    });

    //Badbot protection Lambda
    const badBotRole = new iam.Role(this, 'BadBotRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com')
    });
    badBotRole.attachInlinePolicy(
      new iam.Policy(this, 'BadBotLogsAccess', {
        policyName: 'LogsAccess',
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            resources: ['*'],
            actions: [
              'logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'
            ]
          })
        ]
      })
    );
    badBotRole.attachInlinePolicy(
      new iam.Policy(this, 'BadBotCloudFormationAccess', {
        policyName: 'CloudFormationAccess',
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            resources: ['*'],
            actions: [
              'cloudformation:DescribeStacks'
            ]
          })
        ]
      })
    );
    badBotRole.attachInlinePolicy(
      new iam.Policy(this, 'BadBotCloudWatchAccess', {
        policyName: 'CloudWatchAccess',
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            resources: ['*'],
            actions: [
              'cloudwatch:GetMetricStatistics'
            ]
          })
        ]
      })
    );
    badBotRole.attachInlinePolicy(
      new iam.Policy(this, 'BadBotWAFGetAndUpdateIPSet', {
        policyName: 'WAFGetAndUpdateIPSet',
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            resources: ['*'],
            actions: [
              'wafv2:GetIPSet', 'wafv2:UpdateIPSet'
            ]
          })
        ]
      })
    );

    const badBotParserLambda = new lambda.Function(this, "BadBotParser", {
      description: "This lambda function will intercepts and inspects trap endpoint requests to extract its IP address, and then add it to an AWS WAF block list.",
      runtime: lambda.Runtime.PYTHON_3_8,
      role: badBotRole,
      code: lambda.Code.fromAsset(path.join(__dirname, './lambda-assets/access_handler.zip')),
      handler: "access-handler.lambda_handler",
      memorySize: 512,
      timeout: cdk.Duration.seconds(300),
      environment: {
        "SCOPE": waf2Scope.valueAsString,
        "IP_SET_ID_BAD_BOTV4": badBotIpSetV4.attrArn,
        "IP_SET_ID_BAD_BOTV6": badBotIpSetV6.attrArn,
        "IP_SET_NAME_BAD_BOTV4": badBotIpSetV4.name!,
        "IP_SET_NAME_BAD_BOTV6": badBotIpSetV6.name!,
        "SEND_ANONYMOUS_USAGE_DATA": "No",
        "UUID": "CreateUniqueID.UUID",
        "REGION": cdk.Fn.ref("AWS::Region"),
        "LOG_TYPE": "cloudfront",
        "METRIC_NAME_PREFIX": cdk.Fn.ref("AWS::StackName"),
        "LOG_LEVEL": logLevel,
        "SOLUTION_ID": "SO8128",
        "METRICS_URL": "https://metrics.awssolutionsbuilder.com/generic",
        "STACK_NAME": cdk.Fn.ref("AWS::StackName"),
      }
    });

    const customResourceLambda = new lambda.Function(this, "CustomResource", {
      description: "This lambda function configures the Web ACL rules based on the features enabled in the CloudFormation template.",
      runtime: lambda.Runtime.PYTHON_3_8,
      code: lambda.Code.fromAsset(path.join(__dirname, './lambda-assets/custom_resource.zip')),
      handler: "custom-resource.lambda_handler",
      memorySize: 512,
      timeout: cdk.Duration.seconds(300),
      environment: {
        "LOG_LEVEL": logLevel,
        "SCOPE": waf2Scope.valueAsString,
        "SOLUTION_ID": "SO8128",
        "METRICS_URL": "https://metrics.awssolutionsbuilder.com/generic"
      }
    });

    //API Gateway for badbot detection
    const badBotApi = new apigateway.RestApi(this, 'ApiGatewayBadBot', {
      restApiName: 'Security Automation - WAF Bad Bot API',
      description: 'API created by AWS WAF Security Automation CloudFormation template. This endpoint will be used to capture bad bots.'
    });
    const integration = new apigateway.LambdaIntegration(badBotParserLambda);
    badBotApi.root.addMethod('ANY', integration, {
      requestParameters: {
        'method.request.header.X-Forwarded-For': false
      }
    });
    const badBotProxy = badBotApi.root.addResource('{proxy+}');
    badBotProxy.addMethod('ANY', integration, {
      requestParameters: {
        'method.request.header.X-Forwarded-For': false
      }
    });

    //Kinesis Data Firehose
    const firehoseRole = new iam.Role(this, 'FirehoseRole', {
      assumedBy: new iam.ServicePrincipal('firehose.amazonaws.com'),
    });

    firehoseRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "kinesis:DescribeStream",
          "kinesis:GetShardIterator",
          "kinesis:GetRecords"
        ],
        resources: ['*']
      })
    );

    firehoseRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "s3:AbortMultipartUpload",
          "s3:GetBucketLocation",
          "s3:GetObject",
          "s3:ListBucket",
          "s3:ListBucketMultipartUploads",
          "s3:PutObject"
        ],
        resources: [wafLogBucket.bucketArn, wafLogBucket.arnForObjects("*")]
      })
    );

    const firehoseStream = new firehose.CfnDeliveryStream(this, 'FirehoseWAFLogsDeliveryStream', {
      deliveryStreamName: "aws-waf-logs-" + this.stackName,
      deliveryStreamType: "DirectPut",
      extendedS3DestinationConfiguration: {
        "bucketArn": wafLogBucket.bucketArn,
        "bufferingHints": {
          "intervalInSeconds": 300,
          "sizeInMBs": 5
        },
        "compressionFormat": "GZIP",
        "prefix": "AWSLogs/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/hour=!{timestamp:HH}/",
        "errorOutputPrefix": "AWSErrorLogs/result=!{firehose:error-output-type}/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/hour=!{timestamp:HH}/",
        "roleArn": firehoseRole.roleArn
      },
    });

    //Glue DB & table
    const glueAccessLogsDatabase = new glue.Database(this, 'GlueAccessLogsDatabase', {
      databaseName: 'glue_accesslogs_database',
    });

    const glueWafAccessLogsTable = new glue.Table(this, 'GlueWafAccessLogsTable', {
      database: glueAccessLogsDatabase,
      tableName: 'waf_access_logs',
      description: this.stackName + ' - WAF Logs',
      bucket: wafLogBucket,
      s3Prefix: 'AWSLogs/',
      columns: [{
        name: 'timestamp',
        type: glue.Schema.BIG_INT
      }, {
        name: 'formatversion',
        type: glue.Schema.INTEGER
      }, {
        name: 'webaclid',
        type: glue.Schema.STRING
      }, {
        name: 'terminatingruleid',
        type: glue.Schema.STRING
      }, {
        name: 'terminatingruletype',
        type: glue.Schema.STRING
      }, {
        name: 'action',
        type: glue.Schema.STRING
      }, {
        name: 'httpsourcename',
        type: glue.Schema.STRING
      }, {
        name: 'httpsourceid',
        type: glue.Schema.STRING
      }, {
        name: 'rulegrouplist',
        type: glue.Schema.array(glue.Schema.STRING)
      }, {
        name: 'ratebasedrulelist',
        type: glue.Schema.array(glue.Schema.STRING)
      }, {
        name: 'nonterminatingmatchingrules',
        type: glue.Schema.array(glue.Schema.STRING)
      }, {
        name: 'httprequest',
        type: glue.Schema.struct([{
          name: 'clientip',
          type: glue.Schema.STRING
        }, {
          name: 'country',
          type: glue.Schema.STRING
        }, {
          name: 'headers',
          type: glue.Schema.array(glue.Schema.struct([{
            name: 'name',
            type: glue.Schema.STRING
          }, {
            name: 'value',
            type: glue.Schema.STRING
          }]))
        }, {
          name: 'uri',
          type: glue.Schema.STRING
        }, {
          name: 'args',
          type: glue.Schema.STRING
        }, {
          name: 'httpversion',
          type: glue.Schema.STRING
        }, {
          name: 'httpmethod',
          type: glue.Schema.STRING
        }, {
          name: 'requestid',
          type: glue.Schema.STRING
        }])
      }],
      partitionKeys: [{
        name: 'year',
        type: glue.Schema.INTEGER
      }, {
        name: 'month',
        type: glue.Schema.INTEGER
      }, {
        name: 'day',
        type: glue.Schema.INTEGER
      }, {
        name: 'hour',
        type: glue.Schema.INTEGER
      }],
      dataFormat: {
        inputFormat: new glue.InputFormat('org.apache.hadoop.mapred.TextInputFormat'),
        outputFormat: new glue.OutputFormat('org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat'),
        serializationLibrary: new glue.SerializationLibrary('org.openx.data.jsonserde.JsonSerDe')
      }
    });


    // const df = new glue.DataFormat({
    //   inputFormat: new glue.InputFormat('org.apache.hadoop.mapred.TextInputFormat'),
    //   outputFormat: new glue.OutputFormat('org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat'),
    //   serializationLibrary: new glue.SerializationLibrary('org.openx.data.jsonserde.JsonSerDe'),
    // });

    const glueAppAccessLogsTable = new glue.CfnTable(this, 'glueAppAccessLogsTable', {
      databaseName: glueAccessLogsDatabase.databaseName,
      catalogId: this.account,
      tableInput: {
        name: "app_access_logs",
        description: this.stackName + ' - APP Access Logs',
        parameters: {
          "skip.header.line.count": "2",
          "EXTERNAL": "TRUE",
        },
        storageDescriptor: {
          columns: [{
            name: 'date',
            type: glue.Schema.DATE.inputString
          }, {
            name: 'time',
            type: glue.Schema.STRING.inputString
          }, {
            name: 'location',
            type: glue.Schema.STRING.inputString
          }, {
            name: 'bytes',
            type: glue.Schema.BIG_INT.inputString
          }, {
            name: 'requestip',
            type: glue.Schema.STRING.inputString
          }, {
            name: 'method',
            type: glue.Schema.STRING.inputString
          }, {
            name: 'host',
            type: glue.Schema.STRING.inputString
          }, {
            name: 'uri',
            type: glue.Schema.STRING.inputString
          }, {
            name: 'status',
            type: glue.Schema.INTEGER.inputString
          }, {
            name: 'referrer',
            type: glue.Schema.STRING.inputString
          }, {
            name: 'useragent',
            type: glue.Schema.STRING.inputString
          }, {
            name: 'querystring',
            type: glue.Schema.STRING.inputString
          }, {
            name: 'cookie',
            type: glue.Schema.STRING.inputString
          }, {
            name: 'resulttype',
            type: glue.Schema.STRING.inputString
          }, {
            name: 'requestid',
            type: glue.Schema.STRING.inputString
          }, {
            name: 'hostheader',
            type: glue.Schema.STRING.inputString
          }, {
            name: 'requestprotocol',
            type: glue.Schema.STRING.inputString
          }, {
            name: 'requestbytes',
            type: glue.Schema.BIG_INT.inputString
          }, {
            name: 'timetaken',
            type: glue.Schema.FLOAT.inputString
          }, {
            name: 'xforwardedfor',
            type: glue.Schema.STRING.inputString
          }, {
            name: 'sslprotocol',
            type: glue.Schema.STRING.inputString
          }, {
            name: 'sslcipher',
            type: glue.Schema.STRING.inputString
          }, {
            name: 'responseresulttype',
            type: glue.Schema.STRING.inputString
          }, {
            name: 'httpversion',
            type: glue.Schema.STRING.inputString
          }, {
            name: 'filestatus',
            type: glue.Schema.STRING.inputString
          }, {
            name: 'encryptedfields',
            type: glue.Schema.INTEGER.inputString
          }],
          compressed: false,
          inputFormat: "org.apache.hadoop.mapred.TextInputFormat",
          location: 's3://' + accessLogBucket.bucketName + '/AWSLogs-Partitioned/',
          outputFormat: "org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat",
          serdeInfo: {
            serializationLibrary: "org.apache.hadoop.hive.serde2.lazy.LazySimpleSerDe",
            parameters: {
              "field.delim": "	",
              "serialization.format": "	",
            }
          },
          storedAsSubDirectories: false
        },
        tableType: "EXTERNAL_TABLE",
        partitionKeys: [{
          name: 'year',
          type: glue.Schema.INTEGER.inputString
        }, {
          name: 'month',
          type: glue.Schema.INTEGER.inputString
        }, {
          name: 'day',
          type: glue.Schema.INTEGER.inputString
        }, {
          name: 'hour',
          type: glue.Schema.INTEGER.inputString
        }],
      }
    });

    //Athena
    const addPartitionAthenaQueryWorkGroup = new athena.CfnWorkGroup(this, 'WAFAddPartitionAthenaQueryWorkGroup', {
      name: "WAFAddPartitionAthenaQueryWorkGroup",
      description: "Athena WorkGroup for adding Athena partition queries used by AWS WAF Security Automations Solution",
      state: "ENABLED",
      recursiveDeleteOption: true,
      workGroupConfiguration: {
        "publishCloudWatchMetricsEnabled": true,
        enforceWorkGroupConfiguration: false
      }
    });

    const wafLogAthenaQueryWorkGroup = new athena.CfnWorkGroup(this, 'WAFLogAthenaQueryWorkGroup', {
      name: "WAFLogAthenaQueryWorkGroup",
      description: "Athena WorkGroup for WAF log queries used by AWS WAF Security Automations Solution",
      state: "ENABLED",
      recursiveDeleteOption: true,
      workGroupConfiguration: {
        "publishCloudWatchMetricsEnabled": true,
      }
    });

    const appLogAthenaQueryWorkGroup = new athena.CfnWorkGroup(this, 'WAFAppAccessLogAthenaQueryWorkGroup', {
      name: "WAFAppAccessLogAthenaQueryWorkGroup",
      description: "Athena WorkGroup for CloudFront or ALB application access log queries used by AWS WAF Security Automations Solution",
      state: "ENABLED",
      recursiveDeleteOption: true,
      workGroupConfiguration: {
        "publishCloudWatchMetricsEnabled": true,
      }
    });

    //Cloudwatch Dashboard
    const monitoringDashboard = new cloudwatch.CfnDashboard(this, 'MonitoringDashboard', {
      dashboardName: cloudWatchDashboardName,
      dashboardBody: JSON.stringify({
        widgets: [
          {
            type: "metric",
            x: 0,
            y: 0,
            width: 15,
            height: 10,
            properties: {
              view: "timeSeries",
              stacked: false,
              metrics: [
                ["WAF", "BlockedRequests", "WebACL", "WAFWebACLMetricName", "Rule", "ALL"],
                ["WAF", "AllowedRequests", "WebACL", "WAFWebACLMetricName", "Rule", "ALL"],
              ],
              region: "us-east-1",
              period: 300,
            }
          }
        ]
      }),
    });

    //Add CloudWatch event to Lambda LogParser
    const logParserWafLogRuleInput = {
      "resourceType": "LambdaAthenaWAFLogParser",
      "glueAccessLogsDatabase": glueAccessLogsDatabase.databaseName,
      "accessLogBucket": wafLogBucket.bucketName,
      "glueWafAccessLogsTable": glueWafAccessLogsTable.tableName,
      "athenaWorkGroup": "WAFLogAthenaQueryWorkGroup"
    };

    const lambdaAthenaWAFLogParserRule = new events.Rule(this, "lambdaAthenaWAFLogParserRule", {
      description: "Security Automation - WAF Logs Athena parser",
      schedule: events.Schedule.expression('rate(5 minutes)'),
      targets: [new targets.LambdaFunction(logParserLambda, {
        event: events.RuleTargetInput.fromObject(logParserWafLogRuleInput)
      })]
    });

    const lambdaAthenaAppLogParserRuleInput = {
      "resourceType": "LambdaAthenaAppLogParser",
      "glueAccessLogsDatabase": glueAccessLogsDatabase.databaseName,
      "accessLogBucket": accessLogBucket.bucketName,
      "glueAppAccessLogsTable": "app_access_logs",
      "athenaWorkGroup": "WAFAppAccessLogAthenaQueryWorkGroup"
    };

    const lambdaAthenaAppLogParserRule = new events.Rule(this, "lambdaAthenaAppLogParserRule", {
      description: "Security Automation - App Logs Athena parser",
      schedule: events.Schedule.expression('rate(5 minutes)'),
      targets: [new targets.LambdaFunction(logParserLambda, {
        event: events.RuleTargetInput.fromObject(lambdaAthenaAppLogParserRuleInput)
      })]
    });



    const addAthenaPartitionsLambda = new lambda.Function(this, "AddAthenaPartitionsFunction", {
      description: "This function adds a new hourly partition to athena table. It runs every hour, triggered by a CloudWatch event.",
      runtime: lambda.Runtime.PYTHON_3_8,
      code: lambda.Code.fromAsset(path.join(__dirname, './lambda-assets/log_parser.zip')),
      handler: "add_athena_partitions.lambda_handler",
      memorySize: 512,
      timeout: cdk.Duration.minutes(5),
      maxEventAge: cdk.Duration.hours(6),
      retryAttempts: 2,
      environment: {
        "LOG_LEVEL": logLevel
      }
    });

    const addAthenaPartitionsRuleInput = {
      "resourceType": "LambdaAddAthenaPartitionsEventsRule",
      "glueAccessLogsDatabase": glueAccessLogsDatabase.databaseName,
      "accessLogBucket": accessLogBucket.bucketName,
      "glueAppAccessLogsTable": glueAppAccessLogsTable.logicalId,
      "glueWafAccessLogsTable": glueWafAccessLogsTable.tableName,
      "wafLogBucket": wafLogBucket.bucketName,
      "athenaWorkGroup": addPartitionAthenaQueryWorkGroup.name
    };

    const lambdaAddAthenaPartitionRule = new events.Rule(this, "lambdaAddAthenaPartition", {
      description: "Security Automations - Add partitions to Athena table",
      schedule: events.Schedule.expression('rate(1 hour)'),
      targets: [new targets.LambdaFunction(addAthenaPartitionsLambda, {
        event: events.RuleTargetInput.fromObject(addAthenaPartitionsRuleInput)
      })]
    });

    addAthenaPartitionsLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "s3:AbortMultipartUpload",
          "s3:GetBucketLocation",
          "s3:GetObject",
          "s3:ListBucket",
          "s3:ListBucketMultipartUploads",
          "s3:PutObject",
          "glue:GetTable",
          "glue:GetDatabase",
          "glue:UpdateDatabase",
          "glue:CreateDatabase",
          "glue:BatchCreatePartition",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        resources: ['*']
      })
    );

    addAthenaPartitionsLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "athena:StartQueryExecution"
        ],
        resources: ['*']
      })
    );

    logParserLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "glue:GetTable",
          "glue:GetPartitions"
        ],
        resources: [
          glueAccessLogsDatabase.catalogArn,
          glueAccessLogsDatabase.databaseArn,
          `arn:${cdk.Aws.PARTITION}:glue:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:table/${glueAccessLogsDatabase.databaseName}/waf_access_logs`,
          `arn:${cdk.Aws.PARTITION}:glue:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:table/${glueAccessLogsDatabase.databaseName}/app_access_logs`,
        ]
      })
    )

    logParserLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "wafv2:GetIPSet",
          "wafv2:UpdateIPSet"
        ],
        resources: [
          httpFloodIpSetV4.attrArn,
          httpFloodIpSetV6.attrArn,
          scannersProbesIpSetV4.attrArn,
          scannersProbesIpSetV6.attrArn,
        ]
      })
    )

    logParserLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "athena:GetNamedQuery",
          "athena:StartQueryExecution"
        ],
        resources: [
          `arn:${cdk.Aws.PARTITION}:athena:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:workgroup/WAF*`,
        ]
      })
    )

    logParserLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "cloudwatch:GetMetricStatistics"
        ],
        resources: [
          "*"
        ]
      })
    )

    logParserLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        resources: [
          `arn:${cdk.Aws.PARTITION}:athena:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:log-group:/aws/lambda/*LogParser*`
        ]
      })
    )

    logParserLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "s3:GetBucketLocation",
          "s3:GetObject",
          "s3:ListBucket",
          "s3:ListBucketMultipartUploads",
          "s3:ListMultipartUploadParts",
          "s3:AbortMultipartUpload",
          "s3:CreateBucket",
          "s3:PutObject"
        ],
        resources: [
          accessLogBucket.bucketArn + "/athena_results/*",
          accessLogBucket.bucketArn + "/*",
          accessLogBucket.bucketArn,
          wafLogBucket.bucketArn + "/athena_results/*",
          wafLogBucket.bucketArn + "/*",
          wafLogBucket.bucketArn

        ]
      })
    )

    // S3
    logParserLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "s3:GetBucketLocation",
          "s3:GetObject",
          "s3:ListBucket",
          "s3:ListBucketMultipartUploads",
          "s3:ListMultipartUploadParts",
          "s3:AbortMultipartUpload",
          "s3:CreateBucket",
          "s3:PutObject"
        ],
        resources: [
          wafLogBucket.bucketArn + "/athena_results/*",
          accessLogBucket.bucketArn + "/athena_results/*",
          wafLogBucket.bucketArn,
          accessLogBucket.bucketArn,
        ]
      })
    )

    logParserLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "s3:GetObject",
        ],
        resources: [
          wafLogBucket.bucketArn + "/*",
          accessLogBucket.bucketArn + "/*",
        ]
      })
    )

    logParserLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "s3:PutObject",
        ],
        resources: [
          wafLogBucket.bucketArn + "/" + this.stackName + "-waf_log_out.json",
          wafLogBucket.bucketArn + "/" + this.stackName + "-waf_log_conf.json",
          accessLogBucket.bucketArn + "/" + this.stackName + "-waf_log_out.json",
          accessLogBucket.bucketArn + "/" + this.stackName + "-waf_log_conf.json",
        ]
      })
    )

    moveLogToPartitionLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        resources: [
          `arn:${cdk.Aws.PARTITION}:athena:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:log-group:/aws/lambda/*MoveS3LogsForPartition*`
        ]
      })
    )

    moveLogToPartitionLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:PutObject",
        ],
        resources: [
          accessLogBucket.bucketArn + "/*",
        ]
      })
    )

    customResourceLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "cloudformation:DescribeStacks",
        ],
        resources: [
          `arn:${cdk.Aws.PARTITION}:cloudformation:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:stack/${cdk.Stack.name}/*`
        ]
      })
    )

    customResourceLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "lambda:InvokeFunction",
        ],
        resources: [
          `arn:${cdk.Aws.PARTITION}:lambda:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:function:${this.stackName}*`
        ]
      })
    )

    customResourceLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "wafv2:GetIPSet",
          "wafv2:DeleteIPSet",
          "wafv2:GetWebACL",
          "wafv2:UpdateWebACL",
          "wafv2:DeleteLoggingConfiguration",
          "wafv2:PutLoggingConfiguration",
        ],
        resources: [
          wafweb.attrArn,
        ]
      })
    )
    
    customResourceLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "wafv2:GetIPSet",
          "wafv2:DeleteIPSet",
        ],
        resources: [
          `arn:${cdk.Aws.PARTITION}:logs:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:regional/ipset/${this.stackName}*`,
          `arn:${cdk.Aws.PARTITION}:logs:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:global/ipset/${this.stackName}*`,
        ]
      })
    )

    customResourceLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ],
        resources: [
          `arn:${cdk.Aws.PARTITION}:logs:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:log-group:/aws/lambda/*CustomResource*`
        ]
      })
    )

    customResourceLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "s3:GetBucketLocation",
          "s3:GetObject",
          "s3:ListBucket",
          "s3:CreateBucket",
          "s3:GetBucketNotification",
          "s3:PutBucketNotification",
          "s3:PutEncryptionConfiguration",
          "s3:PutBucketPublicAccessBlock"
        ],
        resources: [
          accessLogBucket.bucketArn
        ]
      })
    )

    customResourceLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "s3:CreateBucket",
          "s3:GetBucketNotification",
          "s3:PutBucketNotification",
        ],
        resources: [
          wafLogBucket.bucketArn
        ]
      })
    )

    customResourceLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "iam:CreateServiceLinkedRole",
        ],
        resources: [
          'arn:aws:iam::*:role/aws-service-role/wafv2.amazonaws.com/AWSServiceRoleForWAFV2Logging'
        ]
      })
    )

    wafLogBucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3n.LambdaDestination(logParserLambda), {
      prefix: 'athena_results/',
      suffix: 'csv'
    });

    accessLogBucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3n.LambdaDestination(moveLogToPartitionLambda), {
      prefix: 'AWSLogs/',
      suffix: 'gz'
    });

    accessLogBucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3n.LambdaDestination(logParserLambda), {
      prefix: 'athena_results/',
      suffix: 'csv'
    });

    const customResourceProvider = new cr.Provider(this, 'customResourceProvider', {
      onEventHandler: customResourceLambda,
    });

    new CustomResource(this, 'ConfigureAWSWAFLogs', {
      serviceToken: customResourceProvider.serviceToken,
      resourceType: "Custom::ConfigureAWSWAFLogs",
      properties: {
        WAFWebACLArn: wafweb.attrArn,
        DeliveryStreamArn: firehoseStream.attrArn,
      },
    });

    new CustomResource(this, 'ConfigureAppAccessLogBucket', {
      serviceToken: customResourceProvider.serviceToken,
      resourceType: "Custom::ConfigureAppAccessLogBucket",
      properties: {
        Region: this.region,
        AppAccessLogBucket: accessLogBucket.bucketName,
        LogParser: logParserLambda.functionArn,
        ScannersProbesAthenaLogParser: 'yes',
        MoveS3LogsForPartition: moveLogToPartitionLambda.functionName,
      },
    });

    new CustomResource(this, 'ConfigureWafLogBucket', {
      serviceToken: customResourceProvider.serviceToken,
      resourceType: "Custom::ConfigureWafLogBucket",
      properties: {
        Region: this.region,
        WafLogBucket: wafLogBucket.bucketName,
        LogParser: logParserLambda.functionArn,
        HttpFloodAthenaLogParser: 'yes',
      },
    });

    new CustomResource(this, 'ConfigureWebAcl', {
      serviceToken: customResourceProvider.serviceToken,
      resourceType: "Custom::ConfigureWebAcl",
      properties: {
        WAFWhitelistSetIPV4: whitelistIpSetV4.attrId,
        WAFWhitelistSetIPV4Name: whitelistIpSetV4.name,
      },
    });

    new CustomResource(this, 'GenerateAppLogParserConfFile', {
      serviceToken: customResourceProvider.serviceToken,
      resourceType: "Custom::GenerateAppLogParserConfFile",
      properties: {
        StackName: this.stackName,
        ErrorThreshold: errorThreshold,
        WAFBlockPeriod: blockPeriod.valueAsString,
        AppAccessLogBucket: accessLogBucket.bucketName,
      },
    });

    new CustomResource(this, 'GenerateWafLogParserConfFile', {
      serviceToken: customResourceProvider.serviceToken,
      resourceType: "Custom::GenerateWafLogParserConfFile",
      properties: {
        StackName: this.stackName,
        RequestThreshold: requestThreshold.valueAsString,
        WAFBlockPeriod: blockPeriod.valueAsString,
        WafAccessLogBucket: wafLogBucket.bucketName,
      },
    });

    new CustomResource(this, 'AddAthenaPartitions', {
      serviceToken: customResourceProvider.serviceToken,
      resourceType: "Custom::AddAthenaPartitions",
      properties: {
        ResourceType: "Custom::AddAthenaPartitions",
        AddAthenaPartitionsLambda: addAthenaPartitionsLambda.functionName,
        GlueAccessLogsDatabase: glueAccessLogsDatabase.databaseName,
        AppAccessLogBucket: accessLogBucket.bucketName,
        GlueAppAccessLogsTable: 'app_access_logs',
        GlueWafAccessLogsTable: glueWafAccessLogsTable.tableName,
        WafLogBucket: wafLogBucket.bucketName,
        AthenaWorkGroup: addPartitionAthenaQueryWorkGroup.name,
      },
    });

    new cdk.CfnOutput(this, 'AppAccessLogBucketName', { value: accessLogBucket.bucketName });

    new cdk.CfnOutput(this, 'WafLogBucketName', { value: wafLogBucket.bucketName });

    new cdk.CfnOutput(this, 'WAFWebACLName', { value: wafweb.attrId });

    new cdk.CfnOutput(this, 'WAFWebACLArn', { value: wafweb.attrArn });

  }
}
