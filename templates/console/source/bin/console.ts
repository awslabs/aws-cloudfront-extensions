#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { BootstraplessStackSynthesizer } from "cdk-bootstrapless-synthesizer";
import {RootStack} from "../lib/root-stack";


const app = new cdk.App();

new RootStack(app, "CloudFrontExtnConsoleStack", {
    tags: {
        app: "CloudFrontExtnConsoleStack",
    },
    synthesizer: newSynthesizer()
});

app.synth();

function newSynthesizer() {
  return process.env.USE_BSS ? new BootstraplessStackSynthesizer() : undefined;
}
