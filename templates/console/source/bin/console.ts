#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { ConsoleStack } from "../lib/console-stack";
import { BootstraplessStackSynthesizer } from "cdk-bootstrapless-synthesizer";
import { CloudFrontConfigVersionStack } from "../lib/config-version/aws-cloudfront-config-version-stack";
import { StepFunctionRpTsStack } from "../lib/ssl-for-saas/step_function_rp_ts-stack";
import { CommonStack } from "../lib/cf-common/cf-common-stack";
import {WebPortalStack} from "../lib/web-portal/web_portal_stack";


const app = new cdk.App();

// Main stack with shared components
const commonStack = new CommonStack(app, `cf-common-stack`);

new WebPortalStack(
    app,
    `WebPortalStack`, {
        tags: {
            app: 'WebPortal',
        },
        synthesizer: newSynthesizer(),
        appsyncApi: commonStack.appsyncApi,
        cognitoUserPool: commonStack.cognitoUserPool,
        cognitoClient: commonStack.cognitoUserPoolClient
    }
);

// Config version stack
const configVersionStack = new CloudFrontConfigVersionStack(
  app,
  "CloudFrontConfigVersionStack",
  {
    tags: {
      app: "CloudFrontConfigVersion",
    },
    synthesizer: newSynthesizer(),
    appsyncApi: commonStack.appsyncApi,
    cognitoUserPool: commonStack.cognitoUserPool,
    cognitoClient: commonStack.cognitoUserPoolClient
  }
);

// SSL for SaaS stack
new StepFunctionRpTsStack(app, "StepFunctionRpTsStack", {
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
  synthesizer: newSynthesizer(),
  appsyncApi: commonStack.appsyncApi,
  cognitoUserPool: commonStack.cognitoUserPool,
  cognitoClient: commonStack.cognitoUserPoolClient
  // configVersion_ddb_table_name: cdk.Fn.importValue('configVersionDDBTableName')
});

new ConsoleStack(app, "ConsoleStack", {
  tags: {
    app: "CloudFrontExtensionsConsole",
  },
  synthesizer: newSynthesizer(),
  appsyncApi: commonStack.appsyncApi,
  cognitoUserPool: commonStack.cognitoUserPool,
  cognitoClient: commonStack.cognitoUserPoolClient
});

// TODO: Add monitoring dashboard stack
// new monitoringDashboardStack(app, 'MonitoringDashboardStack', {});

app.synth();

function newSynthesizer() {
  return process.env.USE_BSS ? new BootstraplessStackSynthesizer() : undefined;
}
