import * as cdk from 'aws-cdk-lib';
import { CfnParameter, CfnStack, Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
    EndpointType,
    LambdaRestApi,
    RequestValidator
} from "aws-cdk-lib/aws-apigateway";
import { CommonProps } from '../cf-common/cf-common-stack';
import { RealtimeMonitoringStack } from './realtime-monitoring-stack';
import { NonRealtimeMonitoringStack } from './non-realtime-monitoring-stack';

export class MonitoringStack extends Stack {

    constructor(scope: Construct, id: string, props?: CommonProps) {
        super(scope, id, props);

        const nonRealTimeMonitoring = new CfnParameter(this, 'NonRealTimeMonitoring', {
            description: 'Set it to true to get monitoring metrics by analyzing CloudFront standard log, set it to false to get the metrics by analyzing CloudFront real-time log.',
            type: 'String',
            allowedValues: ['true', 'false'],
            default: 'true',
        })

        const nonRealTimeMonitoringCondition = new cdk.CfnCondition(
            this,
            'NonRealTimeMonitoringCondition',
            {
                expression: cdk.Fn.conditionEquals(nonRealTimeMonitoring, 'true')
            }
        )

        const realtimeMonitoringCondition = new cdk.CfnCondition(
            this,
            'RealTimeMonitoringCondition',
            {
                expression: cdk.Fn.conditionEquals(nonRealTimeMonitoring, 'false')
            }
        )

        // RealtimeMonitoring
        const realtimeMonitoring = new RealtimeMonitoringStack(this, 'Realtime', {});
        (realtimeMonitoring.nestedStackResource as CfnStack).cfnOptions.condition = realtimeMonitoringCondition;

        // Non-RealtimeMonitoring
        const nonRealtimeMonitoring = new NonRealtimeMonitoringStack(this, 'NonRealtime', {});
        (nonRealtimeMonitoring.nestedStackResource as CfnStack).cfnOptions.condition = nonRealTimeMonitoringCondition;

    }
}
