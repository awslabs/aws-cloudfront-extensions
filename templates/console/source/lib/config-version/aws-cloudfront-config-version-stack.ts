import * as path from "path";
import {
  Aws,
  aws_kms as kms,
  aws_lambda as lambda,
  StackProps,
} from "aws-cdk-lib";
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
  RequestValidator,
} from "aws-cdk-lib/aws-apigateway";
import { Bucket, BucketEncryption } from "aws-cdk-lib/aws-s3";
import { Rule } from "aws-cdk-lib/aws-events";
import targets = require("aws-cdk-lib/aws-events-targets");
import { Trail } from "aws-cdk-lib/aws-cloudtrail";
import { CommonProps } from "../cf-common/cf-common-stack";
import { MyCustomResource } from "./custom-resources/cloudfront-config-custom-resource";
import * as appsync from "@aws-cdk/aws-appsync-alpha";
import { Construct } from "constructs";

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
        serverAccessLogsBucket: accessLogBucket,
        serverAccessLogsPrefix: "dataBucketAccessLog" + "-" + "config-version",
        removalPolicy: RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      }
    );

    // create Dynamodb table to save the cloudfront latest version data
    const cloudfront_config_latestVersion_table = new dynamodb.Table(
      this,
      "CloudFrontConfigLatestVersionTable",
      {
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
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
        removalPolicy: cdk.RemovalPolicy.DESTROY,
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
        removalPolicy: cdk.RemovalPolicy.DESTROY,
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

    const lambdaRunPolicy = new iam.PolicyStatement({
      resources: ["*"],
      actions: [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
      ],
    });

    const acm_admin_policy = new iam.PolicyStatement({
      resources: ["*"],
      actions: ["acm:*"],
    });

    const ddb_rw_policy = new iam.PolicyStatement({
      resources: [
        cloudfront_config_version_table.tableArn,
        cloudfront_config_latestVersion_table.tableArn,
        cloudfront_config_snapshot_table.tableArn,
      ],
      actions: ["dynamodb:*"],
    });

    const stepFunction_run_policy = new iam.PolicyStatement({
      resources: ["*"],
      actions: ["states:*"],
    });

    const s3_rw_policy = new iam.PolicyStatement({
      resources: [`${cloudfront_config_version_s3_bucket.bucketArn}/*`],
      actions: [
        "s3:Get*",
        "s3:List*",
        "s3-object-lambda:Get*",
        "s3-object-lambda:List*",
        "s3:PutObject",
        "s3:GetObject",
      ],
    });

    const lambda_rw_policy = new iam.PolicyStatement({
      resources: ["*"],
      actions: ["lambda:*"],
    });

    const cloudfront_create_update_policy = new iam.PolicyStatement({
      resources: ["*"],
      actions: ["cloudfront:*"],
    });

    const eventBridge_create_policy = new iam.PolicyStatement({
      resources: ["*"],
      actions: ["events:*"],
    });

    const iam_create_policy = new iam.PolicyStatement({
      resources: ["*"],
      actions: ["iam:*"],
    });

    lambdaRole.addToPolicy(ddb_rw_policy);
    lambdaRole.addToPolicy(s3_rw_policy);
    lambdaRole.addToPolicy(lambda_rw_policy);
    lambdaRole.addToPolicy(cloudfront_create_update_policy);
    lambdaRole.addToPolicy(lambdaRunPolicy);
    lambdaRole.addToPolicy(eventBridge_create_policy);
    lambdaRole.addToPolicy(iam_create_policy);

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

    // TODO: temp remove the version api
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

    const requestValidator = new RequestValidator(
      this,
      "SnapshotRequestValidator",
      {
        restApi: snapshot_rest_api,
        requestValidatorName: "snapshotApiValidator",
        validateRequestBody: false,
        validateRequestParameters: true,
      }
    );

    const snapshot_proxy = snapshot_rest_api.root.addResource("snapshot");

    const apply_snapshot_proxy = snapshot_proxy.addResource("apply_snapshot");
    apply_snapshot_proxy.addMethod("POST", undefined, {
      // authorizationType: AuthorizationType.IAM,
      apiKeyRequired: true,
      requestParameters: {
        "method.request.querystring.src_distribution_id": true,
        "method.request.querystring.target_distribution_ids": true,
        "method.request.querystring.snapshot_name": true,
      },
      requestValidator: requestValidator,
    });

    const diff_cloudfront_snapshot_proxy = snapshot_proxy.addResource(
      "diff_cloudfront_snapshot"
    );
    diff_cloudfront_snapshot_proxy.addMethod("GET", undefined, {
      apiKeyRequired: true,
      requestParameters: {
        "method.request.querystring.distribution_id": true,
        "method.request.querystring.snapshot1": true,
        "method.request.querystring.snapshot2": true,
      },
      requestValidator: requestValidator,
    });

    const config_snapshot_tag_update_proxy = snapshot_proxy.addResource(
      "config_snapshot_tag_update"
    );
    config_snapshot_tag_update_proxy.addMethod("POST", undefined, {
      apiKeyRequired: true,
      requestParameters: {
        "method.request.querystring.distribution_id": true,
        "method.request.querystring.note": true,
        "method.request.querystring.snapshot_name": true,
      },
      requestValidator: requestValidator,
    });

    const get_applied_snapshot_name_proxy = snapshot_proxy.addResource(
      "get_applied_snapshot_name"
    );
    get_applied_snapshot_name_proxy.addMethod("GET", undefined, {
      apiKeyRequired: true,
      requestParameters: {
        "method.request.querystring.distributionId": true,
      },
      requestValidator: requestValidator,
    });

    const get_snapshot_link_proxy =
      snapshot_proxy.addResource("get_snapshot_link");
    get_snapshot_link_proxy.addMethod("GET", undefined, {
      authorizationType: AuthorizationType.IAM,
      requestParameters: {
        "method.request.querystring.distributionId": true,
        "method.request.querystring.snapShotName": true,
      },
      requestValidator: requestValidator,
    });

    const list_snapshots_proxy = snapshot_proxy.addResource("list_snapshots");
    list_snapshots_proxy.addMethod("GET", undefined, {
      apiKeyRequired: true,
      requestParameters: {
        "method.request.querystring.distributionId": true,
      },
      requestValidator: requestValidator,
    });

    const create_snapshot_proxy = snapshot_proxy.addResource("create_snapshot");
    create_snapshot_proxy.addMethod("POST", undefined, {
      // authorizationType: AuthorizationType.IAM,
      apiKeyRequired: true,
      requestParameters: {
        "method.request.querystring.distributionId": true,
        "method.request.querystring.snapShotName": true,
        "method.request.querystring.snapShotNote": true,
      },
      requestValidator: requestValidator,
    });

    const delete_snapshot_proxy = snapshot_proxy.addResource("delete_snapshot");
    delete_snapshot_proxy.addMethod("POST", undefined, {
      // authorizationType: AuthorizationType.IAM,
      apiKeyRequired: true,
      requestParameters: {
        "method.request.querystring.distributionId": true,
        "method.request.querystring.snapShotName": true,
      },
      requestValidator: requestValidator,
    });

    const usagePlan = snapshot_rest_api.addUsagePlan("Snapshot_api_UsagePlan", {
      description: "Snapshot api usage plan",
    });
    const apiKey = snapshot_rest_api.addApiKey("Snapshot_api_ApiKey");
    usagePlan.addApiKey(apiKey);
    usagePlan.addApiStage({
      stage: snapshot_rest_api.deploymentStage,
    });

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
      requestMappingTemplate: appsync.MappingTemplate.fromFile(
          path.join(
              __dirname,
              "../../graphql/vtl/config-version/applyConfig.vtl"
          )
      ),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
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
      requestMappingTemplate: appsync.MappingTemplate.fromFile(
          path.join(
              __dirname,
              "../../graphql/vtl/config-version/getAppliedSnapshotName.vtl"
          )
      ),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    lambdaDs.createResolver({
      typeName: "Query",
      fieldName: "updateConfigTag",
      requestMappingTemplate: appsync.MappingTemplate.fromFile(
          path.join(
              __dirname,
              "../../graphql/vtl/config-version/updateConfigTag.vtl"
          )
      ),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    lambdaDs.createResolver({
      typeName: "Query",
      fieldName: "updateConfigSnapshotTag",
      requestMappingTemplate: appsync.MappingTemplate.fromFile(
          path.join(
              __dirname,
              "../../graphql/vtl/config-version/updateConfigSnapshotTag.vtl"
          )
      ),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    lambdaDs.createResolver({
      typeName: "Query",
      fieldName: "diffCloudfrontConfig",
      requestMappingTemplate: appsync.MappingTemplate.fromFile(
          path.join(
              __dirname,
              "../../graphql/vtl/config-version/diffCloudfrontConfig.vtl"
          )
      ),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    lambdaDs.createResolver({
      typeName: "Query",
      fieldName: "diffCloudfrontConfigSnapshot",
      requestMappingTemplate: appsync.MappingTemplate.fromFile(
          path.join(
              __dirname,
              "../../graphql/vtl/config-version/diffCloudfrontConfigSnapshot.vtl"
          )
      ),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    lambdaDs.createResolver({
      typeName: "Query",
      fieldName: "listCloudfrontVersions",
      requestMappingTemplate: appsync.MappingTemplate.fromFile(
          path.join(
              __dirname,
              "../../graphql/vtl/config-version/listCloudfrontVersions.vtl"
          )
      ),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    lambdaDs.createResolver({
      typeName: "Query",
      fieldName: "listCloudfrontSnapshots",
      requestMappingTemplate: appsync.MappingTemplate.fromFile(
          path.join(
              __dirname,
              "../../graphql/vtl/config-version/listCloudfrontSnapshots.vtl"
          )
      ),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    lambdaDs.createResolver({
      typeName: "Query",
      fieldName: "getConfigLink",
      requestMappingTemplate: appsync.MappingTemplate.fromFile(
          path.join(
              __dirname,
              "../../graphql/vtl/config-version/getConfigLink.vtl"
          )
      ),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    lambdaDs.createResolver({
      typeName: "Query",
      fieldName: "getConfigSnapshotLink",
      requestMappingTemplate: appsync.MappingTemplate.fromFile(
          path.join(
              __dirname,
              "../../graphql/vtl/config-version/getConfigSnapshotLink.vtl"
          )
      ),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    lambdaDs.createResolver({
      typeName: "Query",
      fieldName: "getConfigContent",
      requestMappingTemplate: appsync.MappingTemplate.fromFile(
          path.join(
              __dirname,
              "../../graphql/vtl/config-version/getConfigContent.vtl"
          )
      ),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    lambdaDs.createResolver({
      typeName: "Query",
      fieldName: "getConfigSnapshotContent",
      requestMappingTemplate: appsync.MappingTemplate.fromFile(
          path.join(
              __dirname,
              "../../graphql/vtl/config-version/getConfigSnapshotContent.vtl"
          )
      ),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    lambdaDs.createResolver({
      typeName: "Mutation",
      fieldName: "createVersionSnapShot",
      requestMappingTemplate: appsync.MappingTemplate.fromFile(
          path.join(
              __dirname,
              "../../graphql/vtl/config-version/createVersionSnapShot.vtl"
          )
      ),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    lambdaDs.createResolver({
      typeName: "Mutation",
      fieldName: "applySnapshot",
      requestMappingTemplate: appsync.MappingTemplate.fromFile(
          path.join(
              __dirname,
              "../../graphql/vtl/config-version/applySnapshot.vtl"
          )
      ),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),

    });

    lambdaDs.createResolver({
      typeName: "Mutation",
      fieldName: "deleteSnapshot",
    });

    // 1. create customer resource to init all cloudfront config data in DDB
    // 2. create eventbridge rule in us-east-1 region to forward cloudfront events to other region since cloudfront events are only supported in us-east-1 region
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
    // new cdk.CfnOutput(this, "cloudfront_config_version_s3_bucket", {
    //   value: cloudfront_config_version_s3_bucket.bucketName,
    // });
    new cdk.CfnOutput(this, "cloudfront_config_version_dynamodb", {
      value: cloudfront_config_version_table.tableName,
      exportName: "configVersionDDBTableName",
      description: "the config version dynamodb table",
    });
    this.configVersionDDBTableName = cloudfront_config_version_table.tableName;

    // new cdk.CfnOutput(this, "cloudfront_config_latest_version_dynamodb", {
    //   value: cloudfront_config_latestVersion_table.tableName,
    // });

    // new cdk.CfnOutput(this, "cloudfront_config_diff", {
    //   value: cloudfrontConfigVersionManager.functionName,
    // });
    // new cdk.CfnOutput(this, "cloudfront_version_rest_api", {
    //   value: version_rest_api.restApiName,
    // });
    new cdk.CfnOutput(this, "cloudfront_snapshot_rest_api", {
      value: snapshot_rest_api.restApiName,
      description: "the api name of the snapshot rest api",
    });

    new cdk.CfnOutput(this, "Snapshot API key", {
      value: apiKey.keyArn,
      description: "the api keys of the snapshot rest api",
    });
  }
}
