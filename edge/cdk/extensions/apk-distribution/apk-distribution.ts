#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { BootstraplessStackSynthesizer } from 'cdk-bootstrapless-synthesizer';
import 'source-map-support/register';
import { ApkDistributionStack } from './apk-distribution-ext';


const app = new cdk.App();
new ApkDistributionStack(app, 'ApkDistributionStack', {
    synthesizer: bssSynth(),
});

app.synth();

function bssSynth() {
    return process.env.USE_BSS ? new BootstraplessStackSynthesizer() : undefined;
}
