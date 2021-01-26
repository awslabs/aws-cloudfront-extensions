#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AwsCloudfrontWafStack } from '../lib/aws-cloudfront-waf-main';

const app = new cdk.App();
new AwsCloudfrontWafStack(app, 'AwsCloudfrontWafStack');
app.synth()
