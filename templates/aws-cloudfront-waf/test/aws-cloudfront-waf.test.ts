import { expect as expectCDK, matchTemplate, MatchStyle, haveResource } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as AwsCloudfrontWaf from '../lib/aws-cloudfront-waf-stack';

test('Key resources were created in Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new AwsCloudfrontWaf.AwsCloudfrontWafStack(app, 'AwsCloudfrontWafStack');
    // THEN
    expectCDK(stack).to(haveResource("AWS::S3::Bucket"))
    expectCDK(stack).to(haveResource("AWS::CloudFront::Distribution"))
    expectCDK(stack).to(haveResource("AWS::WAFv2::WebACL"))
    
});
