#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { ConsoleStack } from '../lib/console-stack';
import { BootstraplessStackSynthesizer } from 'cdk-bootstrapless-synthesizer';

const app = new cdk.App();
new ConsoleStack(app, 'ConsoleStack', {
  tags: {
    app: 'CloudFrontExtensionsConsole',
  },
  synthesizer: newSynthesizer(),
}
);

app.synth();

function newSynthesizer() {
  return process.env.USE_BSS ? new BootstraplessStackSynthesizer() : undefined;
}
