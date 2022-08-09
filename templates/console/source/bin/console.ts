#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { BootstraplessStackSynthesizer, CompositeECRRepositoryAspect } from "cdk-bootstrapless-synthesizer";
import { RootStack } from "../lib/root-stack";
import { Aspects } from "aws-cdk-lib";
import { MonitoringStack } from "../lib/monitoring/root-monitoring-stack";


const app = new cdk.App();

new MonitoringStack(app, "MonitoringStack", {
    tags: {
        app: "MonitoringStack",
    },
    synthesizer: newSynthesizer()
});

new RootStack(app, "CloudFrontExtnConsoleStack", {
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




