import { App } from '@aws-cdk/core';
import { CloudFrontMonitoringStack } from '../lib/aws-cloudfront-monitoring-stack';

const app = new App();

new CloudFrontMonitoringStack(app, 'CloudFrontMonitoringStack', {
    tags: {
        app: 'CloudFrontMonitoring',
    },
});
