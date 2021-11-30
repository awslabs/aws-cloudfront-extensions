import { App } from '@aws-cdk/core';
import { CloudFrontMonitoringStack } from '../lib/aws-cloudfront-monitoring-stack';
import { BootstraplessStackSynthesizer } from 'cdk-bootstrapless-synthesizer';


const app = new App();

new CloudFrontMonitoringStack(app, 'CloudFrontMonitoringStack', {
    tags: {
        app: 'CloudFrontMonitoring',
    },
    synthesizer: newSynthesizer(),
    }
);

app.synth();

function newSynthesizer() {
    return process.env.USE_BSS ? new BootstraplessStackSynthesizer(): undefined;
}
