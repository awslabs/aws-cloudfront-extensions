#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { BootstraplessStackSynthesizer } from 'cdk-bootstrapless-synthesizer';
import 'source-map-support/register';
import { PrewarmStack } from './prewarm-ext';


const app = new cdk.App();
new PrewarmStack(app, 'PrewarmStack', {
    synthesizer: new BootstraplessStackSynthesizer(),
});

app.synth();

