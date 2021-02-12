import { expect as expectCDK, matchTemplate, MatchStyle, haveResource } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as WorkshopDemo from '../lib/workshop-demo-stack';

test('Check stack resources', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new WorkshopDemo.WorkshopDemoStack(app, 'WorkshopDemoStack');
    // THEN
    expectCDK(stack).to(haveResource("AWS::S3::Bucket"))
    expectCDK(stack).to(haveResource("AWS::CloudFront::Distribution"))
});
