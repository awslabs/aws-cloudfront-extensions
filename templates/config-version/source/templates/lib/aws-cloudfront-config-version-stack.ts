import * as path from 'path';
import * as lambda from '@aws-cdk/aws-lambda';
import * as cdk from '@aws-cdk/core';
import {CfnParameter, Construct, RemovalPolicy, Stack} from '@aws-cdk/core';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as iam from '@aws-cdk/aws-iam';
import { CompositePrincipal, ManagedPolicy, ServicePrincipal } from '@aws-cdk/aws-iam';
import * as logs from '@aws-cdk/aws-logs';
import {
  EndpointType,
  LambdaRestApi,
} from "@aws-cdk/aws-apigateway";
import { Bucket, BucketEncryption } from "@aws-cdk/aws-s3";
import {Rule} from '@aws-cdk/aws-events';
import targets = require('@aws-cdk/aws-events-targets');

export class CloudFrontConfigVersionStack extends Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps ) {
    super(scope, id, props);

    this.templateOptions.description = "(SO8150) - Cloudfront Config Version stack.";

    const CloudFrontDistributionIDList = new CfnParameter(this, 'CloudFrontDistributionIDList', {
      description: 'The cloudfront domain name to be monitored, for example: EZVWX0EG9VYPE , for multiple domain, using \',\' as seperation',
      type: 'String',
    })

    cdk.Tags.of(this).add('solution', 'Cloudfront Extension Config Version', {
      includeResourceTypes: [
        'AWS::Lambda::Function',
        'AWS::S3::Bucket',
        'AWS::DynamoDB::Table',
        'AWS::ECS::Cluster',
        'AWS::ECS::TaskDefinition',
        'AWS::ECS::TaskSet',
        'AWS::ApiGatewayV2::Api',
        'AWS::ApiGatewayV2::Integration',
        'AWS::ApiGatewayV2::Stage',
        'AWS::ApiGateway::RestApi',
        'AWS::ApiGateway::Method',
        'AWS::SNS::Topic',
        'AWS::IAM::Role',
        'AWS::IAM::Policy'
      ],
    });

    const accessLogBucket = new Bucket(this, 'BucketAccessLog', {
      encryption: BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.DESTROY,
      serverAccessLogsPrefix: 'accessLogBucketAccessLog' + '-',
    });

    const cloudfront_config_version_s3_bucket = new Bucket(this, 'CloudfrontMonitoringS3Bucket', {
      encryption: BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.RETAIN,
      autoDeleteObjects: true,
      serverAccessLogsBucket: accessLogBucket,
      serverAccessLogsPrefix: 'dataBucketAccessLog' + '-' + 'config-version'
    });

    // create Dynamodb table to save the cloudfront config version data
    const cloudfront_config_version_table = new dynamodb.Table(this, 'CloudFrontConfigVersionTable', {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      partitionKey: { name: 'distributionId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'versionId', type: dynamodb.AttributeType.NUMBER },
      pointInTimeRecovery: true,
    });

    const readAutoScaling = cloudfront_config_version_table.autoScaleReadCapacity({
      minCapacity: 10,
      maxCapacity: 200
    });

    readAutoScaling.scaleOnUtilization({
      targetUtilizationPercent: 75
    })

    const lambdaRole = new iam.Role(this, 'LambdaRole', {
      assumedBy: new CompositePrincipal(
        new ServicePrincipal("lambda.amazonaws.com"),
      ),
    });

    lambdaRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess')
    );
    lambdaRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess')
    );
    lambdaRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName('AWSLambda_FullAccess')
    );
    lambdaRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
    );

    const cloudfrontConfigVersionExporter = new lambda.Function(this, 'cf-config-version-export-lambda', {
      functionName: "cf_config_version_exporter",
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'cf_config_version_exporter.lambda_handler',
      memorySize: 1024,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda.d/cf_config_version_exporter')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfront_config_version_table.tableName,
        S3_BUCKET: cloudfront_config_version_s3_bucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: CloudFrontDistributionIDList.valueAsString,
        REGION_NAME: this.region
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    cloudfrontConfigVersionExporter.node.addDependency(cloudfront_config_version_table);
    cloudfrontConfigVersionExporter.node.addDependency(cloudfront_config_version_s3_bucket);

    const cloudfrontConfigVersionDiff = new lambda.Function(this, 'cf-config-version-diff-lambda', {
      functionName: "cf_config_version_diff",
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'cf_config_version_diff.lambda_handler',
      memorySize: 1024,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda.d/cf_config_version_diff')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfront_config_version_table.tableName,
        S3_BUCKET: cloudfront_config_version_s3_bucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: CloudFrontDistributionIDList.valueAsString,
        REGION_NAME: this.region
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    cloudfrontConfigVersionDiff.node.addDependency(cloudfront_config_version_table);
    cloudfrontConfigVersionDiff.node.addDependency(cloudfront_config_version_s3_bucket);


    const distributionList = CloudFrontDistributionIDList.valueAsString.split(',');

    const cloudfront_config_change_rule = new Rule(this, 'cloudfront_config_change_rule', {
      eventPattern: {
        source: ["aws.cloudfront"],
        detail:{
         "eventName": ["UpdateDistribution"],
         "requestParameters": {
         "id": distributionList   //TODO: need to figure out how to generate the distribution list automatically
         }
        }
      },
    });

    cloudfront_config_change_rule.addTarget(new targets.LambdaFunction(cloudfrontConfigVersionExporter))

    const rest_api = new LambdaRestApi(this, 'performance_metrics_restfulApi', {
      handler: cloudfrontConfigVersionDiff,
      description: "restful api to get the cloudfront config diff",
      proxy: false,
      restApiName: 'CloudfrontConfigDiff',
      endpointConfiguration: {
        types: [EndpointType.EDGE]
      }
    })

    new cdk.CfnOutput(this, 'cloudfront_config_version_s3_bucket', { value: cloudfront_config_version_s3_bucket.bucketName });
    new cdk.CfnOutput(this, 'cloudfront_metrics_dynamodb', { value: cloudfront_config_version_table.tableName });
    new cdk.CfnOutput(this, 'cloudfront_config_exporter',{value: cloudfrontConfigVersionExporter.functionName});
    new cdk.CfnOutput(this, 'cloudfront_config_diff',{value: cloudfrontConfigVersionDiff.functionName});
  }
}
