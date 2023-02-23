import * as appsync from "@aws-cdk/aws-appsync-alpha";
import * as cdk from "aws-cdk-lib";
import { App, Stack } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import path from "path";
import * as repo from '../../../lib/repo/repo-stack';

let stack: cdk.Stack;
let template: Template;

beforeAll(() => {
  stack = new cdk.Stack();
  const appsyncApi = new appsync.GraphqlApi(stack, "appsyncApi", {
    name: "cloudfront-extension-appsync-api",
    schema: appsync.Schema.fromAsset(
      path.join(__dirname, "../../../graphql/schema.graphql")
    ),
    logConfig: {
      fieldLogLevel: appsync.FieldLogLevel.ALL,
      excludeVerboseContent: true,
    },
  });
  new repo.RepoConstruct(stack, "RepoTest", {
    appsyncApi: appsyncApi,
  });
  template = Template.fromStack(stack);
});


describe("RepoTest", () => {
  test("Test repo stack create successfully", () => {
    template.hasResourceProperties("AWS::DynamoDB::Table", {
      KeySchema: [
        {
          AttributeName: "name",
          KeyType: "HASH",
        },
      ],
    });
  });

  test("Test repo stack create failed if props is not set", () => {
    const t = () => {
      const app = new App();
      new repo.RepoStack(
        stack,
        "RepoStackTestWithFailure",
        {}
      );
    };
    expect(t).toThrow(Error);
  });

});


