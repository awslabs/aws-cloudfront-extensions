import * as glue from "@aws-cdk/aws-glue-alpha";
import * as appsync from '@aws-cdk/aws-appsync-alpha';
import { S3ToLambda } from '@aws-solutions-constructs/aws-s3-lambda';
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
import { CompositePrincipal, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Bucket, BucketEncryption, ObjectOwnership } from "aws-cdk-lib/aws-s3";
import * as cr from 'aws-cdk-lib/custom-resources';
import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from "aws-cdk-lib/custom-resources";
import { Construct } from 'constructs';
import { randomBytes } from 'crypto';
import * as path from 'path';

export interface MonitoringProps extends cdk.NestedStackProps {
  nonRealTimeMonitoring: string,
  domainList: string,
  monitoringInterval: string,
  logKeepingDays: number,
  deleteLogNonRealtime: string,
  useStartTimeNonRealtime: string,
  shardCount: number,
  portalBucket: cdk.aws_s3.Bucket,
  appsyncLambda: lambda.Function
}

export class NonRealtimeMonitoringStack extends cdk.NestedStack {

  readonly monitoringUrl: string;
  readonly secretValue: string;

  constructor(scope: Construct, id: string, props: MonitoringProps) {
    super(scope, id, props);
    this.monitoringUrl = '';
    this.secretValue = '';
    this.templateOptions.description = "(SO8150) - Cloudfront Non-Realtime monitoring stack";

    const glueTableName = "cloudfront_standard_log";
    const accessLogBucket = new Bucket(this, 'BucketAccessLog', {
      encryption: BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.RETAIN,
      serverAccessLogsPrefix: 'accessLogBucketAccessLog',
      objectOwnership: ObjectOwnership.OBJECT_WRITER,
    });

    const cfLogBucket = new Bucket(this, 'CloudFrontLogBucket', {
      encryption: BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      serverAccessLogsBucket: accessLogBucket,
      serverAccessLogsPrefix: 'dataBucketAccessLog',
      objectOwnership: ObjectOwnership.OBJECT_WRITER,
      lifecycleRules: [
        {
          enabled: true,
          expiration: Duration.days(props.logKeepingDays),
        },
      ]
    });

    const cloudfrontMetricsTable = new dynamodb.Table(this, 'CFMetricsFromAccessLog', {
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 40,
      writeCapacity: 20,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      partitionKey: { name: 'metricId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      pointInTimeRecovery: true,
    });

    const readAutoScaling = cloudfrontMetricsTable.autoScaleReadCapacity({
      minCapacity: 1,
      maxCapacity: 10
    });

    readAutoScaling.scaleOnUtilization({
      targetUtilizationPercent: 75
    });

    const glueDatabase = new glue.Database(this, "cf_log_database", {
      databaseName: "cf_log_database"
    });

    const cfGlueTable = new CfnTable(this, 'CFLogGlueTable', {
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
              name: "sc-bytes",
              type: "int"
            },
            {
              name: "c-ip",
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
              name: "sc-status",
              type: "int"
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
            }
          ],
          location: "s3://" + cfLogBucket.bucketName,
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
          parameters: {},
          skewedInfo: {
            skewedColumnValueLocationMaps: {}
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
          }
        ],
        retention: 0,
        name: glueTableName,
      }
    });

    const glueTable = glue.Table.fromTableArn(this, 'GlueTable', cfGlueTable.ref);

    const lambdaRole = new iam.Role(this, 'LambdaRole', {
      assumedBy: new CompositePrincipal(
        new ServicePrincipal("lambda.amazonaws.com"),
      ),
    });
    const partitionRole = new iam.Role(this, 'PartitionS3Role', {
      assumedBy: new CompositePrincipal(
        new ServicePrincipal("lambda.amazonaws.com"),
      ),
    });

    const athenaReadAndWritePolicy = new iam.Policy(this, 'AthenaReadAndWritePolicy', {
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
            "sns:ListTopics",
            "sns:GetTopicAttributes",
            "cloudwatch:PutMetricAlarm",
            "cloudwatch:DescribeAlarms",
            "cloudwatch:DeleteAlarms"
          ],
        })
      ]
    });
    const s3ReadAndWritePolicy = new iam.Policy(this, 'S3ReadAndWritePolicy', {
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          resources: ['*'],
          actions: [
            "s3:Get*",
            "s3:Copy*",
            "s3:PutObject",
            "s3:List*",
            "s3:Delete*"
          ],
        })
      ]
    });
    const lambdaReadAndWritePolicy = new iam.Policy(this, 'LambdaReadAndWritePolicy', {
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
    const cloudfrontPolicy = new iam.Policy(this, 'MonitoringCFPolicy', {
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
    const ddbReadAndWritePolicy = new iam.Policy(this, 'DDBReadAndWritePolicy', {
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          resources: [cloudfrontMetricsTable.tableArn],
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
    const cloudwatchPolicy = new iam.Policy(this, 'CloudWatchPolicy', {
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          resources: ['*'],
          actions: [
            "cloudwatch:GetMetricStatistics",
            "cloudwatch:GetMetricData"
          ]
        })
      ]
    });
    lambdaRole.attachInlinePolicy(athenaReadAndWritePolicy);
    lambdaRole.attachInlinePolicy(lambdaReadAndWritePolicy);
    lambdaRole.attachInlinePolicy(s3ReadAndWritePolicy);
    lambdaRole.attachInlinePolicy(ddbReadAndWritePolicy);
    lambdaRole.attachInlinePolicy(cloudfrontPolicy);
    lambdaRole.attachInlinePolicy(cloudwatchPolicy);
    partitionRole.attachInlinePolicy(lambdaReadAndWritePolicy);
    partitionRole.attachInlinePolicy(s3ReadAndWritePolicy);
    partitionRole.attachInlinePolicy(athenaReadAndWritePolicy);

    const cloudfrontSharedLayer = new lambda.LayerVersion(this, 'CFSharedLayer', {
      compatibleRuntimes: [
        lambda.Runtime.PYTHON_3_10,
      ],
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/shared_lib')),
      description: 'shared lib for CloudFront monitoring',
    });

    const addPartition = new lambda.Function(this, 'AddPartition', {
      runtime: lambda.Runtime.PYTHON_3_10,
      handler: 'add_partition.lambda_handler',
      memorySize: 256,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/non_realtime/add_partition')),
      role: partitionRole,
      environment: {
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: glueTableName,
        S3_BUCKET: cfLogBucket.bucketName,
        ACCOUNT_ID: this.account,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    const deletePartition = new lambda.Function(this, 'DeletePartition', {
      runtime: lambda.Runtime.PYTHON_3_10,
      handler: 'delete_partition.lambda_handler',
      memorySize: 256,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/non_realtime/delete_partition')),
      role: partitionRole,
      environment: {
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: glueTableName,
        ACCOUNT_ID: this.account,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    const partitionS3 = new S3ToLambda(this, 'PartitionS3Logs', {
      lambdaFunctionProps: {
        code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/non_realtime/partition_s3_logs')),
        runtime: lambda.Runtime.PYTHON_3_10,
        handler: 'partition_s3_logs.lambda_handler',
        memorySize: 256,
        role: partitionRole,
        timeout: cdk.Duration.seconds(900),
        environment: {
          DELETE_LOG: props.deleteLogNonRealtime,
        },
      },
      existingBucketObj: cfLogBucket,
    });

    const metricsCollectorBandwidthCdn = new lambda.Function(this, 'MetricsCollectorBandwidthCDN', {
      runtime: lambda.Runtime.PYTHON_3_10,
      handler: 'metric_collector_bandwidth_cdn.lambda_handler',
      memorySize: 256,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/non_realtime/metric_collector_bandwidth_cdn')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfrontMetricsTable.tableName,
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: glueTableName,
        S3_BUCKET: cfLogBucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: props.domainList,
        INTERVAL: props.monitoringInterval,
        REGION_NAME: this.region,
        USE_START_TIME: props.useStartTimeNonRealtime,
        IS_REALTIME: 'False',
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [cloudfrontSharedLayer]
    });

    const metricsCollectorBandwidthOrigin = new lambda.Function(this, 'MetricsCollectorBandwidthOrigin', {
      runtime: lambda.Runtime.PYTHON_3_10,
      handler: 'metric_collector_bandwidth_origin.lambda_handler',
      memorySize: 256,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/non_realtime/metric_collector_bandwidth_origin')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfrontMetricsTable.tableName,
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: glueTableName,
        S3_BUCKET: cfLogBucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: props.domainList,
        INTERVAL: props.monitoringInterval,
        REGION_NAME: this.region,
        USE_START_TIME: props.useStartTimeNonRealtime,
        IS_REALTIME: 'False',
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [cloudfrontSharedLayer]
    });

    const metricsCollectorChrBandwidth = new lambda.Function(this, 'MetricsCollectorChrBandwidth', {
      runtime: lambda.Runtime.PYTHON_3_10,
      handler: 'metric_collector_chr_bandwidth.lambda_handler',
      memorySize: 256,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/non_realtime/metric_collector_chr_bandwidth')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfrontMetricsTable.tableName,
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: glueTableName,
        S3_BUCKET: cfLogBucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: props.domainList,
        INTERVAL: props.monitoringInterval,
        REGION_NAME: this.region,
        USE_START_TIME: props.useStartTimeNonRealtime,
        IS_REALTIME: 'False',
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [cloudfrontSharedLayer]
    });

    const metricsCollectorChrRequest = new lambda.Function(this, 'MetricsCollectorChrRequest', {
      runtime: lambda.Runtime.PYTHON_3_10,
      handler: 'metric_collector_chr_request.lambda_handler',
      memorySize: 256,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/non_realtime/metric_collector_chr_request')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfrontMetricsTable.tableName,
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: glueTableName,
        S3_BUCKET: cfLogBucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: props.domainList,
        INTERVAL: props.monitoringInterval,
        REGION_NAME: this.region,
        USE_START_TIME: props.useStartTimeNonRealtime,
        IS_REALTIME: 'False',
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [cloudfrontSharedLayer]
    });

    const metricsCollectorRequestCDN = new lambda.Function(this, 'MetricsCollectorRequestCDN', {
      runtime: lambda.Runtime.PYTHON_3_10,
      handler: 'metric_collector_request_cdn.lambda_handler',
      memorySize: 256,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/non_realtime/metric_collector_request_cdn')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfrontMetricsTable.tableName,
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: glueTableName,
        S3_BUCKET: cfLogBucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: props.domainList,
        INTERVAL: props.monitoringInterval,
        REGION_NAME: this.region,
        USE_START_TIME: props.useStartTimeNonRealtime,
        IS_REALTIME: 'False',
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [cloudfrontSharedLayer]
    });

    const metricsCollectorByCloudWatch = new lambda.Function(this, 'metricsCollectorByCloudWatch', {
      runtime: lambda.Runtime.PYTHON_3_10,
      handler: 'metric_collector_by_cloudwatch_for_tencent.lambda_handler',
      memorySize: 256,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/non_realtime/metrics_collector_by_cloudwatch')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfrontMetricsTable.tableName,
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: glueTableName,
        S3_BUCKET: cfLogBucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: props.domainList,
        INTERVAL: props.monitoringInterval,
        REGION_NAME: this.region,
        USE_START_TIME: props.useStartTimeNonRealtime,
        IS_REALTIME: 'False',
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [cloudfrontSharedLayer]
    });

    const metricsCollectorRequestOrigin = new lambda.Function(this, 'MetricsCollectorRequestOrigin', {
      runtime: lambda.Runtime.PYTHON_3_10,
      handler: 'metric_collector_request_origin.lambda_handler',
      memorySize: 256,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/non_realtime/metric_collector_request_origin')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfrontMetricsTable.tableName,
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: glueTableName,
        S3_BUCKET: cfLogBucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: props.domainList,
        INTERVAL: props.monitoringInterval,
        REGION_NAME: this.region,
        USE_START_TIME: props.useStartTimeNonRealtime,
        IS_REALTIME: 'False',
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [cloudfrontSharedLayer]
    });

    const metricsCollectorStatusCodeCDN = new lambda.Function(this, 'MetricsCollectorStatusCodeCDN', {
      runtime: lambda.Runtime.PYTHON_3_10,
      handler: 'metric_collector_status_code_cdn.lambda_handler',
      memorySize: 256,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/non_realtime/metric_collector_status_code_cdn')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfrontMetricsTable.tableName,
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: glueTableName,
        S3_BUCKET: cfLogBucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: props.domainList,
        INTERVAL: props.monitoringInterval,
        REGION_NAME: this.region,
        USE_START_TIME: props.useStartTimeNonRealtime,
        IS_REALTIME: 'False',
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [cloudfrontSharedLayer]
    });

    const metricsCollectorStatusCodeOrigin = new lambda.Function(this, 'MetricsCollectorStatusCodeOrigin', {
      runtime: lambda.Runtime.PYTHON_3_10,
      handler: 'metric_collector_status_code_origin.lambda_handler',
      memorySize: 256,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/non_realtime/metric_collector_status_code_origin')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfrontMetricsTable.tableName,
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: glueTableName,
        S3_BUCKET: cfLogBucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: props.domainList,
        INTERVAL: props.monitoringInterval,
        REGION_NAME: this.region,
        USE_START_TIME: props.useStartTimeNonRealtime,
        IS_REALTIME: 'False',
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [cloudfrontSharedLayer]
    });

    const metricsCollectorTopRequest = new lambda.Function(this, 'metricsCollectorTopRequest', {
      runtime: lambda.Runtime.PYTHON_3_10,
      handler: 'metric_collector_top_url_request.lambda_handler',
      memorySize: 256,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/non_realtime/metric_collector_top_url_request')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfrontMetricsTable.tableName,
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: glueTableName,
        S3_BUCKET: cfLogBucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: props.domainList,
        INTERVAL: props.monitoringInterval,
        REGION_NAME: this.region,
        USE_START_TIME: props.useStartTimeNonRealtime,
        IS_REALTIME: 'False',
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [cloudfrontSharedLayer]
    });

    const metricsCollectorTopTraffic = new lambda.Function(this, 'metricsCollectorTopTraffic', {
      runtime: lambda.Runtime.PYTHON_3_10,
      handler: 'metric_collector_top_url_traffic.lambda_handler',
      memorySize: 256,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/non_realtime/metric_collector_top_url_traffic')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfrontMetricsTable.tableName,
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: glueTableName,
        S3_BUCKET: cfLogBucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: props.domainList,
        INTERVAL: props.monitoringInterval,
        REGION_NAME: this.region,
        USE_START_TIME: props.useStartTimeNonRealtime,
        IS_REALTIME: 'False',
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [cloudfrontSharedLayer]
    });

    const metricsCollectorLatencyRatio = new lambda.Function(this, 'metricsCollectorLatencyRatio', {
      runtime: lambda.Runtime.PYTHON_3_10,
      handler: 'metric_collector_latency_ratio.lambda_handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/non_realtime/metric_collector_latency_ratio')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfrontMetricsTable.tableName,
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: glueTableName,
        S3_BUCKET: cfLogBucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: props.domainList,
        INTERVAL: props.monitoringInterval,
        LATENCY_LIMIT: '1',
        REGION_NAME: this.region,
        USE_START_TIME: props.useStartTimeNonRealtime,
        IS_REALTIME: 'False',
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [cloudfrontSharedLayer]
    });

    const metricsCollectorDownstreamTraffic = new lambda.Function(this, 'metricsCollectorDownstreamTraffic', {
      runtime: lambda.Runtime.PYTHON_3_10,
      handler: 'metric_collector_traffic.lambda_handler',
      memorySize: 256,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/non_realtime/metric_collector_traffic')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfrontMetricsTable.tableName,
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: glueTableName,
        S3_BUCKET: cfLogBucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: props.domainList,
        INTERVAL: props.monitoringInterval,
        REGION_NAME: this.region,
        USE_START_TIME: props.useStartTimeNonRealtime,
        IS_REALTIME: 'False',
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [cloudfrontSharedLayer]
    });

    const metricsCollectorEdgeType = new lambda.Function(this, 'metricsCollectorEdgeType', {
      runtime: lambda.Runtime.PYTHON_3_10,
      handler: 'metric_collector_edge_type.lambda_handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/non_realtime/metric_collector_edge_type')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfrontMetricsTable.tableName,
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: glueTableName,
        S3_BUCKET: cfLogBucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: props.domainList,
        INTERVAL: props.monitoringInterval,
        REGION_NAME: this.region,
        USE_START_TIME: props.useStartTimeNonRealtime,
        IS_REALTIME: 'False',
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [cloudfrontSharedLayer]
    });

    const metricsManager = new lambda.Function(this, 'MetricsManager', {
      runtime: lambda.Runtime.PYTHON_3_10,
      handler: 'metric_manager.lambda_handler',
      memorySize: 2048,
      timeout: cdk.Duration.seconds(60),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/metric_manager')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfrontMetricsTable.tableName,
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: glueTableName,
        S3_BUCKET: cfLogBucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: props.domainList,
        INTERVAL: props.monitoringInterval,
        REGION_NAME: this.region
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [cloudfrontSharedLayer]
    });

    // Custom resource to add partitions once the CloudFormation is completed
    const crLambda = new lambda.Function(this, "AddPartNonRealTimeCR", {
      description: "This lambda function add partitions for glue table.",
      runtime: lambda.Runtime.PYTHON_3_10,
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/non_realtime/custom_resource')),
      handler: "custom_resource.lambda_handler",
      role: lambdaRole,
      environment: {
        LAMBDA_ARN: addPartition.functionArn,
        APPSYNC_NAME: props.appsyncLambda.functionName,
        DDB_TABLE_NAME: cloudfrontMetricsTable.tableName,
        LIST_COUNTRY_ROLE_ARN: lambdaRole.roleArn,
      },
      memorySize: 256,
      timeout: cdk.Duration.seconds(300),
    });

    const customResourceProvider = new cr.Provider(this, 'customResourceProvider', {
      onEventHandler: crLambda,
      logRetention: logs.RetentionDays.ONE_DAY,
    });

    new CustomResource(this, 'AddPartNonRealtimeCR', {
      serviceToken: customResourceProvider.serviceToken,
      resourceType: "Custom::AddPartNonRealtime",
    });

    addPartition.node.addDependency(glueDatabase);
    addPartition.node.addDependency(glueTable);
    addPartition.node.addDependency(cfLogBucket);
    deletePartition.node.addDependency(glueDatabase);
    deletePartition.node.addDependency(glueTable);
    crLambda.node.addDependency(addPartition);
    crLambda.node.addDependency(cloudfrontMetricsTable);

    metricsCollectorBandwidthCdn.node.addDependency(cloudfrontMetricsTable);
    metricsCollectorBandwidthCdn.node.addDependency(glueDatabase);
    metricsCollectorBandwidthCdn.node.addDependency(glueTable);
    metricsCollectorBandwidthCdn.node.addDependency(cfGlueTable);
    metricsCollectorBandwidthCdn.node.addDependency(cfLogBucket);
    metricsCollectorBandwidthOrigin.node.addDependency(cloudfrontMetricsTable);
    metricsCollectorBandwidthOrigin.node.addDependency(glueDatabase);
    metricsCollectorBandwidthOrigin.node.addDependency(glueTable);
    metricsCollectorBandwidthOrigin.node.addDependency(cfGlueTable);
    metricsCollectorBandwidthOrigin.node.addDependency(cfLogBucket);
    metricsCollectorChrBandwidth.node.addDependency(cloudfrontMetricsTable);
    metricsCollectorChrBandwidth.node.addDependency(glueDatabase);
    metricsCollectorChrBandwidth.node.addDependency(glueTable);
    metricsCollectorChrBandwidth.node.addDependency(cfGlueTable);
    metricsCollectorChrBandwidth.node.addDependency(cfLogBucket);
    metricsCollectorChrRequest.node.addDependency(cloudfrontMetricsTable);
    metricsCollectorChrRequest.node.addDependency(glueDatabase);
    metricsCollectorChrRequest.node.addDependency(glueTable);
    metricsCollectorChrRequest.node.addDependency(cfGlueTable);
    metricsCollectorChrRequest.node.addDependency(cfLogBucket);
    metricsCollectorLatencyRatio.node.addDependency(cloudfrontMetricsTable);
    metricsCollectorLatencyRatio.node.addDependency(glueDatabase);
    metricsCollectorLatencyRatio.node.addDependency(glueTable);
    metricsCollectorLatencyRatio.node.addDependency(cfGlueTable);
    metricsCollectorLatencyRatio.node.addDependency(cfLogBucket);
    metricsCollectorStatusCodeCDN.node.addDependency(cloudfrontMetricsTable);
    metricsCollectorStatusCodeCDN.node.addDependency(glueDatabase);
    metricsCollectorStatusCodeCDN.node.addDependency(glueTable);
    metricsCollectorStatusCodeCDN.node.addDependency(cfGlueTable);
    metricsCollectorStatusCodeCDN.node.addDependency(cfLogBucket);
    metricsCollectorStatusCodeOrigin.node.addDependency(cloudfrontMetricsTable);
    metricsCollectorStatusCodeOrigin.node.addDependency(glueDatabase);
    metricsCollectorStatusCodeOrigin.node.addDependency(glueTable);
    metricsCollectorStatusCodeOrigin.node.addDependency(cfGlueTable);
    metricsCollectorStatusCodeOrigin.node.addDependency(cfLogBucket);
    metricsCollectorRequestCDN.node.addDependency(cloudfrontMetricsTable);
    metricsCollectorRequestCDN.node.addDependency(glueDatabase);
    metricsCollectorRequestCDN.node.addDependency(glueTable);
    metricsCollectorRequestCDN.node.addDependency(cfGlueTable);
    metricsCollectorRequestCDN.node.addDependency(cfLogBucket);
    metricsCollectorByCloudWatch.node.addDependency(cloudfrontMetricsTable);
    metricsCollectorByCloudWatch.node.addDependency(glueDatabase);
    metricsCollectorByCloudWatch.node.addDependency(glueTable);
    metricsCollectorByCloudWatch.node.addDependency(cfGlueTable);
    metricsCollectorByCloudWatch.node.addDependency(cfLogBucket);
    metricsCollectorRequestOrigin.node.addDependency(cloudfrontMetricsTable);
    metricsCollectorRequestOrigin.node.addDependency(glueDatabase);
    metricsCollectorRequestOrigin.node.addDependency(glueTable);
    metricsCollectorRequestOrigin.node.addDependency(cfGlueTable);
    metricsCollectorRequestOrigin.node.addDependency(cfLogBucket);
    metricsCollectorTopRequest.node.addDependency(cloudfrontMetricsTable);
    metricsCollectorTopRequest.node.addDependency(glueDatabase);
    metricsCollectorTopRequest.node.addDependency(glueTable);
    metricsCollectorTopRequest.node.addDependency(cfGlueTable);
    metricsCollectorTopRequest.node.addDependency(cfLogBucket);
    metricsCollectorTopTraffic.node.addDependency(cloudfrontMetricsTable);
    metricsCollectorTopTraffic.node.addDependency(glueDatabase);
    metricsCollectorTopTraffic.node.addDependency(glueTable);
    metricsCollectorTopTraffic.node.addDependency(cfGlueTable);
    metricsCollectorTopTraffic.node.addDependency(cfLogBucket);
    metricsCollectorDownstreamTraffic.node.addDependency(cloudfrontMetricsTable);
    metricsCollectorDownstreamTraffic.node.addDependency(glueDatabase);
    metricsCollectorDownstreamTraffic.node.addDependency(glueTable);
    metricsCollectorDownstreamTraffic.node.addDependency(cfGlueTable);
    metricsCollectorDownstreamTraffic.node.addDependency(cfLogBucket);
    metricsCollectorEdgeType.node.addDependency(cloudfrontMetricsTable);
    metricsCollectorEdgeType.node.addDependency(glueDatabase);
    metricsCollectorEdgeType.node.addDependency(glueTable);
    metricsCollectorEdgeType.node.addDependency(cfGlueTable);
    metricsCollectorEdgeType.node.addDependency(cfLogBucket);

    metricsManager.node.addDependency(cloudfrontMetricsTable);
    metricsManager.node.addDependency(glueDatabase);
    metricsManager.node.addDependency(glueTable);
    metricsManager.node.addDependency(cfGlueTable);
    metricsManager.node.addDependency(cfLogBucket);

    const logGroup = new logs.LogGroup(this, "CloudfrontPerformanceMetrics_non-realtime_ApiGatewayAccessLogs");
    const metricApi = new LambdaRestApi(this, 'CloudfrontPerformanceMetrics', {
      handler: metricsManager,
      description: "Restful api to get the cloudfront performance data",
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

    const performance_metric_proxy = metricApi.root.addResource('metric');
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
        restApi: metricApi
      }),
    });

    const usagePlan = metricApi.addUsagePlan('CFMonitoringUsagePlan', {
      description: 'CF monitoring usage plan',
    });

    this.secretValue = randomBytes(16).toString('base64');
    const apiKey = metricApi.addApiKey('CFMonitoringApiKey', {
      value: this.secretValue,
    });
    usagePlan.addApiKey(apiKey);
    usagePlan.addApiStage({
      stage: metricApi.deploymentStage,
    });
    this.monitoringUrl = `https://${metricApi.restApiId}.execute-api.${this.region}.amazonaws.com/${metricApi.deploymentStage.stageName}`;

    const cloudfront5MinutesRuleFirst = new Rule(this, 'CFStandardLogs_5_minutes_rule_1', {
      schedule: Schedule.expression("cron(0/" + props.monitoringInterval + " * * * ? *)"),
    });

    const lambdaMetricsCollectorBandwidthCdn = new LambdaFunction(metricsCollectorBandwidthCdn);
    const lambdaMetricsCollectorBandwidthOrigin = new LambdaFunction(metricsCollectorBandwidthOrigin);
    const lambdaMetricsCollectorChrBandwidth = new LambdaFunction(metricsCollectorChrBandwidth);
    const lambdaMetricsCollectorChrRequest = new LambdaFunction(metricsCollectorChrRequest);
    const lambdaMetricsCollectorDownstreamTraffic = new LambdaFunction(metricsCollectorDownstreamTraffic);
    const lambdaMetricsCollectorByCloudWatch = new LambdaFunction(metricsCollectorByCloudWatch);

    cloudfront5MinutesRuleFirst.addTarget(lambdaMetricsCollectorBandwidthOrigin);
    cloudfront5MinutesRuleFirst.addTarget(lambdaMetricsCollectorChrBandwidth);
    cloudfront5MinutesRuleFirst.addTarget(lambdaMetricsCollectorChrRequest);
    cloudfront5MinutesRuleFirst.addTarget(lambdaMetricsCollectorBandwidthCdn);
    cloudfront5MinutesRuleFirst.addTarget(lambdaMetricsCollectorDownstreamTraffic);
    cloudfront5MinutesRuleFirst.addTarget(lambdaMetricsCollectorByCloudWatch);

    const cloudfront5MinutesRuleSecond = new Rule(this, 'CFStandardLogs_5_minutes_rule_2', {
      schedule: Schedule.expression("cron(0/" + props.monitoringInterval + " * * * ? *)"),
    });
    const lambdaMetricsCollectorStatusCodeCDN = new LambdaFunction(metricsCollectorStatusCodeCDN);
    const lambdaMetricsCollectorStatusCodeOrigin = new LambdaFunction(metricsCollectorStatusCodeOrigin);
    const lambdaMetricsCollectorRequestCDN = new LambdaFunction(metricsCollectorRequestCDN);
    const lambdaMetricsCollectorRequestOrigin = new LambdaFunction(metricsCollectorRequestOrigin);
    const lambdaMetricsCollectorLatencyRatio = new LambdaFunction(metricsCollectorLatencyRatio);

    cloudfront5MinutesRuleSecond.addTarget(lambdaMetricsCollectorStatusCodeCDN);
    cloudfront5MinutesRuleSecond.addTarget(lambdaMetricsCollectorStatusCodeOrigin);
    cloudfront5MinutesRuleSecond.addTarget(lambdaMetricsCollectorRequestCDN);
    cloudfront5MinutesRuleSecond.addTarget(lambdaMetricsCollectorRequestOrigin);
    cloudfront5MinutesRuleSecond.addTarget(lambdaMetricsCollectorLatencyRatio);

    const cloudfront5MinutesRuleThird = new Rule(this, 'CFStandardLogs_5_minutes_rule_3', {
      schedule: Schedule.expression("cron(0/" + props.monitoringInterval + " * * * ? *)"),
    });
    const lambdaMetricsCollectorEdgeType = new LambdaFunction(metricsCollectorEdgeType);
    cloudfront5MinutesRuleThird.addTarget(lambdaMetricsCollectorEdgeType);

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

    const cloudfrontRuleTopUrl = new Rule(this, 'cloudfrontRuleTopUrl', {
      schedule: Schedule.expression("cron(0 1 * * ? *)"),
    });
    const lambdaMetricsCollectorTopTraffic = new LambdaFunction(metricsCollectorTopTraffic);
    const lambdaMetricsCollectorTopRequest = new LambdaFunction(metricsCollectorTopRequest);
    cloudfrontRuleTopUrl.addTarget(lambdaMetricsCollectorTopTraffic);
    cloudfrontRuleTopUrl.addTarget(lambdaMetricsCollectorTopRequest);

    const configFn = 'aws-monitoring-exports.json';
    const configLambda = new AwsCustomResource(this, 'monitoringConfig', {
      logRetention: logs.RetentionDays.ONE_DAY,
      onUpdate: {
        action: 'putObject',
        parameters: {
          Body: JSON.stringify({
            'aws_monitoring_url': this.monitoringUrl,
            'aws_monitoring_api_key': this.secretValue,
            'aws_monitoring_stack_name': 'NonRealtimeMonitoringStack'
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

    new cdk.CfnOutput(this, 'S3 bucket to store CloudFront logs', { value: cfLogBucket.bucketName });
    new cdk.CfnOutput(this, 'Dynamodb table', { value: cloudfrontMetricsTable.tableName });
    new cdk.CfnOutput(this, 'Glue table', { value: glueTableName });
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


