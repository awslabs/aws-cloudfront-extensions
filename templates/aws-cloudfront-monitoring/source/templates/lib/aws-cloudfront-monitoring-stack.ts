import * as path from 'path';
import * as lambda from '@aws-cdk/aws-lambda';
import * as cdk from '@aws-cdk/core';
import {CfnParameter, Construct, Duration, RemovalPolicy, Stack} from '@aws-cdk/core';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as iam from '@aws-cdk/aws-iam';
import { CompositePrincipal, ManagedPolicy, ServicePrincipal } from '@aws-cdk/aws-iam';
import * as logs from '@aws-cdk/aws-logs';
import {
  AuthorizationType,
  CognitoUserPoolsAuthorizer,
  EndpointType,
  LambdaRestApi,
  RequestValidator
} from "@aws-cdk/aws-apigateway";
import * as cognito from '@aws-cdk/aws-cognito';
import { Bucket, BucketEncryption } from "@aws-cdk/aws-s3";
import * as kinesis from "@aws-cdk/aws-kinesis";
import { CfnDeliveryStream } from "@aws-cdk/aws-kinesisfirehose";
import { CfnTable, Database, Table } from "@aws-cdk/aws-glue"
import { StreamEncryption } from "@aws-cdk/aws-kinesis";
import { Rule, Schedule } from "@aws-cdk/aws-events";
import { LambdaFunction } from '@aws-cdk/aws-events-targets';
import {
  OAuthScope,
  ResourceServerScope,
  UserPoolClientIdentityProvider,
  UserPoolResourceServer
} from "@aws-cdk/aws-cognito";

export class CloudFrontMonitoringStack extends Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps ) {
    super(scope, id, props);

    this.templateOptions.description = "(SO8150) - Cloudfront monitoring stack.";

    const CloudFrontDomainList = new CfnParameter(this, 'CloudFrontDomainList', {
      description: 'The cloudfront domain name to be monitored, for example: d1v8v39goa3nap.cloudfront.net, for multiple domain, using \',\' as seperation',
      allowedPattern: '(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]',
      type: 'String',
    })

    const CloudFrontLogKeepingDays = new CfnParameter(this, 'CloudFrontLogKeepDays', {
      description: 'Max number of days to keep cloudfront realtime logs in S3',
      type: 'Number',
      default: 120,
    })

    const deployStage = new CfnParameter(this, 'deployStage', {
      description: 'stageName of the deployment, this allow multiple deployment into one account',
      type: 'String',
      default: 'prod',
      allowedValues: ['dev', 'beta', 'gamma', 'preprod', 'prod']
    })

    cdk.Tags.of(this).add('stage', deployStage.valueAsString, {
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
      serverAccessLogsPrefix: 'accessLogBucketAccessLog' + '-' + deployStage.valueAsString,
    });

    const cloudfront_monitoring_s3_bucket = new Bucket(this, 'CloudfrontMonitoringS3Bucket', {
      encryption: BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      serverAccessLogsBucket: accessLogBucket,
      serverAccessLogsPrefix: 'dataBucketAccessLog' + '-' + deployStage.valueAsString,
      lifecycleRules: [
        {
          enabled: true,
          expiration: Duration.days(CloudFrontLogKeepingDays.valueAsNumber),
        },
      ]
    });

    // create Dynamodb table to save the cloudfront metrics data
    const cloudfront_metrics_table = new dynamodb.Table(this, 'CloudFrontMetricsTable', {
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 10,
      writeCapacity: 10,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      partitionKey: { name: 'metricId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      pointInTimeRecovery: true,
    });

    const readAutoScaling = cloudfront_metrics_table.autoScaleReadCapacity({
      minCapacity: 1,
      maxCapacity: 10
    });

    readAutoScaling.scaleOnUtilization({
      targetUtilizationPercent: 75
    })

    const glueDatabase = new Database(this, "cf_realtime_log_glue_database", {
      databaseName: "glue_cf_realtime_log_database"
    });


    const glueTableCFN = new CfnTable(this, 'GlueTable', {
      databaseName: glueDatabase.databaseName,
      catalogId: glueDatabase.catalogId,
      tableInput: {
        tableType: "EXTERNAL_TABLE",
        parameters: {
          external: "TRUE",
          'skip.header.line.count': "2"
        },
        storageDescriptor: {
          columns: [
            {
              name: "timestamp",
              type: "bigint"
            },
            {
              name: "c-ip",
              type: "string"
            },
            {
              name: "time-to-first-byte",
              type: "float"
            },
            {
              name: "sc-status",
              type: "int"
            },
            {
              name: "sc-bytes",
              type: "int"
            },
            {
              name: "cs-method",
              type: "string"
            },
            {
              name: "cs-protocol",
              type: "string"
            },
            {
              name: "cs-host",
              type: "string"
            },
            {
              name: "cs-uri-stem",
              type: "string"
            },
            {
              name: "cs-bytes",
              type: "int"
            },
            {
              name: "x-edge-location",
              type: "string"
            },
            {
              name: "x-edge-request-id",
              type: "string"
            },
            {
              name: "x-host-header",
              type: "string"
            },
            {
              name: "time-taken",
              type: "float"
            },
            {
              name: "cs-protocol-version",
              type: "string"
            },
            {
              name: "c-ip-version",
              type: "string"
            },
            {
              name: "cs-user-agent",
              type: "string"
            },
            {
              name: "cs-referer",
              type: "string"
            },
            {
              name: "cs-cookie",
              type: "string"
            },
            {
              name: "cs-uri-query",
              type: "string"
            },
            {
              name: "x-edge-response-result-type",
              type: "string"
            },
            {
              name: "x-forwarded-for",
              type: "string"
            },
            {
              name: "ssl-protocol",
              type: "string"
            },
            {
              name: "ssl-cipher",
              type: "string"
            },
            {
              name: "x-edge-result-type",
              type: "string"
            },
            {
              name: "fle-encrypted-fields",
              type: "string"
            },
            {
              name: "fle-status",
              type: "string"
            },
            {
              name: "sc-content-type",
              type: "string"
            },
            {
              name: "sc-content-len",
              type: "int"
            },
            {
              name: "sc-range-start",
              type: "int"
            },
            {
              name: "sc-range-end",
              type: "int"
            },
            {
              name: "c-port",
              type: "int"
            },
            {
              name: "x-edge-detailed-result-type",
              type: "string"
            },
            {
              name: "c-country",
              type: "string"
            },
            {
              name: "cs-accept-encoding",
              type: "string"
            },
            {
              name: "cs-accept",
              type: "string"
            },
            {
              name: "cache-behavior-path-pattern",
              type: "string"
            },
            {
              name: "cs-headers",
              type: "string"
            },
            {
              name: "cs-header-names",
              type: "string"
            },
            {
              name: "cs-headers-count",
              type: "int"
            },
            {
              name: "isp",
              type: "string"
            },
            {
              name: "country-name",
              type: "string"
            }
          ],
          location: "s3://" + cloudfront_monitoring_s3_bucket.bucketName,
          inputFormat: "org.apache.hadoop.mapred.TextInputFormat",
          outputFormat: "org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat",
          compressed: false,
          numberOfBuckets: -1,
          serdeInfo: {
            serializationLibrary: "org.apache.hadoop.hive.serde2.lazy.LazySimpleSerDe",
            parameters: {
              'field.delim': '\t',
              'serialization.format': '\t'
            }
          },
          parameters: {

          },
          skewedInfo: {
            skewedColumnValueLocationMaps: {
            }
          },
          storedAsSubDirectories: false
        },
        partitionKeys: [
          {
            name: "year",
            type: "int"
          },
          {
            name: "month",
            type: "int"
          },
          {
            name: "day",
            type: "int"
          },
          {
            name: "hour",
            type: "int"
          },
          {
            name: "minute",
            type: "int"
          }
        ],
        retention: 0,
        name: "cloudfront_realtime_log"

      }
    });

    const glueTable = Table.fromTableArn(this, 'glue_table', glueTableCFN.ref)

    const lambdaRole = new iam.Role(this, 'LambdaRole', {
      assumedBy: new CompositePrincipal(
        new ServicePrincipal("firehose.amazonaws.com"),
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
      ManagedPolicy.fromAwsManagedPolicyName('AmazonAthenaFullAccess')
    );
    lambdaRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName('AWSLambda_FullAccess')
    );
    lambdaRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
    );

    lambdaRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName('AmazonKinesisFullAccess')
    );

    // define a shared lambda layer for all other lambda to use
    const cloudfrontSharedLayer = new lambda.LayerVersion(this, 'cloudfront-shared-layer', {
      compatibleRuntimes: [
        lambda.Runtime.PYTHON_3_9,
      ],
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda.d/shared_lib')),
      description: 'shared lib for all other lambda functions to use',
    });

    const addPartition = new lambda.Function(this, 'add-partition-lambda', {
      functionName: "addPartition",
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'add_partition.lambda_handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda.d/add_partition')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfront_metrics_table.tableName,
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: 'cloudfront_realtime_log',
        S3_BUCKET: cloudfront_monitoring_s3_bucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: CloudFrontDomainList.valueAsString,
        REGION_NAME: this.region
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [cloudfrontSharedLayer]
    });

    const deletePartition = new lambda.Function(this, 'delete-partition-lambda', {
      functionName: "deletePartition",
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'delete_partition.lambda_handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda.d/delete_partition')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfront_metrics_table.tableName,
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: 'cloudfront_realtime_log',
        S3_BUCKET: cloudfront_monitoring_s3_bucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: CloudFrontDomainList.valueAsString,
        REGION_NAME: this.region
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [cloudfrontSharedLayer]
    });

    const metricsCollectorBandwidthCdn = new lambda.Function(this, 'metrics_collector_bandwidth_cdn', {
      functionName: "metricsCollectorBandwidthCdn",
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'metric_collector_bandwidth_cdn.lambda_handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda.d/metric_collector_bandwidth_cdn')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfront_metrics_table.tableName,
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: 'cloudfront_realtime_log',
        S3_BUCKET: cloudfront_monitoring_s3_bucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: CloudFrontDomainList.valueAsString,
        REGION_NAME: this.region
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [cloudfrontSharedLayer]
    });

    const metricsCollectorBandwidthOrigin = new lambda.Function(this, 'metrics_collector_bandwidth_origin', {
      functionName: "metricsCollectorBandwidthOrigin",
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'metric_collector_bandwidth_origin.lambda_handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda.d/metric_collector_bandwidth_origin')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfront_metrics_table.tableName,
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: 'cloudfront_realtime_log',
        S3_BUCKET: cloudfront_monitoring_s3_bucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: CloudFrontDomainList.valueAsString,
        REGION_NAME: this.region
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [cloudfrontSharedLayer]
    });

    const metricsCollectorChrBandwidth = new lambda.Function(this, 'metrics_collector_chr_bandwidth', {
      functionName: "metricsCollectorChrBandwidth",
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'metric_collector_chr_bandwidth.lambda_handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda.d/metric_collector_chr_bandwidth')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfront_metrics_table.tableName,
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: 'cloudfront_realtime_log',
        S3_BUCKET: cloudfront_monitoring_s3_bucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: CloudFrontDomainList.valueAsString,
        REGION_NAME: this.region
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [cloudfrontSharedLayer]
    });

    const metricsCollectorChrRequest = new lambda.Function(this, 'metrics_collector_chr_request', {
      functionName: "metricsCollectorChrRequest",
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'metric_collector_chr_request.lambda_handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda.d/metric_collector_chr_request')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfront_metrics_table.tableName,
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: 'cloudfront_realtime_log',
        S3_BUCKET: cloudfront_monitoring_s3_bucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: CloudFrontDomainList.valueAsString,
        REGION_NAME: this.region
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [cloudfrontSharedLayer]
    });

    const metricsCollectorDownloadSpeedCDN = new lambda.Function(this, 'metrics_collector_download_speed_cdn', {
      functionName: "metricsCollectorDownloadSpeedCDN",
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'metric_collector_download_speed_cdn.lambda_handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda.d/metric_collector_download_speed_cdn')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfront_metrics_table.tableName,
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: 'cloudfront_realtime_log',
        S3_BUCKET: cloudfront_monitoring_s3_bucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: CloudFrontDomainList.valueAsString,
        REGION_NAME: this.region
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [cloudfrontSharedLayer]
    });

    const metricsCollectorDownloadSpeedOrigin = new lambda.Function(this, 'metrics_collector_download_speed_origin', {
      functionName: "metricsCollectorDownloadSpeedOrigin",
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'metric_collector_download_speed_origin.lambda_handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda.d/metric_collector_download_speed_origin')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfront_metrics_table.tableName,
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: 'cloudfront_realtime_log',
        S3_BUCKET: cloudfront_monitoring_s3_bucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: CloudFrontDomainList.valueAsString,
        REGION_NAME: this.region
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [cloudfrontSharedLayer]
    });

    const metricsCollectorRequestCDN = new lambda.Function(this, 'metrics_collector_request_cdn', {
      functionName: "metricsCollectorRequestCDN",
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'metric_collector_request_cdn.lambda_handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda.d/metric_collector_request_cdn')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfront_metrics_table.tableName,
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: 'cloudfront_realtime_log',
        S3_BUCKET: cloudfront_monitoring_s3_bucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: CloudFrontDomainList.valueAsString,
        REGION_NAME: this.region
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [cloudfrontSharedLayer]
    });

    const metricsCollectorRequestOrigin = new lambda.Function(this, 'metrics_collector_request_origin', {
      functionName: "metricsCollectorRequestOrigin",
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'metric_collector_request_origin.lambda_handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda.d/metric_collector_request_origin')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfront_metrics_table.tableName,
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: 'cloudfront_realtime_log',
        S3_BUCKET: cloudfront_monitoring_s3_bucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: CloudFrontDomainList.valueAsString,
        REGION_NAME: this.region
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [cloudfrontSharedLayer]
    });

    const metricsCollectorStatusCodeCDN = new lambda.Function(this, 'metrics_collector_status_code_cdn', {
      functionName: "metricsCollectorStatusCodeCDN",
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'metric_collector_status_code_cdn.lambda_handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda.d/metric_collector_status_code_cdn')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfront_metrics_table.tableName,
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: 'cloudfront_realtime_log',
        S3_BUCKET: cloudfront_monitoring_s3_bucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: CloudFrontDomainList.valueAsString,
        REGION_NAME: this.region
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [cloudfrontSharedLayer]
    });

    const metricsCollectorStatusCodeOrigin = new lambda.Function(this, 'metrics_collector_status_code_origin', {
      functionName: "metricsCollectorStatusCodeOrigin",
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'metric_collector_status_code_origin.lambda_handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda.d/metric_collector_status_code_origin')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfront_metrics_table.tableName,
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: 'cloudfront_realtime_log',
        S3_BUCKET: cloudfront_monitoring_s3_bucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: CloudFrontDomainList.valueAsString,
        REGION_NAME: this.region
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [cloudfrontSharedLayer]
    });

    const metricsManager = new lambda.Function(this, 'metricsManager', {
      functionName: "metricsManager",
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'metric_manager.lambda_handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda.d/metric_manager')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfront_metrics_table.tableName,
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: 'cloudfront_realtime_log',
        S3_BUCKET: cloudfront_monitoring_s3_bucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: CloudFrontDomainList.valueAsString,
        REGION_NAME: this.region
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [cloudfrontSharedLayer]
    });

    addPartition.node.addDependency(cloudfront_metrics_table);
    addPartition.node.addDependency(glueDatabase);
    addPartition.node.addDependency(glueTableCFN);
    addPartition.node.addDependency(glueTable);
    addPartition.node.addDependency(cloudfront_monitoring_s3_bucket);

    deletePartition.node.addDependency(cloudfront_metrics_table);
    deletePartition.node.addDependency(glueDatabase);
    deletePartition.node.addDependency(glueTable);
    deletePartition.node.addDependency(glueTableCFN);
    deletePartition.node.addDependency(cloudfront_monitoring_s3_bucket);

    metricsCollectorBandwidthCdn.node.addDependency(cloudfront_metrics_table);
    metricsCollectorBandwidthCdn.node.addDependency(glueDatabase);
    metricsCollectorBandwidthCdn.node.addDependency(glueTable);
    metricsCollectorBandwidthCdn.node.addDependency(glueTableCFN);
    metricsCollectorBandwidthCdn.node.addDependency(cloudfront_monitoring_s3_bucket);

    metricsCollectorBandwidthOrigin.node.addDependency(cloudfront_metrics_table);
    metricsCollectorBandwidthOrigin.node.addDependency(glueDatabase);
    metricsCollectorBandwidthOrigin.node.addDependency(glueTable);
    metricsCollectorBandwidthOrigin.node.addDependency(glueTableCFN);
    metricsCollectorBandwidthOrigin.node.addDependency(cloudfront_monitoring_s3_bucket);

    metricsCollectorChrBandwidth.node.addDependency(cloudfront_metrics_table);
    metricsCollectorChrBandwidth.node.addDependency(glueDatabase);
    metricsCollectorChrBandwidth.node.addDependency(glueTable);
    metricsCollectorChrBandwidth.node.addDependency(glueTableCFN);
    metricsCollectorChrBandwidth.node.addDependency(cloudfront_monitoring_s3_bucket);

    metricsCollectorChrRequest.node.addDependency(cloudfront_metrics_table);
    metricsCollectorChrRequest.node.addDependency(glueDatabase);
    metricsCollectorChrRequest.node.addDependency(glueTable);
    metricsCollectorChrRequest.node.addDependency(glueTableCFN);
    metricsCollectorChrRequest.node.addDependency(cloudfront_monitoring_s3_bucket);

    metricsCollectorDownloadSpeedOrigin.node.addDependency(cloudfront_metrics_table);
    metricsCollectorDownloadSpeedOrigin.node.addDependency(glueDatabase);
    metricsCollectorDownloadSpeedOrigin.node.addDependency(glueTable);
    metricsCollectorDownloadSpeedOrigin.node.addDependency(glueTableCFN);
    metricsCollectorDownloadSpeedOrigin.node.addDependency(cloudfront_monitoring_s3_bucket);

    metricsCollectorDownloadSpeedCDN.node.addDependency(cloudfront_metrics_table);
    metricsCollectorDownloadSpeedCDN.node.addDependency(glueDatabase);
    metricsCollectorDownloadSpeedCDN.node.addDependency(glueTable);
    metricsCollectorDownloadSpeedCDN.node.addDependency(glueTableCFN);
    metricsCollectorDownloadSpeedCDN.node.addDependency(cloudfront_monitoring_s3_bucket);

    metricsCollectorStatusCodeCDN.node.addDependency(cloudfront_metrics_table);
    metricsCollectorStatusCodeCDN.node.addDependency(glueDatabase);
    metricsCollectorStatusCodeCDN.node.addDependency(glueTable);
    metricsCollectorStatusCodeCDN.node.addDependency(glueTableCFN);
    metricsCollectorStatusCodeCDN.node.addDependency(cloudfront_monitoring_s3_bucket);

    metricsCollectorStatusCodeOrigin.node.addDependency(cloudfront_metrics_table);
    metricsCollectorStatusCodeOrigin.node.addDependency(glueDatabase);
    metricsCollectorStatusCodeOrigin.node.addDependency(glueTable);
    metricsCollectorStatusCodeOrigin.node.addDependency(glueTableCFN);
    metricsCollectorStatusCodeOrigin.node.addDependency(cloudfront_monitoring_s3_bucket);

    metricsCollectorRequestCDN.node.addDependency(cloudfront_metrics_table);
    metricsCollectorRequestCDN.node.addDependency(glueDatabase);
    metricsCollectorRequestCDN.node.addDependency(glueTable);
    metricsCollectorRequestCDN.node.addDependency(glueTableCFN);
    metricsCollectorRequestCDN.node.addDependency(cloudfront_monitoring_s3_bucket);

    metricsCollectorRequestOrigin.node.addDependency(cloudfront_metrics_table);
    metricsCollectorRequestOrigin.node.addDependency(glueDatabase);
    metricsCollectorRequestOrigin.node.addDependency(glueTable);
    metricsCollectorRequestOrigin.node.addDependency(glueTableCFN);
    metricsCollectorRequestOrigin.node.addDependency(cloudfront_monitoring_s3_bucket);

    metricsManager.node.addDependency(cloudfront_metrics_table);
    metricsManager.node.addDependency(glueDatabase);
    metricsManager.node.addDependency(glueTable);
    metricsManager.node.addDependency(glueTableCFN);
    metricsManager.node.addDependency(cloudfront_monitoring_s3_bucket);

    const rest_api = new LambdaRestApi(this, 'performance_metrics_restfulApi', {
      handler: metricsManager,
      description: "restful api to get the cloudfront performance data",
      proxy: false,
      restApiName: 'CloudfrontPerformanceMetrics',
      endpointConfiguration: {
        types: [EndpointType.EDGE]
      }
    })

    // create cognito user pool
    const cloudfront_metrics_userpool = new cognito.UserPool(this, 'CloudFrontMetricsCognitoUserPool', {
      removalPolicy: RemovalPolicy.DESTROY,
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
    });

    const getMetricScope = new ResourceServerScope({
      scopeName: "getMetrics",
      scopeDescription: "get cloudfront metrics",
    });
    const userPoolResourceServer = new UserPoolResourceServer(this, "cloudfront-metrics-api-resource-server", {
      identifier: 'cloudfront-metrics-api',
      userPool: cloudfront_metrics_userpool,
      scopes: [getMetricScope]
    })

    cloudfront_metrics_userpool.addClient('cloudfront-metrics-api-client', {
      userPoolClientName: 'cloudfront-log-metrics-client',
      generateSecret: true,
      oAuth: {
        flows: { clientCredentials: true },
        scopes: [OAuthScope.resourceServer(userPoolResourceServer, getMetricScope)],

      },
      supportedIdentityProviders: [
        UserPoolClientIdentityProvider.COGNITO,
      ]
    });

    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();

    let todayString = yyyy + '-' + mm + '-' + dd;
    cloudfront_metrics_userpool.addDomain("CloudfrontCognitoDomain", {
      cognitoDomain: {
        domainPrefix: this.stackName.toLowerCase() + this.account + '-' + this.region + '-' + todayString,
      },
    });

    const cognitoAuthorizer = new CognitoUserPoolsAuthorizer(this, `Cloudfront-Metrics-CognitoAuthorizer`, {
      authorizerName: `Metric-Cognito-Authorizer`,
      cognitoUserPools: [cloudfront_metrics_userpool],
      identitySource: "method.request.header.Authorization"
    });

    const performance_metric_proxy = rest_api.root.addResource('metric');
    performance_metric_proxy.addMethod('GET', undefined, {
      authorizationType: AuthorizationType.COGNITO,
      authorizer: cognitoAuthorizer,
      requestParameters: {
        'method.request.querystring.Action': false,
        'method.request.querystring.Domains': false,
        'method.request.querystring.StartTime': true,
        'method.request.querystring.EndTime': true,
        'method.request.querystring.Metric': true,
        'method.request.querystring.Project': false,
      },
      authorizationScopes: ['cloudfront-metrics-api/getMetrics'],
      requestValidator: new RequestValidator(this, "metricsApiValidator", {
        validateRequestBody: false,
        validateRequestParameters: true,
        requestValidatorName: 'defaultValidator',
        restApi: rest_api
      }),
    });

    //Policy to allow client to call this restful api
    const api_client_policy = new ManagedPolicy(this, "cloudfront_metrics_api_client_policy", {
      managedPolicyName: "cloudfront_metric_client_policy_" + deployStage.valueAsString,
      description: "policy for client to call stage:" + deployStage.valueAsString,
      statements: [
        new iam.PolicyStatement({
          resources: [rest_api.arnForExecuteApi()],
          actions: ['execute-api:Invoke'],
          effect: iam.Effect.ALLOW,
        }),
      ],
    });

    const cloudfront_realtime_log_stream = new kinesis.Stream(this, "TaskStream", {
      streamName: "cloudfront-real-time-log-data-stream",
      shardCount: 200,
      encryption: StreamEncryption.UNENCRYPTED
    })

    // Provide a Lambda function that will transform records before delivery, with custom
    // buffering and retry configuration
    // TODO: may need to replace this lambda with SAR
    const cloudfrontRealtimeLogTransformer = new lambda.Function(this, 'Cloudfront-realtime-log-transformer', {
      functionName: "cf-real-time-logs-transformer",
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'app.lambda_handler',
      memorySize: 10240,
      role: lambdaRole,
      code: lambda.Code.fromAsset(path.join(__dirname, '../../../../../edge/python/rt_log_transformer/rt_log_transformer')),
      timeout: cdk.Duration.minutes(2)
    });

    const deliveryStreamRole = new iam.Role(this, 'Delivery Stream Role', {
      assumedBy: new iam.ServicePrincipal('firehose.amazonaws.com'),
    });

    deliveryStreamRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName('AmazonKinesisFullAccess')
    )

    const destinationRole = new iam.Role(this, 'Destination Role', {
      assumedBy: new CompositePrincipal(
        new ServicePrincipal("firehose.amazonaws.com"),
      ),
    });

    destinationRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess')
    );
    destinationRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess')
    );
    destinationRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName('AmazonAthenaFullAccess')
    );
    destinationRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName('AWSLambda_FullAccess')
    );
    destinationRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
    );
    destinationRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName('AmazonKinesisFullAccess')
    );

    const cloudfront_realtime_log_delivery_stream_cfn = new CfnDeliveryStream(this, 'cloudfrontKinesisFirehoseDeliveryStream', {
      deliveryStreamName: cloudfront_realtime_log_stream.streamName + '_delivery_stream',
      deliveryStreamType: 'KinesisStreamAsSource',
      kinesisStreamSourceConfiguration: {
        kinesisStreamArn: cloudfront_realtime_log_stream.streamArn,
        roleArn: deliveryStreamRole.roleArn
      },
      extendedS3DestinationConfiguration: {
        bucketArn: cloudfront_monitoring_s3_bucket.bucketArn,
        bufferingHints: {
          sizeInMBs: 128,
          intervalInSeconds: 60
        },
        dataFormatConversionConfiguration: {
          enabled: false
        },
        dynamicPartitioningConfiguration: {
          retryOptions: {
            durationInSeconds: 20
          },
          enabled: true
        },
        cloudWatchLoggingOptions: {
          enabled: true,
          logGroupName: "/aws/kinesisfirehose/" + cloudfront_realtime_log_stream.streamName + '_delivery_stream',
          logStreamName: "DestinationDelivery"
        },
        encryptionConfiguration: {
          noEncryptionConfig: "NoEncryption"
        },
        prefix: "year=!{partitionKeyFromLambda:year}/month=!{partitionKeyFromLambda:month}/day=!{partitionKeyFromLambda:day}/hour=!{partitionKeyFromLambda:hour}/minute=!{partitionKeyFromLambda:minute}/domain=!{partitionKeyFromLambda:domain}/",
        errorOutputPrefix: 'failed/',
        roleArn: destinationRole.roleArn,
        processingConfiguration: {
          enabled: true,
          processors: [
            {
              type: "Lambda",
              parameters: [
                {
                  parameterName: "LambdaArn",
                  parameterValue: cloudfrontRealtimeLogTransformer.functionArn
                },
                {
                  parameterName: "NumberOfRetries",
                  parameterValue: "3"
                },
                {
                  parameterName: "RoleArn",
                  parameterValue: lambdaRole.roleArn
                },
                {
                  parameterName: "BufferSizeInMBs",
                  parameterValue: "3"
                },
                {
                  parameterName: "BufferIntervalInSeconds",
                  parameterValue: "60"
                }
              ]
            },
            {
              type: "RecordDeAggregation",
              parameters: [
                {
                  parameterName: "SubRecordType",
                  parameterValue: "JSON"
                }
              ]
            }
          ]
        },
        s3BackupMode: "Disabled"
      }
    });
    cloudfront_realtime_log_delivery_stream_cfn.node.addDependency(cloudfront_realtime_log_stream)
    cloudfront_realtime_log_delivery_stream_cfn.node.addDependency(deliveryStreamRole)
    cloudfront_realtime_log_delivery_stream_cfn.node.addDependency(cloudfront_monitoring_s3_bucket)
    cloudfront_realtime_log_delivery_stream_cfn.node.addDependency(destinationRole)
    cloudfront_realtime_log_delivery_stream_cfn.node.addDependency(cloudfrontRealtimeLogTransformer)

    const cloudfront5MinutesRuleFirst = new Rule(this, 'CloudfrontLogs_5_minutes_rule_first', {
      schedule: Schedule.expression("cron(0/5 * * * ? *)"),
    });

    const lambdaMetricsCollectorBandwidthCdn = new LambdaFunction(metricsCollectorBandwidthCdn);
    const lambdaMetricsCollectorBandwidthOrigin = new LambdaFunction(metricsCollectorBandwidthOrigin);
    const lambdaMetricsCollectorChrBandwidth = new LambdaFunction(metricsCollectorChrBandwidth);
    const lambdaMetricsCollectorDownloadSpeedOrigin = new LambdaFunction(metricsCollectorDownloadSpeedOrigin);
    const lambdaMetricsCollectorDownloadSpeedCDN = new LambdaFunction(metricsCollectorDownloadSpeedCDN);

    cloudfront5MinutesRuleFirst.addTarget(lambdaMetricsCollectorBandwidthOrigin);
    cloudfront5MinutesRuleFirst.addTarget(lambdaMetricsCollectorChrBandwidth);
    cloudfront5MinutesRuleFirst.addTarget(lambdaMetricsCollectorDownloadSpeedCDN);
    cloudfront5MinutesRuleFirst.addTarget(lambdaMetricsCollectorDownloadSpeedOrigin);
    cloudfront5MinutesRuleFirst.addTarget(lambdaMetricsCollectorBandwidthCdn);

    const cloudfront5MinutesRuleSecond = new Rule(this, 'CloudfrontLogs_5_minutes_rule_second', {
      schedule: Schedule.expression("cron(0/5 * * * ? *)"),
    });
    const lambdaMetricsCollectorStatusCodeCDN = new LambdaFunction(metricsCollectorStatusCodeCDN);
    const lambdaMetricsCollectorStatusCodeOrigin = new LambdaFunction(metricsCollectorStatusCodeOrigin);
    const lambdaMetricsCollectorRequestCDN = new LambdaFunction(metricsCollectorRequestCDN);
    const lambdaMetricsCollectorRequestOrigin = new LambdaFunction(metricsCollectorRequestOrigin);
    const lambdaMetricsCollectorChrRequest = new LambdaFunction(metricsCollectorChrRequest);

    cloudfront5MinutesRuleSecond.addTarget(lambdaMetricsCollectorStatusCodeCDN);
    cloudfront5MinutesRuleSecond.addTarget(lambdaMetricsCollectorStatusCodeOrigin);
    cloudfront5MinutesRuleSecond.addTarget(lambdaMetricsCollectorRequestCDN);
    cloudfront5MinutesRuleSecond.addTarget(lambdaMetricsCollectorRequestOrigin);
    cloudfront5MinutesRuleSecond.addTarget(lambdaMetricsCollectorChrRequest);

    const cloudfrontRuleAddPartition = new Rule(this, 'CloudfrontLogs_add_partition', {
      schedule: Schedule.expression("cron(0 22 * * ? *)"),
    });
    const lambdaAddPartition = new LambdaFunction(addPartition);
    cloudfrontRuleAddPartition.addTarget(lambdaAddPartition);

    const cloudfrontRuleDeletePartition = new Rule(this, 'CloudfrontLogs_delete_partition', {
      schedule: Schedule.expression("cron(0 5 * * ? *)"),
    });
    const lambdaDeletePartition = new LambdaFunction(deletePartition);
    cloudfrontRuleDeletePartition.addTarget(lambdaDeletePartition);

    new cdk.CfnOutput(this, 'cloudfront_monitoring_s3_bucket', { value: cloudfront_monitoring_s3_bucket.bucketName });
    new cdk.CfnOutput(this, 'cloudfront_metrics_dynamodb', { value: cloudfront_metrics_table.tableName });
    new cdk.CfnOutput(this, 'api-gateway_policy', { value: api_client_policy.managedPolicyName });
    new cdk.CfnOutput(this, 'glue_table_name', { value: 'cloudfront_realtime_log' });
  }
}
