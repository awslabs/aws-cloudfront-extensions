#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { BootstraplessStackSynthesizer } from 'cdk-bootstrapless-synthesizer';
import 'source-map-support/register';
import { CfLogStack } from './cf-monitoring-standard-ext';


const app = new cdk.App();
new CfLogStack(app, 'CfLogStack', {
    synthesizer: bssSynth(),
});

app.synth();

function bssSynth() {
    return process.env.USE_BSS ? new BootstraplessStackSynthesizer() : undefined;
}
