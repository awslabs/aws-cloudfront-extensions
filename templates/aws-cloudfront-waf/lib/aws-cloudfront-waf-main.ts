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

export class AwsCloudfrontWafStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: cdk.StackProps = {}) {
    super(scope, id, props);

    const cloudWatchDashboardName = 'WAFMonitoringDashboard-us-east-1';
    const reputationListName = cdk.Fn.ref("AWS::StackName") + 'IPReputationListsRule';
    const allowListName = cdk.Fn.ref("AWS::StackName") + 'WhitelistRule';
    const blacklistRuleName = cdk.Fn.ref("AWS::StackName") + 'BlacklistRule';
    const httpFloodRegularRuleName = cdk.Fn.ref("AWS::StackName") + 'HttpFloodRegularRule';
    const scannersProbesRuleName = cdk.Fn.ref("AWS::StackName") + 'ScannersProbesRule';
    const badBotRuleName = cdk.Fn.ref("AWS::StackName") + 'BadBotRule';
    const sqlInjectionRuleName = cdk.Fn.ref("AWS::StackName") + 'SqlInjectionRule';
    const xssRuleName = cdk.Fn.ref("AWS::StackName") + 'XssRule';

    //WafLogBucket
    const wafLogBucket = new s3.Bucket(this, "WafLogBucket", {
      bucketName: "aws-waf-log-bucket-cloudfront5",
      publicReadAccess: false,
      encryption: s3.BucketEncryption.KMS_MANAGED
    });

    const accessLogBucket = new s3.Bucket(this, "AccessLogBucket", {
      bucketName: "aws-waf-access-log-bucket-cloudfront5",
      publicReadAccess: false,
      encryption: s3.BucketEncryption.KMS_MANAGED
    });

    // Setup Whitelist IP Set
    const whitelistIpSetV4 = new wafv2.CfnIPSet(this, 'WhitelistSetIPV4', {
      addresses: [],
      ipAddressVersion: 'IPV4',
      scope: 'CLOUDFRONT',
      name: cdk.Fn.ref("AWS::StackName") + 'WhitelistSetIPV4',
      description: 'Allow whitelist for IPV4 addresses',
    });

    const whitelistIpSetV6 = new wafv2.CfnIPSet(this, 'WhitelistSetIPV6', {
      addresses: [],
      ipAddressVersion: 'IPV6',
      scope: 'CLOUDFRONT',
      name: cdk.Fn.ref("AWS::StackName") + 'WhitelistSetIPV6',
      description: 'Allow whitelist for IPV6 addresses',
    });

    // Setup Blacklist IP Set
    const blacklistIpSetV4 = new wafv2.CfnIPSet(this, 'BlacklistSetIPV4', {
      addresses: [],
      ipAddressVersion: 'IPV4',
      scope: 'CLOUDFRONT',
      name: cdk.Fn.ref("AWS::StackName") + 'BlacklistSetIPV4',
      description: 'Allow blacklist for IPV4 addresses',
    });

    const blacklistIpSetV6 = new wafv2.CfnIPSet(this, 'BlacklistSetIPV6', {
      addresses: [],
      ipAddressVersion: 'IPV6',
      scope: 'CLOUDFRONT',
      name: cdk.Fn.ref("AWS::StackName") + 'BlacklistSetIPV6',
      description: 'Allow blacklist for IPV6 addresses',
    });

    // Setup HTTP Flood IP Set
    const httpFloodIpSetV4 = new wafv2.CfnIPSet(this, 'HTTPFloodSetIPV4', {
      addresses: [],
      ipAddressVersion: 'IPV4',
      scope: 'CLOUDFRONT',
      name: cdk.Fn.ref("AWS::StackName") + 'HTTPFloodSetIPV4',
      description: 'Block HTTP Flood IPV4 addresses',
    });

    const httpFloodIpSetV6 = new wafv2.CfnIPSet(this, 'HTTPFloodSetIPV6', {
      addresses: [],
      ipAddressVersion: 'IPV6',
      scope: 'CLOUDFRONT',
      name: cdk.Fn.ref("AWS::StackName") + 'HTTPFloodSetIPV6',
      description: 'Block HTTP Flood IPV6 addresses',
    });

    // Block Scanners/Probes IP Set
    const scannersProbesIpSetV4 = new wafv2.CfnIPSet(this, 'ScannersProbesSetIPV4', {
      addresses: [],
      ipAddressVersion: 'IPV4',
      scope: 'CLOUDFRONT',
      name: cdk.Fn.ref("AWS::StackName") + 'ScannersProbesSetIPV4',
      description: 'Block Scanners/Probes IPV4 addresses',
    });

    const scannersProbesIpSetV6 = new wafv2.CfnIPSet(this, 'ScannersProbesSetIPV6', {
      addresses: [],
      ipAddressVersion: 'IPV6',
      scope: 'CLOUDFRONT',
      name: cdk.Fn.ref("AWS::StackName") + 'ScannersProbesSetIPV6',
      description: 'Block Scanners/Probes IPV6 addresses',
    });

    // Block Reputation List IP Set
    const reputationListsIpSetV4 = new wafv2.CfnIPSet(this, 'IPReputationListsSetIPV4', {
      addresses: [],
      ipAddressVersion: 'IPV4',
      scope: 'CLOUDFRONT',
      name: cdk.Fn.ref("AWS::StackName") + 'IPReputationListsSetIPV4',
      description: 'Block Reputation List IPV4 addresses',
    });

    const reputationListsIpSetV6 = new wafv2.CfnIPSet(this, 'IPReputationListsSetIPV6', {
      addresses: [],
      ipAddressVersion: 'IPV6',
      scope: 'CLOUDFRONT',
      name: cdk.Fn.ref("AWS::StackName") + 'IPReputationListsSetIPV6',
      description: 'Block Reputation List IPV6 addresses',
    });

    // Block Bad Bot IP Set
    const badBotIpSetV4 = new wafv2.CfnIPSet(this, 'IPBadBotSetIPV4', {
      addresses: [],
      ipAddressVersion: 'IPV4',
      scope: 'CLOUDFRONT',
      name: cdk.Fn.ref("AWS::StackName") + 'IPBadBotSetIPV4',
      description: 'Block Bad Bot IPV4 addresses',
    });

    const badBotIpSetV6 = new wafv2.CfnIPSet(this, 'IPBadBotSetIPV6', {
      addresses: [],
      ipAddressVersion: 'IPV6',
      scope: 'CLOUDFRONT',
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
      scope: 'CLOUDFRONT',
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
        "LOG_LEVEL": "INFO",
        "SCOPE": "CLOUDFRONT"
      }
    });

    const logParserLambda = new lambda.Function(this, "LogParser", {
      description: "This function parses access logs to identify suspicious behavior, such as an abnormal amount of errors. It then blocks those IP addresses for a customer-defined period of time.",
      runtime: lambda.Runtime.PYTHON_3_8,
      code: lambda.Code.fromAsset(path.join(__dirname, './lambda-assets/log_parser.zip')),
      handler: "log-parser.lambda_handler",
      //             role: "LambdaRoleLogParser.Arn",
      memorySize: 512,
      timeout: cdk.Duration.seconds(300),
      environment: {
        "APP_ACCESS_LOG_BUCKET": accessLogBucket.bucketName,
        "SEND_ANONYMOUS_USAGE_DATA": "NO",
        "UUID": "CreateUniqueID.UUID",
        "LIMIT_IP_ADDRESS_RANGES_PER_IP_MATCH_CONDITION": "10000",
        "MAX_AGE_TO_UPDATE": "30",
        "REGION": "AWS::Region",
        "SCOPE": "CLOUDFRONT",
        "LOG_TYPE": "cloudfront",
        "METRIC_NAME_PREFIX": cdk.Fn.ref("AWS::StackName"),
        "LOG_LEVEL": "INFO",
        "STACK_NAME": cdk.Fn.ref("AWS::StackName"),
        "IP_SET_ID_HTTP_FLOODV4": httpFloodIpSetV4.attrArn,
        "IP_SET_ID_HTTP_FLOODV6": httpFloodIpSetV6.attrArn,
        "IP_SET_NAME_HTTP_FLOODV4": httpFloodIpSetV4.name!,
        "IP_SET_NAME_HTTP_FLOODV6": httpFloodIpSetV6.name!,
        "IP_SET_ID_SCANNERS_PROBESV4": scannersProbesIpSetV4.attrArn,
        "IP_SET_ID_SCANNERS_PROBESV6": scannersProbesIpSetV6.attrArn,
        "IP_SET_NAME_SCANNERS_PROBESV4": scannersProbesIpSetV4.name!,
        "IP_SET_NAME_SCANNERS_PROBESV6": scannersProbesIpSetV6.name!,
        "WAF_BLOCK_PERIOD": "240",
        "ERROR_THRESHOLD": "50",
        "REQUEST_THRESHOLD": "100",
        "SOLUTION_ID": "lvning-solutionid",
        "METRICS_URL": "https://metrics.awssolutionsbuilder.com/generic"
      }
    });

    const customTimerLambda = new lambda.Function(this, "CustomTimer", {
      description: "This lambda function counts X seconds and can be used to slow down component creation in CloudFormation",
      runtime: lambda.Runtime.PYTHON_3_8,
      code: lambda.Code.fromAsset(path.join(__dirname, './lambda-assets/timer.zip')),
      handler: "timer.lambda_handler",
      memorySize: 128,
      timeout: cdk.Duration.seconds(300),
      environment: {
        "LOG_LEVEL": "INFO",
        "SECONDS": "2"
      }
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
        "SCOPE": "CLOUDFRONT",
        "LOG_LEVEL": "INFO",
        "URL_LIST": "[{\"url\":\"https://www.spamhaus.org/drop/drop.txt\"},{\"url\":\"https://www.spamhaus.org/drop/edrop.txt\"},{\"url\":\"https://check.torproject.org/exit-addresses\", \"prefix\":\"ExitAddress\"},{\"url\":\"https://rules.emergingthreats.net/fwrules/emerging-Block-IPs.txt\"}]",
        "SOLUTION_ID": "lvning-solutionid",
        "METRICS_URL": "https://metrics.awssolutionsbuilder.com/generic",
        "STACK_NAME": cdk.Fn.ref("AWS::StackName"),
        "LOG_TYPE": "cloudfront",
        "SEND_ANONYMOUS_USAGE_DATA": "NO",
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
      "SCOPE": "CLOUDFRONT"
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
        "SCOPE": "CLOUDFRONT",
        "LOG_LEVEL": "INFO",
        "SOLUTION_ID": "lvning-solutionid"
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
        "SCOPE": "CLOUDFRONT",
        "IP_SET_ID_BAD_BOTV4": badBotIpSetV4.attrArn,
        "IP_SET_ID_BAD_BOTV6": badBotIpSetV6.attrArn,
        "IP_SET_NAME_BAD_BOTV4": badBotIpSetV4.name!,
        "IP_SET_NAME_BAD_BOTV6": badBotIpSetV6.name!,
        "SEND_ANONYMOUS_USAGE_DATA": "NO",
        "UUID": "CreateUniqueID.UUID",
        "REGION": cdk.Fn.ref("AWS::Region"),
        "LOG_TYPE": "cloudfront",
        "METRIC_NAME_PREFIX": cdk.Fn.ref("AWS::StackName"),
        "LOG_LEVEL": "INFO",
        "SOLUTION_ID": "lvning-solutionid",
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
        "LOG_LEVEL": "INFO",
        "SCOPE": "CLOUDFRONT",
        "SOLUTION_ID": "lvning-solutionid",
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
      assumedBy: new iam.ServicePrincipal('firehose.amazonaws.com')
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
      deliveryStreamName: "WAF_firehose",
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
      }
    });

    //Glue DB & table
    const glueAccessLogsDatabase = new glue.Database(this, 'GlueAccessLogsDatabase', {
      databaseName: 'glue_accesslogs_database'
    });

    const glueWafAccessLogsTable = new glue.Table(this, 'GlueWafAccessLogsTable', {
      database: glueAccessLogsDatabase,
      tableName: 'waf_access_logs',
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

    const cloudFrontGlueAppAccessLogsTable = new glue.Table(this, 'CloudFrontGlueAppAccessLogsTable', {
      database: glueAccessLogsDatabase,
      tableName: 'app_access_logs',
      bucket: accessLogBucket,
      s3Prefix: 'AWSLogs-Partitioned/',
      columns: [{
        name: 'date',
        type: glue.Schema.DATE
      }, {
        name: 'time',
        type: glue.Schema.STRING
      }, {
        name: 'location',
        type: glue.Schema.STRING
      }, {
        name: 'bytes',
        type: glue.Schema.BIG_INT
      }, {
        name: 'requestip',
        type: glue.Schema.STRING
      }, {
        name: 'method',
        type: glue.Schema.STRING
      }, {
        name: 'host',
        type: glue.Schema.STRING
      }, {
        name: 'uri',
        type: glue.Schema.STRING
      }, {
        name: 'status',
        type: glue.Schema.INTEGER
      }, {
        name: 'referrer',
        type: glue.Schema.STRING
      }, {
        name: 'useragent',
        type: glue.Schema.STRING
      }, {
        name: 'querystring',
        type: glue.Schema.STRING
      }, {
        name: 'cookie',
        type: glue.Schema.STRING
      }, {
        name: 'resulttype',
        type: glue.Schema.STRING
      }, {
        name: 'requestid',
        type: glue.Schema.STRING
      }, {
        name: 'hostheader',
        type: glue.Schema.STRING
      }, {
        name: 'requestprotocol',
        type: glue.Schema.STRING
      }, {
        name: 'requestbytes',
        type: glue.Schema.BIG_INT
      }, {
        name: 'timetaken',
        type: glue.Schema.FLOAT
      }, {
        name: 'xforwardedfor',
        type: glue.Schema.STRING
      }, {
        name: 'sslprotocol',
        type: glue.Schema.STRING
      }, {
        name: 'sslcipher',
        type: glue.Schema.STRING
      }, {
        name: 'responseresulttype',
        type: glue.Schema.STRING
      }, {
        name: 'httpversion',
        type: glue.Schema.STRING
      }, {
        name: 'filestatus',
        type: glue.Schema.STRING
      }, {
        name: 'encryptedfields',
        type: glue.Schema.INTEGER
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
        serializationLibrary: new glue.SerializationLibrary('org.apache.hadoop.hive.serde2.lazy.LazySimpleSerDe')
      }
    });


    //Athena
    new athena.CfnWorkGroup(this, 'WAFAddPartitionAthenaQueryWorkGroup', {
      name: "WAFAddPartitionAthenaQueryWorkGroup",
      description: "Athena WorkGroup for adding Athena partition queries used by AWS WAF Security Automations Solution",
      state: "ENABLED",
      recursiveDeleteOption: true,
      workGroupConfiguration: {
        "publishCloudWatchMetricsEnabled": true
      },
    });
    new athena.CfnWorkGroup(this, 'WAFLogAthenaQueryWorkGroup', {
      name: "WAFLogAthenaQueryWorkGroup",
      description: "Athena WorkGroup for WAF log queries used by AWS WAF Security Automations Solution",
      state: "ENABLED",
      recursiveDeleteOption: true,
      workGroupConfiguration: {
        "publishCloudWatchMetricsEnabled": true
      }
    });
    new athena.CfnWorkGroup(this, 'WAFAppAccessLogAthenaQueryWorkGroup', {
      name: "WAFAppAccessLogAthenaQueryWorkGroup",
      description: "Athena WorkGroup for CloudFront or ALB application access log queries used by AWS WAF Security Automations Solution",
      state: "ENABLED",
      recursiveDeleteOption: true,
      workGroupConfiguration: {
        "publishCloudWatchMetricsEnabled": true
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
    const logParserRuleInput = {
      "resourceType": "LambdaAthenaWAFLogParser",
      "glueAccessLogsDatabase": glueAccessLogsDatabase.databaseName,
      "accessLogBucket": accessLogBucket.bucketName,
      "glueWafAccessLogsTable": "waf_access_logs",
      "athenaWorkGroup": "WAFLogAthenaQueryWorkGroup"
    };

    const lambdaAthenaWAFLogParserRule = new events.Rule(this, "lambdaAthenaWAFLogParserRule", {
      description: "Security Automation - WAF Logs Athena parser",
      schedule: events.Schedule.expression('rate(5 minutes)'),
      targets: [new targets.LambdaFunction(logParserLambda, {
        event: events.RuleTargetInput.fromObject(logParserRuleInput)
      })]
    });

  }
}
