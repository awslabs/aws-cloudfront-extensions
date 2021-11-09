import { App } from '@aws-cdk/core';
import { BootstraplessStackSynthesizer } from 'cdk-bootstrapless-synthesizer';
import { CloudFrontMonitoringStack } from '../lib/aws-cloudfront-monitoring-stack';

const app = new App();

new CloudFrontMonitoringStack(app, 'CloudFrontMonitoringStack', {
    synthesizer: newSynthesizer(),
    tags: {
        app: 'CloudFrontMonitoring',
    },

});

app.synth();

function newSynthesizer() {
    return process.env.USE_BSS ? new BootstraplessStackSynthesizer(): undefined;
}
