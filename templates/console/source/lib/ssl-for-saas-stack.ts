import * as cdk from 'aws-cdk-lib';
import {NestedStackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {StepFunctionRpTsConstruct} from "./ssl-for-saas/step_function_rp_ts-stack";
import * as appsync from "@aws-cdk/aws-appsync-alpha";
import {IStackSynthesizer} from "aws-cdk-lib/core/lib/stack-synthesizers";

export interface SslForSaasProps extends  NestedStackProps {
    appsyncApi?: appsync.GraphqlApi;
    configVersionDDBTableName: string;
    synthesizer: IStackSynthesizer;
}

export class SslForSaasNestedStack extends cdk.NestedStack {

    constructor(scope: Construct, id: string, props: SslForSaasProps) {
        super(scope, id, props);

        // SSL for SaaS stack
        new StepFunctionRpTsConstruct(scope, "StepFunctionRpTsConstruct", {
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
            appsyncApi: props.appsyncApi,
            configVersionDDBTableName: props.configVersionDDBTableName,
        });
    }
}