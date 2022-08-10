import * as path from "path";
import {Aws, aws_lambda as lambda, StackProps} from "aws-cdk-lib";
import { LayerVersion } from "aws-cdk-lib/aws-lambda";
import * as cdk from "aws-cdk-lib";
import { RemovalPolicy, Stack } from "aws-cdk-lib";
import { aws_dynamodb as dynamodb } from "aws-cdk-lib";
import { aws_iam as iam } from "aws-cdk-lib";
import {
  CompositePrincipal,
  ManagedPolicy,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import * as logs from "aws-cdk-lib/aws-logs";
import {
  AuthorizationType,
  EndpointType,
  LambdaRestApi,
} from "aws-cdk-lib/aws-apigateway";
import { Bucket, BucketEncryption } from "aws-cdk-lib/aws-s3";
import { Rule } from "aws-cdk-lib/aws-events";
import targets = require("aws-cdk-lib/aws-events-targets");
import { CommonProps } from "../cf-common/cf-common-stack";
import { MyCustomResource } from "./custom-resources/cloudfront-config-custom-resource";
import {Construct} from "constructs";


export class CloudFrontConfigVersionStack extends Stack {


  constructor(scope: Construct, id: string, props?: CommonProps) {
    super(scope, id, props);
    this.templateOptions.description =
      "(SO8150) - Cloudfront Config Version stack.";
    new CloudFrontConfigVersionConstruct(this, id, props);
  }
}


export class CloudFrontConfigVersionConstruct extends Construct {
  public readonly configVersionDDBTableName: string;

  constructor(scope: Stack, id: string, props?: CommonProps) {
    super(scope, id);


    cdk.Tags.of(this).add("solution", "Cloudfront Extension Config Version", {
      includeResourceTypes: [
        "AWS::Lambda::Function",
        "AWS::S3::Bucket",
        "AWS::DynamoDB::Table",
        "AWS::ECS::Cluster",
        "AWS::ECS::TaskDefinition",
        "AWS::ECS::TaskSet",
        "AWS::ApiGatewayV2::Api",
        "AWS::ApiGatewayV2::Integration",
        "AWS::ApiGatewayV2::Stage",
        "AWS::ApiGateway::RestApi",
        "AWS::ApiGateway::Method",
        "AWS::SNS::Topic",
        "AWS::IAM::Role",
        "AWS::IAM::Policy",
      ],
    });

    //check appsync is existed in props
    if (props == null) {
      throw Error("The props can not be null");
    }
    if (props.appsyncApi == null) {
      throw Error("appsync should be included in the props");
    }

    const accessLogBucket = new Bucket(this, "BucketAccessLog", {
      encryption: BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.RETAIN,
      serverAccessLogsPrefix: "accessLogBucketAccessLog" + "-",
    });

    const cloudfront_config_version_s3_bucket = new Bucket(
      this,
      "CloudfrontConfigVersionS3Bucket",
      {
        encryption: BucketEncryption.S3_MANAGED,
        removalPolicy: RemovalPolicy.RETAIN,
        serverAccessLogsBucket: accessLogBucket,
        serverAccessLogsPrefix: "dataBucketAccessLog" + "-" + "config-version",
      }
    );

    // create Dynamodb table to save the cloudfront latest version data
    const cloudfront_config_latestVersion_table = new dynamodb.Table(
      this,
      "CloudFrontConfigLatestVersionTable",
      {
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
        partitionKey: {
          name: "distributionId",
          type: dynamodb.AttributeType.STRING,
        },
        pointInTimeRecovery: true,
      }
    );

    // create Dynamodb table to save the cloudfront config version data
    const cloudfront_config_version_table = new dynamodb.Table(
      this,
      "CloudFrontConfigVersionTable",
      {
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
        partitionKey: {
          name: "distributionId",
          type: dynamodb.AttributeType.STRING,
        },
        sortKey: { name: "versionId", type: dynamodb.AttributeType.NUMBER },
        pointInTimeRecovery: true,
      }
    );

    // create Dynamodb table to save the cloudfront config version data
    const cloudfront_config_snapshot_table = new dynamodb.Table(
      this,
      "CloudFrontConfigSnapshotTable",
      {
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
        partitionKey: {
          name: "distributionId",
          type: dynamodb.AttributeType.STRING,
        },
        sortKey: { name: "snapShotName", type: dynamodb.AttributeType.STRING },
        pointInTimeRecovery: true,
      }
    );

    const lambdaRole = new iam.Role(this, "LambdaRole", {
      assumedBy: new CompositePrincipal(
        new ServicePrincipal("lambda.amazonaws.com")
      ),
    });

    lambdaRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName("AmazonDynamoDBFullAccess")
    );
    lambdaRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess")
    );
    lambdaRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName("AWSLambda_FullAccess")
    );
    lambdaRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName("CloudFrontFullAccess")
    );
    lambdaRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole"
      )
    );

    // define a shared lambda layer for all other lambda to use
    const powertools_layer = LayerVersion.fromLayerVersionArn(
      this,
      "lambda-powertools",
      "arn:aws:lambda:" +
        Aws.REGION +
        ":017000801446:layer:AWSLambdaPowertoolsPython:13"
    );

    // define a git lambda layer for all other lambda to use
    const git_layer = LayerVersion.fromLayerVersionArn(
      this,
      "lambda-git",
      "arn:aws:lambda:" + Aws.REGION + ":553035198032:layer:git-lambda2:8"
    );

    const cloudfrontConfigVersionExporter = new lambda.Function(
      this,
      "cf-config-version-export-lambda",
      {
        functionName: "cf_config_version_exporter",
        runtime: lambda.Runtime.PYTHON_3_9,
        handler: "cf_config_version_exporter.lambda_handler",
        layers: [powertools_layer, git_layer],
        memorySize: 256,
        timeout: cdk.Duration.seconds(900),
        code: lambda.Code.fromAsset(
          path.join(
            __dirname,
            "../../lambda/config-version/cf_config_version_exporter"
          )
        ),
        role: lambdaRole,
        environment: {
          DDB_VERSION_TABLE_NAME: cloudfront_config_version_table.tableName,
          DDB_LATESTVERSION_TABLE_NAME:
            cloudfront_config_latestVersion_table.tableName,
          DDB_SNAPSHOT_TABLE_NAME: cloudfront_config_snapshot_table.tableName,
          S3_BUCKET: cloudfront_config_version_s3_bucket.bucketName,
          ACCOUNT_ID: Aws.ACCOUNT_ID,
          REGION_NAME: Aws.REGION,
        },
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
    );

    cloudfrontConfigVersionExporter.node.addDependency(
      cloudfront_config_version_table
    );
    cloudfrontConfigVersionExporter.node.addDependency(
      cloudfront_config_latestVersion_table
    );
    cloudfrontConfigVersionExporter.node.addDependency(
      cloudfront_config_version_s3_bucket
    );

    const cloudfrontConfigVersionManager = new lambda.Function(
      this,
      "cf-config-version-manager-lambda",
      {
        functionName: "cf_config_version_manager",
        runtime: lambda.Runtime.PYTHON_3_9,
        layers: [powertools_layer, git_layer],
        handler: "cf_config_version_manager.lambda_handler",
        memorySize: 256,
        timeout: cdk.Duration.seconds(900),
        code: lambda.Code.fromAsset(
          path.join(
            __dirname,
            "../../lambda/config-version/cf_config_version_manager"
          )
        ),
        role: lambdaRole,
        environment: {
          DDB_VERSION_TABLE_NAME: cloudfront_config_version_table.tableName,
          DDB_LATESTVERSION_TABLE_NAME:
            cloudfront_config_latestVersion_table.tableName,
          DDB_SNAPSHOT_TABLE_NAME: cloudfront_config_snapshot_table.tableName,
          S3_BUCKET: cloudfront_config_version_s3_bucket.bucketName,
          ACCOUNT_ID: Aws.ACCOUNT_ID,
          REGION_NAME: Aws.REGION,
        },
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
    );

    cloudfrontConfigVersionManager.node.addDependency(
      cloudfront_config_version_table
    );
    cloudfrontConfigVersionManager.node.addDependency(
      cloudfront_config_latestVersion_table
    );
    cloudfrontConfigVersionManager.node.addDependency(
      cloudfront_config_version_s3_bucket
    );

    const cloudfront_config_change_rule = new Rule(
      this,
      "cloudfront_config_change_rule",
      {
        eventPattern: {
          source: ["aws.cloudfront"],
          detail: {
            eventName: [
              "UpdateDistribution",
              "CreateDistribution",
              "CreateDistributionWithTags",
            ],
          },
        },
      }
    );

    cloudfront_config_change_rule.addTarget(
      new targets.LambdaFunction(cloudfrontConfigVersionExporter)
    );

    const snapshot_rest_api = new LambdaRestApi(
      this,
      "cloudfront_config_snapshot_restfulApi",
      {
        handler: cloudfrontConfigVersionManager,
        description: "restful api to manage cloudfront snapshot changes",
        proxy: false,
        restApiName: "CloudfrontSnapshotManager",
        endpointConfiguration: {
          types: [EndpointType.EDGE],
        },
      }
    );

    // const version_rest_api = new LambdaRestApi(
    //   this,
    //   "cloudfront_config_version_restfulApi",
    //   {
    //     handler: cloudfrontConfigVersionManager,
    //     description: "restful api to manage cloudfront configuration changes",
    //     proxy: false,
    //     restApiName: "CloudfrontVersionManager",
    //     endpointConfiguration: {
    //       types: [EndpointType.EDGE],
    //     },
    //   }
    // );

    // const config_diff_proxy = rest_api.root.addResource("cf_config_manager");
    // config_diff_proxy.addMethod("GET", undefined, {
    //   // authorizationType: AuthorizationType.IAM,
    //   apiKeyRequired: true,
    // });

    // const version_proxy = version_rest_api.root.addResource("version");

    // const get_distribution_cname_proxy = version_proxy.addResource(
    //   "get_distribution_cname"
    // );
    // get_distribution_cname_proxy.addMethod("GET", undefined, {
    //   // authorizationType: AuthorizationType.IAM,
    //   apiKeyRequired: true,
    // });
    //
    // const diff_proxy = version_proxy.addResource("diff");
    // diff_proxy.addMethod("GET", undefined, {
    //   // authorizationType: AuthorizationType.IAM,
    //   apiKeyRequired: true,
    // });
    //
    // const versionList_proxy = version_proxy.addResource("list_versions");
    // versionList_proxy.addMethod("GET", undefined, {
    //   // authorizationType: AuthorizationType.IAM,
    //   apiKeyRequired: true,
    // });
    //
    // // const apply_config_proxy = version_proxy.addResource("apply_config");
    // // apply_config_proxy.addMethod("GET", undefined, {
    // //   authorizationType: AuthorizationType.IAM,
    // //   apiKeyRequired: true,
    // // });
    //
    // const config_tag_update_proxy =
    //   version_proxy.addResource("config_tag_update");
    // config_tag_update_proxy.addMethod("POST", undefined, {
    //   // authorizationType: AuthorizationType.IAM,
    //   apiKeyRequired: true,
    // });
    //
    // const cf_list_proxy = version_proxy.addResource("cf_list");
    // cf_list_proxy.addMethod("GET", undefined, {
    //   // authorizationType: AuthorizationType.IAM,
    //   apiKeyRequired: true,
    // });
    //
    // const config_link_path = version_proxy.addResource("config_link");
    // const config_link_proxy = config_link_path.addResource("{versionId}");
    // config_link_proxy.addMethod("GET", undefined, {
    //   // authorizationType: AuthorizationType.IAM,
    //   apiKeyRequired: true,
    // });
    //
    // const config_content_path = version_proxy.addResource("config_content");
    // const config_content_proxy = config_content_path.addResource("{versionId}");
    // config_content_proxy.addMethod("GET", undefined, {
    //   // authorizationType: AuthorizationType.IAM,
    //   apiKeyRequired: true,
    // });

    const snapshot_proxy = snapshot_rest_api.root.addResource("snapshot");

    const apply_snapshot_proxy = snapshot_proxy.addResource("apply_snapshot");
    apply_snapshot_proxy.addMethod("POST", undefined, {
      // authorizationType: AuthorizationType.IAM,
      apiKeyRequired: true,
    });

    const diff_cloudfront_snapshot_proxy = snapshot_proxy.addResource(
      "diff_cloudfront_snapshot"
    );
    diff_cloudfront_snapshot_proxy.addMethod("GET", undefined, {
      // authorizationType: AuthorizationType.IAM,
      apiKeyRequired: true,
    });

    const config_snapshot_tag_update_proxy = snapshot_proxy.addResource(
      "config_snapshot_tag_update"
    );
    config_snapshot_tag_update_proxy.addMethod("POST", undefined, {
      // authorizationType: AuthorizationType.IAM,
      apiKeyRequired: true,
    });

    const get_applied_snapshot_name_proxy = snapshot_proxy.addResource(
      "get_applied_snapshot_name"
    );
    get_applied_snapshot_name_proxy.addMethod("GET", undefined, {
      // authorizationType: AuthorizationType.IAM,
      apiKeyRequired: true,
    });

    const get_snapshot_link_proxy =
      snapshot_proxy.addResource("get_snapshot_link");
    get_snapshot_link_proxy.addMethod("GET", undefined, {
      authorizationType: AuthorizationType.IAM,
    });

    const list_snapshots_proxy = snapshot_proxy.addResource("list_snapshots");
    list_snapshots_proxy.addMethod("GET", undefined, {
      // authorizationType: AuthorizationType.IAM,
      apiKeyRequired: true,
    });

    const create_snapshot_proxy = snapshot_proxy.addResource("create_snapshot");
    create_snapshot_proxy.addMethod("POST", undefined, {
      // authorizationType: AuthorizationType.IAM,
      apiKeyRequired: true,
    });

    const delete_snapshot_proxy = snapshot_proxy.addResource("delete_snapshot");
    delete_snapshot_proxy.addMethod("POST", undefined, {
      // authorizationType: AuthorizationType.IAM,
      apiKeyRequired: true,
    });

    //Policy to allow client to call this restful api
    // const version_api_client_policy = new ManagedPolicy(
    //   this,
    //   "version_client_policy",
    //   {
    //     managedPolicyName: "cf_config_version_client_policy",
    //     description: "policy for client to call cf version",
    //     statements: [
    //       new iam.PolicyStatement({
    //         resources: [version_rest_api.arnForExecuteApi()],
    //         actions: ["execute-api:Invoke"],
    //         effect: iam.Effect.ALLOW,
    //       }),
    //     ],
    //   }
    // );

    const usagePlan = snapshot_rest_api.addUsagePlan("Snapshot_api_UsagePlan", {
      description: "Snapshot api usage plan",
    });
    const apiKey = snapshot_rest_api.addApiKey("Snapshot_api_ApiKey");
    usagePlan.addApiKey(apiKey);
    usagePlan.addApiStage({
      stage: snapshot_rest_api.deploymentStage,
    });

    //Policy to allow client to call this restful api
    const snapshot_client_policy = new ManagedPolicy(
      this,
      "snapshot_client_policy",
      {
        managedPolicyName: "cf_config_snapshot_client_policy",
        description: "policy for client to call cf snapshot",
        statements: [
          new iam.PolicyStatement({
            resources: [snapshot_rest_api.arnForExecuteApi()],
            actions: ["execute-api:Invoke"],
            effect: iam.Effect.ALLOW,
          }),
        ],
      }
    );

    const cloudfrontConfigVersionManager_graphql = new lambda.Function(
      this,
      "cf-config-version-manager-lambda-graphql",
      {
        functionName: "cf_config_version_manager_graphql",
        runtime: lambda.Runtime.PYTHON_3_9,
        layers: [powertools_layer, git_layer],
        handler: "cf_config_version_manager_graphql.lambda_handler",
        memorySize: 256,
        timeout: cdk.Duration.seconds(900),
        code: lambda.Code.fromAsset(
          path.join(
            __dirname,
            "../../lambda/config-version/cf_config_version_manager_graphql"
          )
        ),
        role: lambdaRole,
        environment: {
          DDB_VERSION_TABLE_NAME: cloudfront_config_version_table.tableName,
          DDB_LATESTVERSION_TABLE_NAME:
            cloudfront_config_latestVersion_table.tableName,
          DDB_SNAPSHOT_TABLE_NAME: cloudfront_config_snapshot_table.tableName,
          S3_BUCKET: cloudfront_config_version_s3_bucket.bucketName,
          ACCOUNT_ID: Aws.ACCOUNT_ID,
          REGION_NAME: Aws.REGION,
        },
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
    );

    cloudfrontConfigVersionManager_graphql.node.addDependency(
      cloudfront_config_version_table
    );
    cloudfrontConfigVersionManager_graphql.node.addDependency(
      cloudfront_config_latestVersion_table
    );
    cloudfrontConfigVersionManager_graphql.node.addDependency(
      cloudfront_config_version_s3_bucket
    );

    const graphql_api = props?.appsyncApi;

    const lambdaDs = graphql_api.addLambdaDataSource(
      "lambdaDatasource-config-version",
      cloudfrontConfigVersionManager_graphql
    );

    lambdaDs.createResolver({
      typeName: "Query",
      fieldName: "applyConfig",
    });

    lambdaDs.createResolver({
      typeName: "Query",
      fieldName: "listDistribution",
    });

    lambdaDs.createResolver({
      typeName: "Query",
      fieldName: "getDistributionCname",
    });

    lambdaDs.createResolver({
      typeName: "Query",
      fieldName: "getAppliedSnapshotName",
    });

    lambdaDs.createResolver({
      typeName: "Query",
      fieldName: "updateConfigTag",
    });

    lambdaDs.createResolver({
      typeName: "Query",
      fieldName: "updateConfigSnapshotTag",
    });

    lambdaDs.createResolver({
      typeName: "Query",
      fieldName: "diffCloudfrontConfig",
    });

    lambdaDs.createResolver({
      typeName: "Query",
      fieldName: "diffCloudfrontConfigSnapshot",
    });

    lambdaDs.createResolver({
      typeName: "Query",
      fieldName: "listCloudfrontVersions",
    });

    lambdaDs.createResolver({
      typeName: "Query",
      fieldName: "listCloudfrontSnapshots",
    });

    lambdaDs.createResolver({
      typeName: "Query",
      fieldName: "getConfigLink",
    });

    lambdaDs.createResolver({
      typeName: "Query",
      fieldName: "getConfigSnapshotLink",
    });

    lambdaDs.createResolver({
      typeName: "Query",
      fieldName: "getConfigContent",
    });

    lambdaDs.createResolver({
      typeName: "Query",
      fieldName: "getConfigSnapshotContent",
    });

    lambdaDs.createResolver({
      typeName: "Mutation",
      fieldName: "createVersionSnapShot",
    });

    lambdaDs.createResolver({
      typeName: "Mutation",
      fieldName: "applySnapshot",
    });

    lambdaDs.createResolver({
      typeName: "Mutation",
      fieldName: "deleteSnapshot",
    });

    // create customer resource to init all cloudfront config data in DDB
    const resource = new MyCustomResource(
      this,
      "CloudfrontVersionConfigResource",
      {
        message: "Trying to fetch all existing cloudfront distribution config",
        DDB_VERSION_TABLE_NAME: cloudfront_config_version_table.tableName,
        DDB_LATESTVERSION_TABLE_NAME:
          cloudfront_config_latestVersion_table.tableName,
        DDB_SNAPSHOT_TABLE_NAME: cloudfront_config_snapshot_table.tableName,
        S3_BUCKET: cloudfront_config_version_s3_bucket.bucketName,
        roleArn: lambdaRole.roleArn,
      }
    );

    // Prints out the stack region to the terminal
    new cdk.CfnOutput(this, "cloudfront_config_version_s3_bucket", {
      value: cloudfront_config_version_s3_bucket.bucketName,
    });
    new cdk.CfnOutput(this, "cloudfront_config_version_dynamodb", {
      value: cloudfront_config_version_table.tableName,
      exportName: "configVersionDDBTableName",
    });
    this.configVersionDDBTableName =  cloudfront_config_version_table.tableName;

    new cdk.CfnOutput(this, "cloudfront_config_latest_version_dynamodb", {
      value: cloudfront_config_latestVersion_table.tableName,
    });

    // new cdk.CfnOutput(this, "cloudfront_config_diff", {
    //   value: cloudfrontConfigVersionManager.functionName,
    // });
    // new cdk.CfnOutput(this, "cloudfront_version_rest_api", {
    //   value: version_rest_api.restApiName,
    // });
    new cdk.CfnOutput(this, "cloudfront_snapshot_rest_api", {
      value: snapshot_rest_api.restApiName,
    });

    new cdk.CfnOutput(this, "Snapshot API key", {
      value: apiKey.keyArn,
    });
  }
}
