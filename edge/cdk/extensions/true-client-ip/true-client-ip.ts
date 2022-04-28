#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { BootstraplessStackSynthesizer } from 'cdk-bootstrapless-synthesizer';
import 'source-map-support/register';
import { TrueClientIpStack } from './true-client-ip-ext';


const app = new cdk.App();
new TrueClientIpStack(app, 'ClientIP', {
    synthesizer: bssSynth(),
});

app.synth();

function bssSynth() {
    return process.env.USE_BSS ? new BootstraplessStackSynthesizer() : undefined;
}
