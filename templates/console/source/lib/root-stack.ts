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
import { RealtimeMonitoringStack } from "./monitoring/realtime-monitoring-stack";
import { NonRealtimeMonitoringStack } from "./monitoring/non-realtime-monitoring-stack";
import { aws_cognito as cognito, StackProps } from "aws-cdk-lib";

interface RootStackProps extends StackProps {
    synthesizer: any
}

export class RootStack extends cdk.Stack {

    constructor(app: Construct, id: string, props: RootStackProps) {
        super(app, id, props);
        this.templateOptions.description = "(SO8152-ui) CloudFront Extensions - UI";

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

        const monitoringUrl = cdk.Fn.importValue('monitoringUrl') as string;
        const monitoringApiKey = cdk.Fn.importValue('monitoringApiKey') as string;

        const webConsole = new PortalConstruct(this, "WebConsole", {
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
            aws_monitoring_stack_name: 'MonitoringStack',
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