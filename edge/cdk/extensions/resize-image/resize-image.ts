#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { BootstraplessStackSynthesizer } from 'cdk-bootstrapless-synthesizer';
import 'source-map-support/register';
import { ResizeImageStack } from './resize-image-ext';


const app = new cdk.App();
new ResizeImageStack(app, 'ResizeImageStack', {
    synthesizer: bssSynth(),
});

app.synth();

function bssSynth() {
    return process.env.USE_BSS ? new BootstraplessStackSynthesizer(): undefined;
}
