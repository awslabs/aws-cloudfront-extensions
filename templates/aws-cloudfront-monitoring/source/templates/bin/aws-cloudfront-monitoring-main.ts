import { App } from '@aws-cdk/core';
import { BootstraplessStackSynthesizer } from 'cdk-bootstrapless-synthesizer';
import { CloudFrontMonitoringStack } from '../lib/aws-cloudfront-monitoring-stack';

const app = new App();

const vpcId = app.node.tryGetContext('vpcId');
const env = vpcId ? {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
} : undefined;

new CloudFrontMonitoringStack(app, 'CloudFrontMonitoringStack', {
    env: env,
    synthesizer: newSynthesizer(),
    tags: {
        app: 'CloudFrontMonitoring',
    },

});

app.synth();

function newSynthesizer() {
    return process.env.USE_BSS ? new BootstraplessStackSynthesizer(): undefined;
}
