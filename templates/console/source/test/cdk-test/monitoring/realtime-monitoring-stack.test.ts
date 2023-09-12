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

import { App, aws_s3, Stack } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import * as monitoringStack from "../../../lib/monitoring/realtime-monitoring-stack";

describe("NonRealtimeMonitoringStack", () => {
  test("Test Non Realtime Monitoring Stack create successfully", () => {
    const app = new App();
    // WHEN

    const appStack = new Stack(app, "MonitoringStack", {});
    const testBucket = new aws_s3.Bucket(appStack, "testBucket", {
      objectOwnership: ObjectOwnership.OBJECT_WRITER
    });
    const stack = new monitoringStack.RealtimeMonitoringStack(
      appStack,
      "TestRealtimeMonitoringStack",
      {
        nonRealTimeMonitoring: '5',
        domainList: 'ALL',
        monitoringInterval: '5',
        logKeepingDays: 120,
        deleteLogNonRealtime: 'false',
        useStartTimeNonRealtime: 'false',
        shardCount: 50,
        portalBucket: testBucket,
      }
    );
    const template = Template.fromStack(stack);
    template.resourceCountIs("AWS::S3::Bucket", 2);
    template.resourceCountIs("AWS::DynamoDB::Table", 1);
    template.resourceCountIs("AWS::Glue::Database", 1);
    template.resourceCountIs("AWS::Glue::Table", 1);
    template.resourceCountIs("AWS::ApiGateway::RestApi", 1);

  });

});
