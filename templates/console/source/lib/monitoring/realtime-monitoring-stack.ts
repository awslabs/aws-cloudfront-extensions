import * as glue from "@aws-cdk/aws-glue-alpha";
import * as appsync from '@aws-cdk/aws-appsync-alpha';
import * as cdk from 'aws-cdk-lib';
import { CustomResource, Duration, RemovalPolicy } from 'aws-cdk-lib';
import {
  AccessLogFormat,
  EndpointType,
  LambdaRestApi, LogGroupLogDestination,
  RequestValidator
} from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Rule, Schedule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { CfnTable } from 'aws-cdk-lib/aws-glue';
import * as iam from 'aws-cdk-lib/aws-iam';
import { CompositePrincipal, ManagedPolicy, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import * as kinesis from "aws-cdk-lib/aws-kinesis";
import { StreamEncryption } from "aws-cdk-lib/aws-kinesis";
import { CfnDeliveryStream } from "aws-cdk-lib/aws-kinesisfirehose";
import * as kms from "aws-cdk-lib/aws-kms";
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Bucket, BucketEncryption, ObjectOwnership } from "aws-cdk-lib/aws-s3";
import * as cr from 'aws-cdk-lib/custom-resources';
import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from "aws-cdk-lib/custom-resources";
import { Construct } from 'constructs';
import { randomBytes } from 'crypto';
import * as path from 'path';
import { MonitoringProps } from './non-realtime-monitoring-stack';

export class RealtimeMonitoringStack extends cdk.NestedStack {

  readonly monitoringUrl: string;
  readonly secretValue: string;

  constructor(scope: Construct, id: string, props: MonitoringProps) {
    super(scope, id, props);
    this.monitoringUrl = '';
    this.secretValue = '';
    this.templateOptions.description = "(SO8150) - Cloudfront Realime monitoring stack";

    const accessLogBucket = new Bucket(this, 'BucketAccessLog', {
      encryption: BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.RETAIN,
      objectOwnership: ObjectOwnership.OBJECT_WRITER,
    });

    const cloudfront_monitoring_s3_bucket = new Bucket(this, 'CloudfrontMonitoringS3Bucket', {
      encryption: BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      serverAccessLogsBucket: accessLogBucket,
      objectOwnership: ObjectOwnership.OBJECT_WRITER,
      lifecycleRules: [
        {
          enabled: true,
          expiration: Duration.days(props.logKeepingDays),
        },
      ]
    });

    // create Dynamodb table to save the cloudfront metrics data
    const cloudfront_metrics_table = new dynamodb.Table(this, 'CloudFrontMetricsTable', {
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 40,
      writeCapacity: 20,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      partitionKey: { name: 'metricId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      pointInTimeRecovery: true,
    });

    const readAutoScaling = cloudfront_metrics_table.autoScaleReadCapacity({
      minCapacity: 1,
      maxCapacity: 10
    });

    readAutoScaling.scaleOnUtilization({
      targetUtilizationPercent: 75
    });

    const cloudfront_realtime_log_stream = new kinesis.Stream(this, "TaskStream", {
      streamName: "cloudfront-real-time-log-data-stream",
      shardCount: props.shardCount,
      encryption: StreamEncryption.MANAGED
    });

    const glueDatabase = new glue.Database(this, "cf_realtime_log_glue_database", {
      databaseName: "glue_cf_realtime_log_database"
    });

    const glueTableCFN = new CfnTable(this, 'GlueTable', {
      databaseName: glueDatabase.databaseName,
      catalogId: glueDatabase.catalogId,
      tableInput: {
        tableType: "EXTERNAL_TABLE",
        parameters: {
          external: "TRUE"
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
              name: "sc-status",
              type: "int"
            },
            {
              name: "sc-bytes",
              type: "int"
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
              name: "time-taken",
              type: "float"
            },
            {
              name: "x-edge-response-result-type",
              type: "string"
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

    const glueTable = glue.Table.fromTableArn(this, 'glue_table', glueTableCFN.ref)

    const lambdaRole = new iam.Role(this, 'LambdaRole', {
      assumedBy: new CompositePrincipal(
        new ServicePrincipal("firehose.amazonaws.com"),
        new ServicePrincipal("lambda.amazonaws.com"),
      ),
    });

    const ddbReadAndWritePolicy = new iam.Policy(this, 'DDBReadAndWritePolicy', {
      policyName: 'DDBReadAndWritePolicy',
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          resources: [cloudfront_metrics_table.tableArn],
          actions: [
            "dynamodb:*",
            "iam:CreateServiceLinkedRole",
            "iam:PassRole",
            "iam:GetRole",
            "iam:ListRoles"
          ]
        })
      ]
    });

    const s3ReadAndWritePolicy = new iam.Policy(this, 'S3ReadAndWritePolicy', {
      policyName: 'S3ReadAndWritePolicy',
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          resources: ['*'],
          actions: [
            "s3:*"
          ]
        })
      ]
    });

    const athenaReadAndWritePolicy = new iam.Policy(this, 'AthenaReadAndWritePolicy', {
      policyName: 'AthenaReadAndWritePolicy',
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          resources: ['*'],
          actions: [
            "glue:Create*",
            "glue:DeleteDatabase",
            "glue:Get*",
            "glue:UpdateDatabase",
            "glue:CreateTable",
            "glue:DeleteTable",
            "glue:BatchDeleteTable",
            "glue:UpdateTable",
            "glue:BatchCreatePartition",
            "glue:CreatePartition",
            "glue:DeletePartition",
            "glue:BatchDeletePartition",
            "glue:UpdatePartition",
            "glue:BatchGetPartition",
            "athena:*",
            "s3:GetBucketLocation",
            "s3:GetObject",
            "s3:ListBucket",
            "s3:ListBucketMultipartUploads",
            "s3:ListMultipartUploadParts",
            "s3:AbortMultipartUpload",
            "s3:CreateBucket",
            "s3:PutObject",
            "s3:PutBucketPublicAccessBlock",
            "s3:ListAllMyBuckets",
            "sns:ListTopics",
            "sns:GetTopicAttributes",
            "cloudwatch:PutMetricAlarm",
            "cloudwatch:DescribeAlarms",
            "cloudwatch:DeleteAlarms",
            "lakeformation:GetDataAccess"
          ],
        })
      ]
    });

    const lambdaReadAndWritePolicy = new iam.Policy(this, 'LambdaReadAndWritePolicy', {
      policyName: 'LambdaReadAndWritePolicy',
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          resources: [
            `arn:aws:lambda:*:${cdk.Aws.ACCOUNT_ID}:layer:*`,
            `arn:aws:lambda:*:${cdk.Aws.ACCOUNT_ID}:function:*:*`,
            `arn:aws:lambda:*:${cdk.Aws.ACCOUNT_ID}:layer:*:*`,
            `arn:aws:lambda:*:${cdk.Aws.ACCOUNT_ID}:function:*`,
            `arn:aws:lambda:*:${cdk.Aws.ACCOUNT_ID}:function:*:*`
          ],
          actions: [
            "lambda:*"
          ],
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          resources: [
            `arn:aws:iam::${cdk.Aws.ACCOUNT_ID}:role/*`
          ],
          actions: [
            "iam:*",
          ],
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          resources: [
            `arn:aws:logs:*:${cdk.Aws.ACCOUNT_ID}:log-group:*`,
            `arn:aws:logs:*:${cdk.Aws.ACCOUNT_ID}:log-group:*:log-stream:*`
          ],
          actions: [
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents"
          ],
        })
      ]
    });

    const kinesisReadAndWritePolicy = new iam.Policy(this, 'KinesisReadAndWritePolicy', {
      policyName: 'KinesisReadAndWritePolicy',
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          resources: [
            `arn:aws:kinesis:*:${cdk.Aws.ACCOUNT_ID}:*/*/consumer/*:*`,
            `arn:aws:kms:*:${cdk.Aws.ACCOUNT_ID}:key/*`,
            `arn:aws:kinesis:*:${cdk.Aws.ACCOUNT_ID}:stream/*`
          ],
          actions: [
            "kinesis:*",
          ]
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          resources: [`arn:aws:firehose:*:${cdk.Aws.ACCOUNT_ID}:deliverystream/*`],
          actions: [
            "firehose:*",
          ]
        })
      ]
    });

    const cfPolicy = new iam.Policy(this, 'MonitoringCFPolicy', {
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          resources: ['*'],
          actions: [
            "cloudfront:Get*",
            "cloudfront:List*",
          ]
        })
      ]
    });

    lambdaRole.attachInlinePolicy(ddbReadAndWritePolicy);
    lambdaRole.attachInlinePolicy(s3ReadAndWritePolicy);
    lambdaRole.attachInlinePolicy(athenaReadAndWritePolicy);
    lambdaRole.attachInlinePolicy(lambdaReadAndWritePolicy);
    lambdaRole.attachInlinePolicy(kinesisReadAndWritePolicy);
    lambdaRole.attachInlinePolicy(cfPolicy);

    // define a shared lambda layer for all other lambda to use
    const cloudfrontSharedLayer = new lambda.LayerVersion(this, 'cloudfront-shared-layer', {
      compatibleRuntimes: [
        lambda.Runtime.PYTHON_3_9,
      ],
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/shared_lib')),
      description: 'shared lib for all other lambda functions to use',
    });

    const addPartition = new lambda.Function(this, 'addPartition', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'add_partition.lambda_handler',
      memorySize: 256,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/realtime/add_partition')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfront_metrics_table.tableName,
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: 'cloudfront_realtime_log',
        S3_BUCKET: cloudfront_monitoring_s3_bucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: props.domainList,
        REGION_NAME: this.region
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [cloudfrontSharedLayer]
    });

    const deletePartition = new lambda.Function(this, 'deletePartition', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'delete_partition.lambda_handler',
      memorySize: 256,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/realtime/delete_partition')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfront_metrics_table.tableName,
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: 'cloudfront_realtime_log',
        S3_BUCKET: cloudfront_monitoring_s3_bucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: props.domainList,
        REGION_NAME: this.region
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [cloudfrontSharedLayer]
    });

    const metricsCollectorBandwidthCdn = new lambda.Function(this, 'metricsCollectorBandwidthCdn', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'metric_collector_bandwidth_cdn.lambda_handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/realtime/metric_collector_bandwidth_cdn')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfront_metrics_table.tableName,
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: 'cloudfront_realtime_log',
        S3_BUCKET: cloudfront_monitoring_s3_bucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: props.domainList,
        INTERVAL: props.monitoringInterval,
        REGION_NAME: this.region,
        IS_REALTIME: 'True',
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [cloudfrontSharedLayer]
    });

    const metricsCollectorBandwidthOrigin = new lambda.Function(this, 'metricsCollectorBandwidthOrigin', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'metric_collector_bandwidth_origin.lambda_handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/realtime/metric_collector_bandwidth_origin')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfront_metrics_table.tableName,
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: 'cloudfront_realtime_log',
        S3_BUCKET: cloudfront_monitoring_s3_bucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: props.domainList,
        INTERVAL: props.monitoringInterval,
        REGION_NAME: this.region,
        IS_REALTIME: 'True',
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [cloudfrontSharedLayer]
    });

    const metricsCollectorChrBandwidth = new lambda.Function(this, 'metricsCollectorChrBandwidth', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'metric_collector_chr_bandwidth.lambda_handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/realtime/metric_collector_chr_bandwidth')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfront_metrics_table.tableName,
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: 'cloudfront_realtime_log',
        S3_BUCKET: cloudfront_monitoring_s3_bucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: props.domainList,
        INTERVAL: props.monitoringInterval,
        REGION_NAME: this.region,
        IS_REALTIME: 'True',
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [cloudfrontSharedLayer]
    });

    const metricsCollectorChrRequest = new lambda.Function(this, 'metricsCollectorChrRequest', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'metric_collector_chr_request.lambda_handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/realtime/metric_collector_chr_request')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfront_metrics_table.tableName,
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: 'cloudfront_realtime_log',
        S3_BUCKET: cloudfront_monitoring_s3_bucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: props.domainList,
        INTERVAL: props.monitoringInterval,
        REGION_NAME: this.region,
        IS_REALTIME: 'True',
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [cloudfrontSharedLayer]
    });

    const metricsCollectorLatencyRatio = new lambda.Function(this, 'metricsCollectorLatencyRatio', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'metric_collector_latency_ratio.lambda_handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/realtime/metric_collector_latency_ratio')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfront_metrics_table.tableName,
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: 'cloudfront_realtime_log',
        S3_BUCKET: cloudfront_monitoring_s3_bucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: props.domainList,
        INTERVAL: props.monitoringInterval,
        LATENCY_LIMIT: '1',
        REGION_NAME: this.region,
        IS_REALTIME: 'True',
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [cloudfrontSharedLayer]
    });

    // const metricsCollectorDownloadSpeedCDN = new lambda.Function(this, 'metricsCollectorDownloadSpeedCDN', {
    //   runtime: lambda.Runtime.PYTHON_3_9,
    //   handler: 'metric_collector_download_speed_cdn.lambda_handler',
    //   memorySize: 512,
    //   timeout: cdk.Duration.seconds(900),
    //   code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/realtime/metric_collector_download_speed_cdn')),
    //   role: lambdaRole,
    //   environment: {
    //     DDB_TABLE_NAME: cloudfront_metrics_table.tableName,
    //     GLUE_DATABASE_NAME: glueDatabase.databaseName,
    //     GLUE_TABLE_NAME: 'cloudfront_realtime_log',
    //     S3_BUCKET: cloudfront_monitoring_s3_bucket.bucketName,
    //     ACCOUNT_ID: this.account,
    //     DOMAIN_LIST: props.domainList,
    //     INTERVAL: props.monitoringInterval,
    //     REGION_NAME: this.region
    //   },
    //   logRetention: logs.RetentionDays.ONE_WEEK,
    //   layers: [cloudfrontSharedLayer]
    // });

    // const metricsCollectorDownloadSpeedOrigin = new lambda.Function(this, 'metricsCollectorDownloadSpeedOrigin', {
    //   runtime: lambda.Runtime.PYTHON_3_9,
    //   handler: 'metric_collector_download_speed_origin.lambda_handler',
    //   memorySize: 512,
    //   timeout: cdk.Duration.seconds(900),
    //   code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/realtime/metric_collector_download_speed_origin')),
    //   role: lambdaRole,
    //   environment: {
    //     DDB_TABLE_NAME: cloudfront_metrics_table.tableName,
    //     GLUE_DATABASE_NAME: glueDatabase.databaseName,
    //     GLUE_TABLE_NAME: 'cloudfront_realtime_log',
    //     S3_BUCKET: cloudfront_monitoring_s3_bucket.bucketName,
    //     ACCOUNT_ID: this.account,
    //     DOMAIN_LIST: props.domainList,
    //     INTERVAL: props.monitoringInterval,
    //     REGION_NAME: this.region
    //   },
    //   logRetention: logs.RetentionDays.ONE_WEEK,
    //   layers: [cloudfrontSharedLayer]
    // });

    const metricsCollectorRequestCDN = new lambda.Function(this, 'metricsCollectorRequest', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'metric_collector_request_cdn.lambda_handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/realtime/metric_collector_request_cdn')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfront_metrics_table.tableName,
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: 'cloudfront_realtime_log',
        S3_BUCKET: cloudfront_monitoring_s3_bucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: props.domainList,
        INTERVAL: props.monitoringInterval,
        REGION_NAME: this.region,
        IS_REALTIME: 'True',
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [cloudfrontSharedLayer]
    });

    const metricsCollectorRequestOrigin = new lambda.Function(this, 'metricsCollectorRequestOrigin', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'metric_collector_request_origin.lambda_handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/realtime/metric_collector_request_origin')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfront_metrics_table.tableName,
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: 'cloudfront_realtime_log',
        S3_BUCKET: cloudfront_monitoring_s3_bucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: props.domainList,
        INTERVAL: props.monitoringInterval,
        REGION_NAME: this.region,
        IS_REALTIME: 'True',
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [cloudfrontSharedLayer]
    });

    const metricsCollectorStatusCodeCDN = new lambda.Function(this, 'metricsCollectorSC', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'metric_collector_status_code_cdn.lambda_handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/realtime/metric_collector_status_code_cdn')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfront_metrics_table.tableName,
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: 'cloudfront_realtime_log',
        S3_BUCKET: cloudfront_monitoring_s3_bucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: props.domainList,
        INTERVAL: props.monitoringInterval,
        REGION_NAME: this.region,
        IS_REALTIME: 'True',
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [cloudfrontSharedLayer]
    });

    const metricsCollectorStatusCodeOrigin = new lambda.Function(this, 'metricsCollectorSCOrigin', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'metric_collector_status_code_origin.lambda_handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/realtime/metric_collector_status_code_origin')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfront_metrics_table.tableName,
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: 'cloudfront_realtime_log',
        S3_BUCKET: cloudfront_monitoring_s3_bucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: props.domainList,
        INTERVAL: props.monitoringInterval,
        REGION_NAME: this.region,
        IS_REALTIME: 'True',
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [cloudfrontSharedLayer]
    });

    const metricsCollectorTopRequest = new lambda.Function(this, 'metricsCollectorTopRequest', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'metric_collector_top_url_request.lambda_handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/realtime/metric_collector_top_url_request')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfront_metrics_table.tableName,
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: 'cloudfront_realtime_log',
        S3_BUCKET: cloudfront_monitoring_s3_bucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: props.domainList,
        INTERVAL: props.monitoringInterval,
        REGION_NAME: this.region,
        IS_REALTIME: 'True',
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [cloudfrontSharedLayer]
    });

    const metricsCollectorTopTraffic = new lambda.Function(this, 'metricsCollectorTopTraffic', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'metric_collector_top_url_traffic.lambda_handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/realtime/metric_collector_top_url_traffic')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfront_metrics_table.tableName,
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: 'cloudfront_realtime_log',
        S3_BUCKET: cloudfront_monitoring_s3_bucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: props.domainList,
        INTERVAL: props.monitoringInterval,
        REGION_NAME: this.region,
        IS_REALTIME: 'True',
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [cloudfrontSharedLayer]
    });

    const metricsCollectorDownstreamTraffic = new lambda.Function(this, 'metricsCollectorDownstreamTraffic', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'metric_collector_traffic.lambda_handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/realtime/metric_collector_traffic')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfront_metrics_table.tableName,
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: 'cloudfront_realtime_log',
        S3_BUCKET: cloudfront_monitoring_s3_bucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: props.domainList,
        INTERVAL: props.monitoringInterval,
        REGION_NAME: this.region,
        IS_REALTIME: 'True',
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [cloudfrontSharedLayer]
    });

    const metricsCollectorEdgeType = new lambda.Function(this, 'metricsCollectorEdgeType', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'metric_collector_edge_type.lambda_handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/realtime/metric_collector_edge_type')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfront_metrics_table.tableName,
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: 'cloudfront_realtime_log',
        S3_BUCKET: cloudfront_monitoring_s3_bucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: props.domainList,
        INTERVAL: props.monitoringInterval,
        REGION_NAME: this.region,
        IS_REALTIME: 'True',
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [cloudfrontSharedLayer]
    });

    const metricsManager = new lambda.Function(this, 'metricsManager', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'metric_manager.lambda_handler',
      memorySize: 2048,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/metric_manager')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfront_metrics_table.tableName,
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: 'cloudfront_realtime_log',
        S3_BUCKET: cloudfront_monitoring_s3_bucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: props.domainList,
        INTERVAL: props.monitoringInterval,
        REGION_NAME: this.region,
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

    metricsCollectorLatencyRatio.node.addDependency(cloudfront_metrics_table);
    metricsCollectorLatencyRatio.node.addDependency(glueDatabase);
    metricsCollectorLatencyRatio.node.addDependency(glueTable);
    metricsCollectorLatencyRatio.node.addDependency(glueTableCFN);
    metricsCollectorLatencyRatio.node.addDependency(cloudfront_monitoring_s3_bucket);

    // metricsCollectorDownloadSpeedOrigin.node.addDependency(cloudfront_metrics_table);
    // metricsCollectorDownloadSpeedOrigin.node.addDependency(glueDatabase);
    // metricsCollectorDownloadSpeedOrigin.node.addDependency(glueTable);
    // metricsCollectorDownloadSpeedOrigin.node.addDependency(glueTableCFN);
    // metricsCollectorDownloadSpeedOrigin.node.addDependency(cloudfront_monitoring_s3_bucket);

    // metricsCollectorDownloadSpeedCDN.node.addDependency(cloudfront_metrics_table);
    // metricsCollectorDownloadSpeedCDN.node.addDependency(glueDatabase);
    // metricsCollectorDownloadSpeedCDN.node.addDependency(glueTable);
    // metricsCollectorDownloadSpeedCDN.node.addDependency(glueTableCFN);
    // metricsCollectorDownloadSpeedCDN.node.addDependency(cloudfront_monitoring_s3_bucket);

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

    metricsCollectorTopTraffic.node.addDependency(cloudfront_metrics_table);
    metricsCollectorTopTraffic.node.addDependency(glueDatabase);
    metricsCollectorTopTraffic.node.addDependency(glueTable);
    metricsCollectorTopTraffic.node.addDependency(glueTableCFN);
    metricsCollectorTopTraffic.node.addDependency(cloudfront_monitoring_s3_bucket);

    metricsCollectorTopRequest.node.addDependency(cloudfront_metrics_table);
    metricsCollectorTopRequest.node.addDependency(glueDatabase);
    metricsCollectorTopRequest.node.addDependency(glueTable);
    metricsCollectorTopRequest.node.addDependency(glueTableCFN);
    metricsCollectorTopRequest.node.addDependency(cloudfront_monitoring_s3_bucket);

    metricsCollectorDownstreamTraffic.node.addDependency(cloudfront_metrics_table);
    metricsCollectorDownstreamTraffic.node.addDependency(glueDatabase);
    metricsCollectorDownstreamTraffic.node.addDependency(glueTable);
    metricsCollectorDownstreamTraffic.node.addDependency(glueTableCFN);
    metricsCollectorDownstreamTraffic.node.addDependency(cloudfront_monitoring_s3_bucket);

    metricsCollectorEdgeType.node.addDependency(cloudfront_metrics_table);
    metricsCollectorEdgeType.node.addDependency(glueDatabase);
    metricsCollectorEdgeType.node.addDependency(glueTable);
    metricsCollectorEdgeType.node.addDependency(glueTableCFN);
    metricsCollectorEdgeType.node.addDependency(cloudfront_monitoring_s3_bucket);

    metricsManager.node.addDependency(cloudfront_metrics_table);
    metricsManager.node.addDependency(glueDatabase);
    metricsManager.node.addDependency(glueTable);
    metricsManager.node.addDependency(glueTableCFN);
    metricsManager.node.addDependency(cloudfront_monitoring_s3_bucket);

    const logGroup = new logs.LogGroup(this, "CloudfrontPerformanceMetrics_realtime_ApiGatewayAccessLogs");
    const rest_api = new LambdaRestApi(this, 'CloudfrontPerformanceMetrics', {
      handler: metricsManager,
      description: "restful api to get the cloudfront performance data",
      proxy: false,
      endpointConfiguration: {
        types: [EndpointType.EDGE]
      },
      defaultCorsPreflightOptions: {
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
        ],
        allowMethods: ['OPTIONS', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        allowCredentials: true,
        allowOrigins: ['*'],
      },
      deployOptions: {
        accessLogDestination: new LogGroupLogDestination(logGroup),
        accessLogFormat: AccessLogFormat.clf(),
      }
    });

    const performance_metric_proxy = rest_api.root.addResource('metric');
    performance_metric_proxy.addMethod('GET', undefined, {
      requestParameters: {
        'method.request.querystring.Action': false,
        'method.request.querystring.Domains': false,
        'method.request.querystring.StartTime': true,
        'method.request.querystring.EndTime': true,
        'method.request.querystring.Metric': true,
        'method.request.querystring.Project': false,
      },
      apiKeyRequired: true,
      requestValidator: new RequestValidator(this, "metricsApiValidator", {
        validateRequestBody: false,
        validateRequestParameters: true,
        requestValidatorName: 'defaultValidator',
        restApi: rest_api
      }),
    });

    const usagePlan = rest_api.addUsagePlan('CFMonitoringUsagePlan', {
      description: 'CF monitoring usage plan',
    });
    this.secretValue = randomBytes(16).toString('base64');
    const apiKey = rest_api.addApiKey('CFMonitoringApiKey', {
      value: this.secretValue,
    });
    usagePlan.addApiKey(apiKey);
    usagePlan.addApiStage({
      stage: rest_api.deploymentStage,
    });
    this.monitoringUrl = `https://${rest_api.restApiId}.execute-api.${this.region}.amazonaws.com/${rest_api.deploymentStage.stageName}`;

    //Policy to allow client to call this restful api
    const api_client_policy = new ManagedPolicy(this, "CFMetricAPIClientPolicy", {
      description: "policy for client to call restful api",
      statements: [
        new iam.PolicyStatement({
          resources: [rest_api.arnForExecuteApi()],
          actions: ['execute-api:Invoke'],
          effect: iam.Effect.ALLOW,
        }),
      ],
    });

    // Provide a Lambda function that will transform records before delivery, with custom
    // buffering and retry configuration
    // TODO: may need to replace this lambda with SAR
    const cloudfrontRealtimeLogTransformer = new lambda.Function(this, 'Cloudfront-realtime-log-transformer', {
      functionName: "cf-real-time-logs-transformer",
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'app.lambda_handler',
      memorySize: 2048,
      role: lambdaRole,
      code: lambda.Code.fromAsset(path.join(__dirname, '../../../../../edge/python/rt_log_transformer/rt_log_transformer')),
      timeout: cdk.Duration.minutes(2)
    });

    const deliveryStreamRole = new iam.Role(this, 'Delivery Stream Role', {
      assumedBy: new iam.ServicePrincipal('firehose.amazonaws.com'),
    });

    deliveryStreamRole.attachInlinePolicy(kinesisReadAndWritePolicy);

    const destinationRole = new iam.Role(this, 'Destination Role', {
      assumedBy: new CompositePrincipal(
        new ServicePrincipal("firehose.amazonaws.com"),
      ),
    });

    destinationRole.attachInlinePolicy(s3ReadAndWritePolicy);
    destinationRole.attachInlinePolicy(lambdaReadAndWritePolicy);
    destinationRole.attachInlinePolicy(kinesisReadAndWritePolicy);

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
          kmsEncryptionConfig: {
            awskmsKeyArn: kms.Alias.fromAliasName(this, 'S3ManagedKey', 'alias/aws/s3').keyArn
          }
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

    const cloudfront5MinutesRuleFirst = new Rule(this, 'CloudFrontLogs_5_minutes_rule_first', {
      schedule: Schedule.expression("cron(0/" + props.monitoringInterval + " * * * ? *)"),
    });

    const lambdaMetricsCollectorBandwidthCdn = new LambdaFunction(metricsCollectorBandwidthCdn);
    const lambdaMetricsCollectorBandwidthOrigin = new LambdaFunction(metricsCollectorBandwidthOrigin);
    const lambdaMetricsCollectorChrBandwidth = new LambdaFunction(metricsCollectorChrBandwidth);
    // const lambdaMetricsCollectorDownloadSpeedOrigin = new LambdaFunction(metricsCollectorDownloadSpeedOrigin);
    // const lambdaMetricsCollectorDownloadSpeedCDN = new LambdaFunction(metricsCollectorDownloadSpeedCDN);

    cloudfront5MinutesRuleFirst.addTarget(lambdaMetricsCollectorBandwidthOrigin);
    cloudfront5MinutesRuleFirst.addTarget(lambdaMetricsCollectorChrBandwidth);
    // cloudfront5MinutesRuleFirst.addTarget(lambdaMetricsCollectorDownloadSpeedCDN);
    // cloudfront5MinutesRuleFirst.addTarget(lambdaMetricsCollectorDownloadSpeedOrigin);
    cloudfront5MinutesRuleFirst.addTarget(lambdaMetricsCollectorBandwidthCdn);

    const cloudfront5MinutesRuleSecond = new Rule(this, 'CloudFrontLogs_5_minutes_rule_second', {
      schedule: Schedule.expression("cron(0/" + props.monitoringInterval + " * * * ? *)"),
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

    const cloudfront5MinutesRuleThird = new Rule(this, 'CloudFrontLogs_5_minutes_rule_third', {
      schedule: Schedule.expression("cron(0/" + props.monitoringInterval + " * * * ? *)"),
    });
    const lambdaMetricsCollectorDownstreamTraffic = new LambdaFunction(metricsCollectorDownstreamTraffic);
    const lambdaMetricsCollectorLatencyRatio = new LambdaFunction(metricsCollectorLatencyRatio);
    const lambdaMetricsCollectorEdgeType = new LambdaFunction(metricsCollectorEdgeType);

    cloudfront5MinutesRuleThird.addTarget(lambdaMetricsCollectorDownstreamTraffic);
    cloudfront5MinutesRuleThird.addTarget(lambdaMetricsCollectorLatencyRatio);
    cloudfront5MinutesRuleThird.addTarget(lambdaMetricsCollectorEdgeType);

    const cloudfrontRuleAddPartition = new Rule(this, 'CloudFrontLogs_add_partition', {
      schedule: Schedule.expression("cron(0 22 * * ? *)"),
    });
    const lambdaAddPartition = new LambdaFunction(addPartition);
    cloudfrontRuleAddPartition.addTarget(lambdaAddPartition);

    const cloudfrontRuleDeletePartition = new Rule(this, 'CloudFrontLogs_delete_partition', {
      schedule: Schedule.expression("cron(0 5 * * ? *)"),
    });
    const lambdaDeletePartition = new LambdaFunction(deletePartition);
    cloudfrontRuleDeletePartition.addTarget(lambdaDeletePartition);

    const cloudfrontRuleTopUrl = new Rule(this, 'CloudFrontRuleTopUrl', {
      schedule: Schedule.expression("cron(0 1 * * ? *)"),
    });
    const lambdaMetricsCollectorTopTraffic = new LambdaFunction(metricsCollectorTopTraffic);
    const lambdaMetricsCollectorTopRequest = new LambdaFunction(metricsCollectorTopRequest);
    cloudfrontRuleTopUrl.addTarget(lambdaMetricsCollectorTopTraffic);
    cloudfrontRuleTopUrl.addTarget(lambdaMetricsCollectorTopRequest);

    // Custom resource to add partitions once the CloudFormation is completed
    const crLambda = new lambda.Function(this, "AddPartRealTimeCR", {
      description: "This lambda function add partitions for glue table.",
      runtime: lambda.Runtime.PYTHON_3_9,
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/realtime/custom_resource')),
      handler: "custom_resource.lambda_handler",
      role: lambdaRole,
      environment: {
        LAMBDA_ARN: addPartition.functionArn,
        APPSYNC_NAME: props.appsyncLambda.functionName,
        DDB_TABLE_NAME: cloudfront_metrics_table.tableName,
        LIST_COUNTRY_ROLE_ARN: lambdaRole.roleArn, 
      },
      memorySize: 256,
      timeout: cdk.Duration.seconds(300),
    });

    crLambda.node.addDependency(addPartition)
    crLambda.node.addDependency(cloudfront_metrics_table)

    const customResourceProvider = new cr.Provider(this, 'customResourceProviderRT', {
      onEventHandler: crLambda,
      logRetention: logs.RetentionDays.ONE_DAY,
    });

    new CustomResource(this, 'AddPartRealtimeCR', {
      serviceToken: customResourceProvider.serviceToken,
      resourceType: "Custom::AddPartRealtime",
    });

    const configFn = 'aws-monitoring-exports.json';
    const configLambda = new AwsCustomResource(this, 'monitoringConfig', {
      logRetention: logs.RetentionDays.ONE_DAY,
      onUpdate: {
        action: 'putObject',
        parameters: {
          Body: JSON.stringify({
            'aws_monitoring_url': this.monitoringUrl,
            'aws_monitoring_api_key': this.secretValue,
            'aws_monitoring_stack_name': 'RealtimeMonitoringStack'
          }),
          Bucket: props.portalBucket.bucketName,
          CacheControl: 'max-age=0, no-cache, no-store, must-revalidate',
          ContentType: 'application/json',
          Key: configFn,
        },
        service: 'S3',
        physicalResourceId: PhysicalResourceId.of('config'),
      },
      policy: AwsCustomResourcePolicy.fromStatements([
        new iam.PolicyStatement({
          actions: ['s3:PutObject'],
          resources: [props.portalBucket.arnForObjects(configFn)]
        })
      ])
    });

    new cdk.CfnOutput(this, 'S3 Bucket', { value: cloudfront_monitoring_s3_bucket.bucketName });
    new cdk.CfnOutput(this, 'DynamoDB Table', { value: cloudfront_metrics_table.tableName });
    new cdk.CfnOutput(this, 'API Gateway Policy', { value: api_client_policy.managedPolicyName });
    new cdk.CfnOutput(this, 'Glue Table', { value: 'cloudfront_realtime_log' });
    new cdk.CfnOutput(this, "API Key ARN", {
      value: apiKey.keyArn,
      exportName: 'monitoringApiKeyArn'
    });
    new cdk.CfnOutput(this, "Monitoring Url", {
      value: this.monitoringUrl,
      exportName: 'monitoringUrl'
    });
  }
}
