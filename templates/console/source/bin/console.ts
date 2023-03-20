#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { BootstraplessStackSynthesizer, CompositeECRRepositoryAspect } from "cdk-bootstrapless-synthesizer";
import { ConsoleStack } from "../lib/console-stack";
import { Aspects } from "aws-cdk-lib";

const app = new cdk.App();

new ConsoleStack(app, "CloudFrontExtnConsoleStack", {
    tags: {
        app: "CloudFrontExtnConsoleStack",
    },
    synthesizer: newSynthesizer()
});

// below lines are required if your application has Docker assets
if (process.env.USE_BSS) {
    Aspects.of(app).add(new CompositeECRRepositoryAspect());
}

function newSynthesizer() {
    return process.env.USE_BSS ? new BootstraplessStackSynthesizer() : undefined;
}

app.synth();




