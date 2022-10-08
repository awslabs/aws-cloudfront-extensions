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
import * as configStack from "../../../lib/config-version/aws-cloudfront-config-version-stack";
import { CloudFrontConfigVersionStack } from "../../../lib/config-version/aws-cloudfront-config-version-stack";
import * as commonStack from "../../../lib/cf-common/cf-common-stack";
import {CommonConstruct, CommonProps} from "../../../lib/cf-common/cf-common-stack";
import * as appsync from "@aws-cdk/aws-appsync-alpha";
import path from "path";

describe("CloudFrontExtensionConfigVersionStack", () => {
  test("Test Config Version stack create successfully", () => {
    const app = new App();
    // WHEN

    const appStack = new Stack(app, "appStack", {});
    // Creates the AppSync API
    const appsyncApi = new appsync.GraphqlApi(appStack, "appsyncApi", {
      name: "cloudfront-extension-appsync-api",
      schema: appsync.Schema.fromAsset(
        path.join(__dirname, "../../../graphql/schema.graphql")
      ),
      // authorizationConfig: config,
      logConfig: {
        fieldLogLevel: appsync.FieldLogLevel.ALL,
        excludeVerboseContent: true,
      },
    });

    const stack = new configStack.CloudFrontConfigVersionStack(
      app,
      "MyConfigVersionStack",
      {
        appsyncApi: appsyncApi,
      }
    );

    // Prepare the stack for assertions.
    const template = Template.fromStack(stack);

    // THEN
    template.hasResourceProperties("AWS::S3::Bucket", {});

    template.hasResourceProperties("AWS::DynamoDB::Table", {
      KeySchema: [
        {
          AttributeName: "distributionId",
          KeyType: "HASH",
        },
      ],
      AttributeDefinitions: [
        {
          AttributeName: "distributionId",
          AttributeType: "S",
        },
      ],
    });


  });

  test("Test Config Version stack failure case", () => {
    // WHEN
    const t = () => {
      const app = new App();
      //  test props failure case
      const failureStack = new configStack.CloudFrontConfigVersionStack(
          app,
          "MyConfigVersionStack",
          {}
      );
    };
    expect(t).toThrow(Error);
  });

});
