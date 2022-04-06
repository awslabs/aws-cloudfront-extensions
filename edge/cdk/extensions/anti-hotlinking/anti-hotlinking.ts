#!/usr/bin/env node
import * as cf from '@aws-cdk/aws-cloudfront';
import * as origins from '@aws-cdk/aws-cloudfront-origins';
import * as cdk from '@aws-cdk/core';
import 'source-map-support/register';
import { AntiHotlinking } from './anti-hotlinking-ext';

const app = new cdk.App();
const stack = new cdk.Stack(app, 'ext-demo');

const referAllowList = new cdk.CfnParameter(stack, 'referAllowList', {
  description: 'Referer allow list, use comma to separate multiple referer, it supports wild card(* and ?). Example: example.com, exa?ple.*',
  type: 'String',
})

const antiHotlinking = new AntiHotlinking(stack, 'AntiHotlink', {
  referer: referAllowList.valueAsString,
});

// Create the cloudfront distribution with extension
const dist = new cf.Distribution(stack, 'dist', {
  defaultBehavior: {
    origin: new origins.HttpOrigin('aws.amazon.com'),
    edgeLambdas: [
      antiHotlinking,
    ],
  },
});

const hotlinkingDist = new cf.Distribution(stack, 'hotlinkingDist', {
  defaultBehavior: {
    origin: new origins.HttpOrigin('aws.amazon.com'),
    edgeLambdas: [
      antiHotlinking,
    ],
  },
});

new cdk.CfnOutput(stack, 'distributionDomainName', {
  value: dist.distributionDomainName,
});

app.synth();
