import * as cdk from 'aws-cdk-lib';
import { Construct } from "constructs";
import { CommonConstruct } from "./cf-common/cf-common-stack";
import { PortalConstruct } from "./web-portal/web_portal_stack";
import {
    CloudFrontConfigVersionConstruct,
} from "./config-version/aws-cloudfront-config-version-stack";
import * as appsync from "@aws-cdk/aws-appsync-alpha";
import { StepFunctionRpTsConstruct } from "./ssl-for-saas/step_function_rp_ts-stack";
import { RepoConstruct } from "./repo/repo-stack";
import { aws_cognito as cognito, StackProps } from "aws-cdk-lib";
import {AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId} from "aws-cdk-lib/custom-resources";

interface ConsoleStackProps extends StackProps {
    synthesizer: any
}

export class ConsoleStack extends cdk.Stack {

    constructor(app: Construct, id: string, props: ConsoleStackProps) {
        super(app, id, props);
        this.templateOptions.description = "(SO8152-ui) CloudFront Extensions - UI";

        // Construct a cognito for auth
        const cognitoUserPool = new cognito.UserPool(this, "CloudFrontExtCognito", {
            userPoolName: "CloudFrontExtCognito_UserPool",
            selfSignUpEnabled: false,
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
            },
        });

        const consoleAdminUserName = new cdk.CfnParameter(this, "ConsoleAdminUserName", {
            type: "String",
            description: "the default username for the web console"
        })

        const consoleAdminUserEmail = new cdk.CfnParameter(this, "ConsoleAdminEmail", {
            type: "String",
            description: "the default user email for the web console"
        })

        const consoleAdminUserPassword = new cdk.CfnParameter(this, "ConsoleAdminPassword", {
            type: "String",
            description: "the default user password for the web console",
            allowedPattern: "^(?=.*\\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[^\\w\\d\\s:])([^\\s]){8,16}$",
            constraintDescription: "Length 8~16 with space, Must contain 1 uppercase, 1 lowercase, 1 number, 1 non-alpha numeric number, 1 number (0-9)",
            minLength: 8,
            maxLength: 32,
        })

        const user = new cognito.CfnUserPoolUser(this, 'WebConsoleDefaultUser', {
          userPoolId: cognitoUserPool.userPoolId,
          // Properties below are optional
          desiredDeliveryMediums: ['EMAIL'],
          forceAliasCreation: true,
          messageAction: 'SUPPRESS',
          userAttributes: [{
            name: 'email_verified',
            value: 'True',
          }, {
              name: 'email',
              value: consoleAdminUserEmail.valueAsString
          }],
          username: consoleAdminUserName.valueAsString,
        });

        // Force the password for the user, since new users created are in FORCE_PASSWORD_CHANGE status by default, such new user has no way to change it though
        // Refer to API details on https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_AdminSetUserPassword.html
        const adminSetUserPassword = new AwsCustomResource(this, 'AwsCustomResource-ForcePassword', {
            onCreate: {
                service: 'CognitoIdentityServiceProvider',
                action: 'adminSetUserPassword',
                parameters: {
                    UserPoolId: cognitoUserPool.userPoolId,
                    Username: user.username,
                    Password: consoleAdminUserPassword.valueAsString,
                    Permanent: true,
                },
                physicalResourceId: PhysicalResourceId.of(`AwsCustomResource-ForcePassword-${user.username}`),
            },
            policy: AwsCustomResourcePolicy.fromSdkCalls({resources: AwsCustomResourcePolicy.ANY_RESOURCE}),
            installLatestAwsSdk: true,
        });

        const cfnUserPool = cognitoUserPool.node.defaultChild as cognito.CfnUserPool
        cfnUserPool.userPoolAddOns = {
            advancedSecurityMode: 'ENFORCED'
        }

        const cognitoUserPoolClient = cognitoUserPool.addClient('CloudFrontExtn_WebPortal');


        // Main stack with shared components
        const commonConstruct = new CommonConstruct(this, `CfCommonConstruct`, {
            sslForSaasOnly: false,
            cognitoClient: cognitoUserPoolClient,
            cognitoUserPool: cognitoUserPool,
        });

        // const monitoringUrl = cdk.Fn.importValue('monitoringUrl') as string;
        // const monitoringApiKey = cdk.Fn.importValue('monitoringApiKey') as string;

        const webConsole = new PortalConstruct(this, "WebConsole", {
            aws_api_key: commonConstruct?.appsyncApi.apiKey,
            aws_appsync_authenticationType: appsync.AuthorizationType.USER_POOL,
            aws_appsync_graphqlEndpoint: commonConstruct?.appsyncApi.graphqlUrl,
            aws_appsync_region: this.region,
            aws_project_region: this.region,
            aws_user_pools_id: cognitoUserPool.userPoolId,
            aws_user_pools_web_client_id: cognitoUserPoolClient.userPoolClientId,
            aws_cognito_region: this.region,
            // aws_monitoring_url: monitoringUrl,
            // aws_monitoring_api_key: monitoringApiKey,
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

        new RepoConstruct(this, "RepoConstruct", {
            tags: {
                app: "CloudFrontExtensionsRepo",
            },
            synthesizer: props.synthesizer,
            appsyncApi: commonConstruct.appsyncApi,
        });

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
    }
}