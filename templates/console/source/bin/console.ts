#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
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

// TODO: Add SSL for SaaS stack
// new SslStack(app, 'SSLforSaaSStack', {});

// TODO: Add Config version stack
// new ConfigVersionStack(app, 'ConfigVersionStack', {});

// TODO: Add monitoring dashboard stack
// new monitoringDashboardStack(app, 'MonitoringDashboardStack', {});

app.synth();

function newSynthesizer() {
  return process.env.USE_BSS ? new BootstraplessStackSynthesizer() : undefined;
}
