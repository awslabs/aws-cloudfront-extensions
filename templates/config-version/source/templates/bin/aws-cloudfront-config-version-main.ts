import { App } from 'aws-cdk-lib';
import { CloudFrontConfigVersionStack } from '../lib/aws-cloudfront-config-version-stack';
import { BootstraplessStackSynthesizer } from 'cdk-bootstrapless-synthesizer';


const app = new App();

new CloudFrontConfigVersionStack(app, 'CloudFrontConfigVersionStack', {
    tags: {
        app: 'CloudFrontConfigVersion',
    },
    synthesizer: newSynthesizer(),
    }
);

app.synth();

function newSynthesizer() {
    return process.env.USE_BSS ? new BootstraplessStackSynthesizer(): undefined;
}
