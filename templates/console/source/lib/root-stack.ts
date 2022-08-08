import * as cdk from 'aws-cdk-lib';
import { Construct } from "constructs";
import { CommonConstruct } from "./cf-common/cf-common-stack";
import { PortalConstruct } from "./web-portal/web_portal_stack";
import {
    CloudFrontConfigVersionConstruct,
} from "./config-version/aws-cloudfront-config-version-stack";
import * as appsync from "@aws-cdk/aws-appsync-alpha";
import { StepFunctionRpTsConstruct } from "./ssl-for-saas/step_function_rp_ts-stack";
import { ConsoleConstruct } from "./console-stack";
import { CloudFrontMonitoringStack } from "./monitoring/realtime-monitoring-stack";
import { aws_cognito as cognito, StackProps } from "aws-cdk-lib";

interface RootStackProps extends StackProps {
    synthesizer: any
}

export class RootStack extends cdk.Stack {

    constructor(app: Construct, id: string, props: RootStackProps) {
        super(app, id, props);
        this.templateOptions.description = "(SO8152-ui) CloudFront Extensions - UI";

        const nonRealTimeMonitoring = new cdk.CfnParameter(this, 'NonRealTimeMonitoring', {
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

        // construct a cognito for auth
        const cognitoUserPool = new cognito.UserPool(this, "CloudFrontExtCognito", {
            userPoolName: "CloudFrontExtCognito_UserPool",
            selfSignUpEnabled: true,
            autoVerify: {
                email: true,
            },
            signInAliases: {
                username: true,
                email: true,
            },
            standardAttributes: {
                email: {
                    required: true,
                    mutable: false,
                }
            }
        });

        const cognitoUserPoolClient = cognitoUserPool.addClient('CloudFrontExtn_WebPortal');


        // Main stack with shared components
        const commonConstruct = new CommonConstruct(this, `CfCommonConstruct`, {
            sslForSaasOnly: false,
            cognitoClient: cognitoUserPoolClient,
            cognitoUserPool: cognitoUserPool,
        });

        // Monitoring API
        const realtimeMonitoring = new CloudFrontMonitoringStack(this, 'Realtime', {});
        (realtimeMonitoring.nestedStackResource as cdk.CfnStack).cfnOptions.condition = realtimeMonitoringCondition;

        const nonRealtimeMonitoring = new CloudFrontMonitoringStack(this, 'NonRealtime', {});
        (realtimeMonitoring.nestedStackResource as cdk.CfnStack).cfnOptions.condition = nonRealTimeMonitoringCondition;

        const monitoringUrl = (cdk.Fn.conditionIf(realtimeMonitoringCondition.logicalId, realtimeMonitoring.monitoringUrl, nonRealtimeMonitoring.monitoringUrl) as unknown) as string;
        const monitoringApiKey = (cdk.Fn.conditionIf(realtimeMonitoringCondition.logicalId, realtimeMonitoring.monitoringUrl, nonRealtimeMonitoring.monitoringUrl) as unknown) as string;

        new PortalConstruct(this, "WebConsole", {
            aws_api_key: commonConstruct?.appsyncApi.apiKey,
            aws_appsync_authenticationType: appsync.AuthorizationType.USER_POOL,
            aws_appsync_graphqlEndpoint: commonConstruct?.appsyncApi.graphqlUrl,
            aws_appsync_region: this.region,
            aws_project_region: this.region,
            aws_user_pools_id: cognitoUserPool.userPoolId,
            aws_user_pools_web_client_id: cognitoUserPoolClient.userPoolClientId,
            aws_cognito_region: this.region,
            aws_monitoring_url: monitoringUrl,
            aws_monitoring_api_key: monitoringApiKey,
            build_time: new Date().getTime() + "",
        });

        // Config version stack
        const configVersion = new CloudFrontConfigVersionConstruct(
            this,
            "CloudFrontConfigVersionConstruct",
            {
                tags: {
                    app: "CloudFrontConfigVersion",
                },
                synthesizer: props.synthesizer,
                appsyncApi: commonConstruct.appsyncApi,
            }
        );

        // SSL for SaaS stack
        new StepFunctionRpTsConstruct(this, "StepFunctionRpTsConstruct", {
            /* If you don't specify 'env', this stack will be environment-agnostic.
             * Account/Region-dependent features and context lookups will not work,
             * but a single synthesized template can be deployed anywhere. */

            /* Uncomment the next line to specialize this stack for the AWS Account
             * and Region that are implied by the current CLI configuration. */
            // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

            /* Uncomment the next line if you know exactly what Account and Region you
             * want to deploy the stack to. */
            // env: { account: '123456789012', region: 'us-east-1' },

            /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
            synthesizer: props.synthesizer,
            appsyncApi: commonConstruct.appsyncApi,
            configVersionDDBTableName: configVersion.configVersionDDBTableName,
        });

        new ConsoleConstruct(this, "ConsoleConstruct", {
            tags: {
                app: "CloudFrontExtensionsConsole",
            },
            synthesizer: props.synthesizer,
            appsyncApi: commonConstruct.appsyncApi,
        });

    }
}