/*
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { Template } from "aws-cdk-lib/assertions";
import { App, aws_cognito as cognito, Stack } from "aws-cdk-lib";
import * as commonStack from "../../../lib/cf-common/cf-common-stack";
import { CommonStack } from "../../../lib/cf-common/cf-common-stack";

describe("CloudFrontExtensionCommonStack", () => {
  test("Test Common stack", () => {
    const app = new App();
    // WHEN
    const cognitoStack = new Stack(app, "Cognito", {});

    const cognitoUserPool = new cognito.UserPool(
      cognitoStack,
      "CloudFrontExtCognito",
      {
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
          },
        },
      }
    );

    const cognitoUserPoolClient = cognitoUserPool.addClient(
      "CloudFrontExtn_WebPortal"
    );

    const stack = new commonStack.CommonStack(app, "CommonStack", {
      sslForSaasOnly: true,
      cognitoUserPool: cognitoUserPool,
      cognitoClient: cognitoUserPoolClient,
    });

    // Prepare the stack for assertions.
    const commontemplate = Template.fromStack(stack);

    // THEN
    commontemplate.hasResourceProperties("AWS::AppSync::GraphQLApi", {});
  });
});
