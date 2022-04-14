#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import 'source-map-support/register';
import { PrewarmStack } from './prewarm-ext';

const app = new cdk.App();
new PrewarmStack(app, 'PrewarmStack', {});

app.synth();

