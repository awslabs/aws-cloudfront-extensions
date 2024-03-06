import * as cdk from 'aws-cdk-lib/core';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';

export interface WafDeployConstructProps {
    ipSetNumber: number,
    distributionId: string,
}

export class WafCloudFrontStack extends Construct {

    public readonly waf;
    public readonly ipSets;
    public readonly cfArn;

    constructor(scope: Construct, id: string, props: WafDeployConstructProps) {
        super(scope, id);
        const accountID = cdk.Stack.of(this).account;
        const ipSetCount = 10; 
        //const ipSetCount = props.ipSetNumber;
        // Create IpSet and rules
        let blockRules = []
        let ipSetInfo = []
        for(let i=0;i<ipSetCount; i++) {
            const ipSet = new wafv2.CfnIPSet(this, 'IPSet-'+i, {
                name: 'BlockIPSet_'+i,
                description: 'An example IP set',
                ipAddressVersion: 'IPV4',
                addresses: [],
                scope: 'CLOUDFRONT' 
              });    
            const rule = {
                name: 'BlockIPSet_'+i,
                priority: i,
                action: { block: {} },
                statement: { ipSetReferenceStatement: { arn: ipSet.attrArn } },
                visibilityConfig: {
                  cloudWatchMetricsEnabled: true,
                  metricName: 'block-ip-set-metric',
                  sampledRequestsEnabled: true
                }
              }
              blockRules.push(rule);
              ipSetInfo.push({name:  ipSet.name, set: ipSet.attrId})
        }
        this.ipSets = ipSetInfo;
        blockRules.push
        // Create the WebACL
        const webAcl = new wafv2.CfnWebACL(this, 'WebACL-Rate-Limit', {
            defaultAction: {
                allow: {}
            },
            scope: 'CLOUDFRONT',
            visibilityConfig: {
                sampledRequestsEnabled: true,
                cloudWatchMetricsEnabled: true,
                metricName: 'cloudfrontWebACLMetric'
            },
            rules: blockRules,
        });
        this.waf = webAcl;
        const CloudfrontArn = `arn:aws:cloudfront::${accountID}:distribution/${props.distributionId}`;
        this.cfArn = CloudfrontArn;
        
        // Associate the WebACL to the CloudFront distribution
        // For Amazon CloudFront, don't use this call. 
        // Instead, use your CloudFront distribution configuration. 
        // To associate a web ACL, in the CloudFront call UpdateDistribution, set the web ACL ID to the Amazon Resource Name (ARN) of the web ACL. 
        
        // Bullshit API design, waste me 2 hours for debug.
        // refer: https://docs.aws.amazon.com/waf/latest/APIReference/API_AssociateWebACL.html
        
        // new wafv2.CfnWebACLAssociation(this, 'WebACLAssociation-Rate-Limit', {
        //     webAclArn: webAcl.attrArn,
        //     resourceArn: CloudfrontArn
        // });
    }

}
