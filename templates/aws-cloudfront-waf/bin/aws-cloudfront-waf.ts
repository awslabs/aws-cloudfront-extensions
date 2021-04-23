#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AwsCloudfrontWafStack } from '../lib/aws-cloudfront-waf-main';
import { BootstraplessStackSynthesizer } from 'cdk-bootstrapless-synthesizer';

const app = new cdk.App();
new AwsCloudfrontWafStack(app, 'AwsCloudfrontWafStack', {synthesizer: newSynthesizer()});
app.synth()

function newSynthesizer() {
    return process.env.USE_BSS ? new BootstraplessStackSynthesizer(): undefined;
}