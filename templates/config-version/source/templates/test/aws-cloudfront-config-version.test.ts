import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import {CloudFrontConfigVersionStack} from "../lib/aws-cloudfront-config-version-stack";

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new CloudFrontConfigVersionStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
