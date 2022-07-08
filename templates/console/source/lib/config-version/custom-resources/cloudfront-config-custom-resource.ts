import cdk = require("aws-cdk-lib");
import customResources = require("aws-cdk-lib/custom-resources");
import lambda = require("aws-cdk-lib/aws-lambda");
import { aws_iam as iam } from "aws-cdk-lib";
import { Construct } from "constructs";

import fs = require("fs");
import path from "path";

export interface MyCustomResourceProps {
  message: string;
  DDB_VERSION_TABLE_NAME: string;
  DDB_LATESTVERSION_TABLE_NAME: string;
  DDB_SNAPSHOT_TABLE_NAME: string;
  S3_BUCKET: string;
  roleArn: string;
}

export class MyCustomResource extends Construct {
  public readonly response: string;

  constructor(scope: Construct, id: string, props: MyCustomResourceProps) {
    super(scope, id);
    const DDB_VERSION_TABLE_NAME = props.DDB_VERSION_TABLE_NAME;
    const DDB_LATESTVERSION_TABLE_NAME = props.DDB_LATESTVERSION_TABLE_NAME;
    const DDB_SNAPSHOT_TABLE_NAME = props.DDB_SNAPSHOT_TABLE_NAME;
    const S3_BUCKET = props.S3_BUCKET;
    const roleArn = props.roleArn;

    const fn = new lambda.SingletonFunction(this, "Singleton", {
      uuid: "f7d4f730-4ee1-11e8-9c2d-fa7ae01bbebc",
      code: lambda.Code.fromAsset(
        path.join(__dirname, "../../../lambda/config-version/custom-resources")
      ),
      handler: "custom-resource-handler.main",
      timeout: cdk.Duration.seconds(60),
      runtime: lambda.Runtime.PYTHON_3_9,
      role: iam.Role.fromRoleArn(this, "custom-resource-handler-role", roleArn),
    });

    fn.addEnvironment("DDB_VERSION_TABLE_NAME", DDB_VERSION_TABLE_NAME);
    fn.addEnvironment(
      "DDB_LATESTVERSION_TABLE_NAME",
      DDB_LATESTVERSION_TABLE_NAME
    );
    fn.addEnvironment("DDB_SNAPSHOT_TABLE_NAME", DDB_SNAPSHOT_TABLE_NAME);
    fn.addEnvironment("S3_BUCKET", S3_BUCKET);

    const provider = new customResources.Provider(this, "Provider", {
      onEventHandler: fn,
    });

    const resource = new cdk.CustomResource(this, "Resource", {
      serviceToken: provider.serviceToken,
      properties: props,
    });

    this.response = resource.getAtt("Response").toString();
  }
}
