#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { WorkshopDemoStack } from '../lib/workshop-demo-stack';

const app = new cdk.App();
new WorkshopDemoStack(app, 'WorkshopDemoStack');

app.synth();
