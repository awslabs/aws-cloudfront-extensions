import * as cdk from "aws-cdk-lib";
import {Construct} from "constructs";
import {StackProps} from "aws-cdk-lib";
import {CommonConstruct} from "./cf-common/cf-common-stack";
import {CloudFrontConfigVersionConstruct} from "./config-version/aws-cloudfront-config-version-stack";
import {StepFunctionRpTsConstruct} from "./ssl-for-saas/step_function_rp_ts-stack";

export class SSLForSaasStack extends cdk.Stack {

    constructor(app: Construct, id: string, props: StackProps) {
        super(app, id, props);
        this.templateOptions.description = "(SO8152-ssl) CloudFront Extensions - SSL";

        // Main stack with shared components
        const commonConstruct = new CommonConstruct(this, `CfCommonConstruct`, {
            sslForSaasOnly: true
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
    }
}