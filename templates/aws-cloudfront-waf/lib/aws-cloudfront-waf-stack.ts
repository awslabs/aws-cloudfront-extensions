import * as waf from '@aws-cdk/aws-wafv2';
import * as cdk from '@aws-cdk/core';
import { StaticSite } from './aws-cloudfront-distribution';
import { AWSCloudfrontWafFirehoseAthena } from './aws-cloudfront-waf-firehose-athena';

export class AwsCloudfrontWafStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new AWSCloudfrontWafFirehoseAthena(this, 'AWSCloudfrontWafFirehoseAthena', {
      deliveryStreamName: 'deliveryStreamName',
      glueDatabaseName: 'glueDatabaseName',
    });

    // Provision a static website
    new StaticSite(this, 'staticWebsite', props);

    // Setup Whitelist IP Set
    const whitelistIpSetV4 = new waf.CfnIPSet(this, 'whitelistIpSetV4', {
      addresses: [],
      ipAddressVersion: 'IPV4',
      scope: 'REGIONAL',
      name: 'WhitelistIpSetV4',
      description: 'Allow whitelist for IPV4 addresses',
    });
    const whitelistIpSetV6 = new waf.CfnIPSet(this, 'whitelistIpSetV6', {
      addresses: [],
      ipAddressVersion: 'IPV6',
      scope: 'REGIONAL',
      name: 'WhitelistIpSetV6',
      description: 'Allow whitelist for IPV6 addresses',
    });

    // Setup Blacklist IP Set
    const blacklistIpSetV4 = new waf.CfnIPSet(this, 'blacklistIpSetV4', {
      addresses: [],
      ipAddressVersion: 'IPV4',
      scope: 'REGIONAL',
      name: 'BlacklistIpSetV4',
      description: 'Allow blacklist for IPV4 addresses',
    });
    const blacklistIpSetV6 = new waf.CfnIPSet(this, 'blacklistIpSetV6', {
      addresses: [],
      ipAddressVersion: 'IPV6',
      scope: 'REGIONAL',
      name: 'BlacklistIpSetV6',
      description: 'Allow blacklist for IPV6 addresses',
    });

    // Setup HTTP Flood IP Set
    const httpFloodIpSetV4 = new waf.CfnIPSet(this, 'httpFloodIpSetV4', {
      addresses: [],
      ipAddressVersion: 'IPV4',
      scope: 'REGIONAL',
      name: 'HttpFloodIpSetV4',
      description: 'Block HTTP Flood IPV4 addresses',
    });
    const httpFloodIpSetV6 = new waf.CfnIPSet(this, 'httpFloodIpSetV6', {
      addresses: [],
      ipAddressVersion: 'IPV6',
      scope: 'REGIONAL',
      name: 'HttpFloodIpSetV6',
      description: 'Block HTTP Flood IPV6 addresses',
    });

    // Block Scanners/Probes IP Set
    const scannersProbesIpSetV4 = new waf.CfnIPSet(this, 'scannersProbesIpSetV4', {
      addresses: [],
      ipAddressVersion: 'IPV4',
      scope: 'REGIONAL',
      name: 'ScannersProbesIpSetV4',
      description: 'Block Scanners/Probes IPV4 addresses',
    });
    const scannersProbesIpSetV6 = new waf.CfnIPSet(this, 'scannersProbesIpSetV6', {
      addresses: [],
      ipAddressVersion: 'IPV6',
      scope: 'REGIONAL',
      name: 'ScannersProbesIpSetV6',
      description: 'Block Scanners/Probes IPV6 addresses',
    });

    // Block Reputation List IP Set
    const reputationListsIpSetV4 = new waf.CfnIPSet(this, 'reputationListsIpSetV4', {
      addresses: [],
      ipAddressVersion: 'IPV4',
      scope: 'REGIONAL',
      name: 'ReputationListsIpSetV4',
      description: 'Block Reputation List IPV4 addresses',
    });
    const reputationListsIpSetV6 = new waf.CfnIPSet(this, 'reputationListsIpSetV6', {
      addresses: [],
      ipAddressVersion: 'IPV6',
      scope: 'REGIONAL',
      name: 'ReputationListsIpSetV6',
      description: 'Block Reputation List IPV6 addresses',
    });

    // Block Bad Bot IP Set
    const badBotIpSetV4 = new waf.CfnIPSet(this, 'badBotIpSetV4', {
      addresses: [],
      ipAddressVersion: 'IPV4',
      scope: 'REGIONAL',
      name: 'BadBotIpSetV4',
      description: 'Block Bad Bot IPV4 addresses',
    });
    const badBotIpSetV6 = new waf.CfnIPSet(this, 'badBotIpSetV6', {
      addresses: [],
      ipAddressVersion: 'IPV6',
      scope: 'REGIONAL',
      name: 'BadBotIpSetV6',
      description: 'Block Bad Bot IPV6 addresses',
    });


    const wafweb = new waf.CfnWebACL(this, 'wafweb', {
      name: 'CloudFront-Web-WAF',
      description: 'Custom WAFWebACL',
      defaultAction: {
        allow: {},
      },
      scope: 'REGIONAL',
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
          name: 'AWS-WhitelistRule',
          priority: 1,
          action: {
            allow: {},
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'AWS-WhitelistRule',
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
          name: 'AWS-BlacklistRule',
          priority: 2,
          action: {
            block: {},
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'AWS-BlacklistRule',
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
          name: 'AWS-HttpFloodRegularRule',
          priority: 3,
          action: {
            block: {},
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'AWS-HttpFloodRegularRule',
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
          name: 'AWS-HttpFloodRateBasedRule',
          priority: 4,
          action: {
            block: {},
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'AWS-HttpFloodRateBasedRule',
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
          name: 'AWS-IPReputationListsRule',
          priority: 5,
          action: {
            block: {},
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'AWS-IPReputationListsRule',
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
          name: 'AWS-BadBotRule',
          priority: 6,
          action: {
            block: {},
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'AWS-BadBotRule',
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
          name: 'AWS-SqlInjectionRule',
          priority: 20,
          action: {
            block: {},
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'AWS-SqlInjectionRule',
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
          name: 'AWS-XssRule',
          priority: 30,
          action: {
            block: {},
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'AWS-XssRule',
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

  }
}
