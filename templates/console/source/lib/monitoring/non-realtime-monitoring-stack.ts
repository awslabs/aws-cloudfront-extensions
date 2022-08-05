import * as glue from "@aws-cdk/aws-glue-alpha";
import { S3ToLambda } from '@aws-solutions-constructs/aws-s3-lambda';
import * as cdk from 'aws-cdk-lib';
import { CfnParameter, Duration, RemovalPolicy } from 'aws-cdk-lib';
import {
  EndpointType,
  LambdaRestApi,
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
import { Bucket, BucketEncryption } from "aws-cdk-lib/aws-s3";
import { Construct } from 'constructs';
import * as path from 'path';
import * as cr from 'aws-cdk-lib/custom-resources';
import { CustomResource } from 'aws-cdk-lib';


export class NonRealtimeMonitoringStack extends cdk.NestedStack {
  constructor(scope: Construct, id: string, props?: cdk.NestedStackProps) {
    super(scope, id, props);
    this.templateOptions.description = "(SO8150) - Cloudfront Non-Realtime monitoring stack";

    const CloudFrontDomainList = new CfnParameter(this, 'CloudFrontDomainList', {
      description: 'The domain name to be monitored, input CName if your CloudFront distribution has one or else you can input CloudFront domain name, for example: d1v8v39goa3nap.cloudfront.net. For multiple domain, using \',\' as seperation. Use ALL to monitor all domains',
      type: 'String',
    });
    const CloudFrontLogKeepingDays = new CfnParameter(this, 'CloudFrontLogKeepDays', {
      description: 'Max number of days to keep cloudfront realtime logs in S3',
      type: 'Number',
      default: 120,
    });
    const DeleteLog = new CfnParameter(this, 'DeleteLog', {
      description: 'Delete original CloudFront standard logs in S3 bucket (true or false)',
      type: 'String',
      default: 'false',
    });
    const UseStartTime = new CfnParameter(this, 'UseStartTime', {
      description: 'Set it to true if the Time in metric data is based on start time, set it to false if the Time in metric data is based on end time',
      type: 'String',
      default: 'false',
    });

    const glueTableName = "cloudfront_standard_log";
    const accessLogBucket = new Bucket(this, 'BucketAccessLog', {
      encryption: BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.DESTROY,
      serverAccessLogsPrefix: 'accessLogBucketAccessLog',
    });

    const cfLogBucket = new Bucket(this, 'CloudFrontLogBucket', {
      encryption: BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      serverAccessLogsBucket: accessLogBucket,
      serverAccessLogsPrefix: 'dataBucketAccessLog',
      lifecycleRules: [
        {
          enabled: true,
          expiration: Duration.days(CloudFrontLogKeepingDays.valueAsNumber),
        },
      ]
    });

    const cloudfrontMetricsTable = new dynamodb.Table(this, 'CFMetricsFromAccessLog', {
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 10,
      writeCapacity: 10,
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

    lambdaRole.attachInlinePolicy(athenaReadAndWritePolicy);
    lambdaRole.attachInlinePolicy(lambdaReadAndWritePolicy);
    lambdaRole.attachInlinePolicy(s3ReadAndWritePolicy);
    lambdaRole.attachInlinePolicy(ddbReadAndWritePolicy);
    lambdaRole.attachInlinePolicy(cloudfrontPolicy);
    partitionRole.attachInlinePolicy(lambdaReadAndWritePolicy);
    partitionRole.attachInlinePolicy(s3ReadAndWritePolicy);
    partitionRole.attachInlinePolicy(athenaReadAndWritePolicy);

    const cloudfrontSharedLayer = new lambda.LayerVersion(this, 'CFSharedLayer', {
      compatibleRuntimes: [
        lambda.Runtime.PYTHON_3_9,
      ],
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/non_realtime/shared_lib')),
      description: 'shared lib for CloudFront monitoring',
    });

    const addPartition = new lambda.Function(this, 'AddPartition', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'add_partition.lambda_handler',
      memorySize: 256,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/non_realtime/add_partition')),
      architecture: lambda.Architecture.ARM_64,
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
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'delete_partition.lambda_handler',
      memorySize: 256,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/non_realtime/delete_partition')),
      architecture: lambda.Architecture.ARM_64,
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
        runtime: lambda.Runtime.PYTHON_3_9,
        handler: 'partition_s3_logs.lambda_handler',
        memorySize: 256,
        architecture: lambda.Architecture.ARM_64,
        role: partitionRole,
        timeout: cdk.Duration.seconds(900),
        environment: {
          DELETE_LOG: DeleteLog.valueAsString,
        },
      },
      existingBucketObj: cfLogBucket,
    });

    const metricsCollectorBandwidthCdn = new lambda.Function(this, 'MetricsCollectorBandwidthCDN', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'metric_collector_bandwidth_cdn.lambda_handler',
      memorySize: 256,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/non_realtime/metric_collector_bandwidth_cdn')),
      architecture: lambda.Architecture.ARM_64,
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfrontMetricsTable.tableName,
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: glueTableName,
        S3_BUCKET: cfLogBucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: CloudFrontDomainList.valueAsString,
        REGION_NAME: this.region,
        USE_START_TIME: UseStartTime.valueAsString,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [cloudfrontSharedLayer]
    });

    const metricsCollectorBandwidthOrigin = new lambda.Function(this, 'MetricsCollectorBandwidthOrigin', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'metric_collector_bandwidth_origin.lambda_handler',
      memorySize: 256,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/non_realtime/metric_collector_bandwidth_origin')),
      architecture: lambda.Architecture.ARM_64,
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfrontMetricsTable.tableName,
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: glueTableName,
        S3_BUCKET: cfLogBucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: CloudFrontDomainList.valueAsString,
        REGION_NAME: this.region,
        USE_START_TIME: UseStartTime.valueAsString,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [cloudfrontSharedLayer]
    });

    const metricsCollectorChrBandwidth = new lambda.Function(this, 'MetricsCollectorChrBandwidth', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'metric_collector_chr_bandwidth.lambda_handler',
      memorySize: 256,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/non_realtime/metric_collector_chr_bandwidth')),
      architecture: lambda.Architecture.ARM_64,
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfrontMetricsTable.tableName,
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: glueTableName,
        S3_BUCKET: cfLogBucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: CloudFrontDomainList.valueAsString,
        REGION_NAME: this.region,
        USE_START_TIME: UseStartTime.valueAsString,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [cloudfrontSharedLayer]
    });

    const metricsCollectorChrRequest = new lambda.Function(this, 'MetricsCollectorChrRequest', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'metric_collector_chr_request.lambda_handler',
      memorySize: 256,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/non_realtime/metric_collector_chr_request')),
      architecture: lambda.Architecture.ARM_64,
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfrontMetricsTable.tableName,
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: glueTableName,
        S3_BUCKET: cfLogBucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: CloudFrontDomainList.valueAsString,
        REGION_NAME: this.region,
        USE_START_TIME: UseStartTime.valueAsString,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [cloudfrontSharedLayer]
    });

    const metricsCollectorRequestCDN = new lambda.Function(this, 'MetricsCollectorRequestCDN', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'metric_collector_request_cdn.lambda_handler',
      memorySize: 256,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/non_realtime/metric_collector_request_cdn')),
      architecture: lambda.Architecture.ARM_64,
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfrontMetricsTable.tableName,
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: glueTableName,
        S3_BUCKET: cfLogBucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: CloudFrontDomainList.valueAsString,
        REGION_NAME: this.region,
        USE_START_TIME: UseStartTime.valueAsString,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [cloudfrontSharedLayer]
    });

    const metricsCollectorRequestOrigin = new lambda.Function(this, 'MetricsCollectorRequestOrigin', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'metric_collector_request_origin.lambda_handler',
      memorySize: 256,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/non_realtime/metric_collector_request_origin')),
      architecture: lambda.Architecture.ARM_64,
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfrontMetricsTable.tableName,
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: glueTableName,
        S3_BUCKET: cfLogBucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: CloudFrontDomainList.valueAsString,
        REGION_NAME: this.region,
        USE_START_TIME: UseStartTime.valueAsString,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [cloudfrontSharedLayer]
    });

    const metricsCollectorStatusCodeCDN = new lambda.Function(this, 'MetricsCollectorStatusCodeCDN', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'metric_collector_status_code_cdn.lambda_handler',
      memorySize: 256,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/non_realtime/metric_collector_status_code_cdn')),
      architecture: lambda.Architecture.ARM_64,
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfrontMetricsTable.tableName,
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: glueTableName,
        S3_BUCKET: cfLogBucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: CloudFrontDomainList.valueAsString,
        REGION_NAME: this.region,
        USE_START_TIME: UseStartTime.valueAsString,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [cloudfrontSharedLayer]
    });

    const metricsCollectorStatusCodeOrigin = new lambda.Function(this, 'MetricsCollectorStatusCodeOrigin', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'metric_collector_status_code_origin.lambda_handler',
      memorySize: 256,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/non_realtime/metric_collector_status_code_origin')),
      architecture: lambda.Architecture.ARM_64,
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfrontMetricsTable.tableName,
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: glueTableName,
        S3_BUCKET: cfLogBucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: CloudFrontDomainList.valueAsString,
        REGION_NAME: this.region,
        USE_START_TIME: UseStartTime.valueAsString,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [cloudfrontSharedLayer]
    });

    const metricsCollectorTopRequest = new lambda.Function(this, 'metricsCollectorTopRequest', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'metric_collector_top_url_request.lambda_handler',
      memorySize: 256,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/non_realtime/metric_collector_top_url_request')),
      architecture: lambda.Architecture.ARM_64,
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfrontMetricsTable.tableName,
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: glueTableName,
        S3_BUCKET: cfLogBucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: CloudFrontDomainList.valueAsString,
        REGION_NAME: this.region,
        USE_START_TIME: UseStartTime.valueAsString,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [cloudfrontSharedLayer]
    });

    const metricsCollectorTopTraffic = new lambda.Function(this, 'metricsCollectorTopTraffic', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'metric_collector_top_url_traffic.lambda_handler',
      memorySize: 256,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/non_realtime/metric_collector_top_url_traffic')),
      architecture: lambda.Architecture.ARM_64,
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfrontMetricsTable.tableName,
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: glueTableName,
        S3_BUCKET: cfLogBucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: CloudFrontDomainList.valueAsString,
        REGION_NAME: this.region,
        USE_START_TIME: UseStartTime.valueAsString,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [cloudfrontSharedLayer]
    });

    const metricsCollectorDownstreamTraffic = new lambda.Function(this, 'metricsCollectorDownstreamTraffic', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'metric_collector_traffic.lambda_handler',
      memorySize: 256,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/non_realtime/metric_collector_traffic')),
      architecture: lambda.Architecture.ARM_64,
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfrontMetricsTable.tableName,
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: glueTableName,
        S3_BUCKET: cfLogBucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: CloudFrontDomainList.valueAsString,
        REGION_NAME: this.region,
        USE_START_TIME: UseStartTime.valueAsString,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [cloudfrontSharedLayer]
    });

    const metricsManager = new lambda.Function(this, 'MetricsManager', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'metric_manager.lambda_handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(60),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/non_realtime/metric_manager')),
      architecture: lambda.Architecture.ARM_64,
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfrontMetricsTable.tableName,
        GLUE_DATABASE_NAME: glueDatabase.databaseName,
        GLUE_TABLE_NAME: glueTableName,
        S3_BUCKET: cfLogBucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: CloudFrontDomainList.valueAsString,
        REGION_NAME: this.region
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [cloudfrontSharedLayer]
    });

    // Custom resource to add partitions once the CloudFormation is completed
    const crLambda = new lambda.Function(this, "AddPartNonRealTimeCR", {
      description: "This lambda function add partitions for glue table.",
      runtime: lambda.Runtime.PYTHON_3_9,
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/non_realtime/custom_resource')),
      handler: "custom_resource.lambda_handler",
      architecture: lambda.Architecture.ARM_64,
      role: partitionRole,
      environment: {
        LAMBDA_ARN: addPartition.functionArn,
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

    metricsManager.node.addDependency(cloudfrontMetricsTable);
    metricsManager.node.addDependency(glueDatabase);
    metricsManager.node.addDependency(glueTable);
    metricsManager.node.addDependency(cfGlueTable);
    metricsManager.node.addDependency(cfLogBucket);

    const metricApi = new LambdaRestApi(this, 'CloudfrontPerformanceMetrics', {
      handler: metricsManager,
      description: "Restful api to get the cloudfront performance data",
      proxy: false,
      endpointConfiguration: {
        types: [EndpointType.EDGE]
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
    const apiKey = metricApi.addApiKey('CFMonitoringApiKey');
    usagePlan.addApiKey(apiKey);
    usagePlan.addApiStage({
      stage: metricApi.deploymentStage,
    });

    const cloudfront5MinutesRuleFirst = new Rule(this, 'CFStandardLogs_5_minutes_rule_1', {
      schedule: Schedule.expression("cron(0/5 * * * ? *)"),
    });

    const lambdaMetricsCollectorBandwidthCdn = new LambdaFunction(metricsCollectorBandwidthCdn);
    const lambdaMetricsCollectorBandwidthOrigin = new LambdaFunction(metricsCollectorBandwidthOrigin);
    const lambdaMetricsCollectorChrBandwidth = new LambdaFunction(metricsCollectorChrBandwidth);
    const lambdaMetricsCollectorChrRequest = new LambdaFunction(metricsCollectorChrRequest);
    const lambdaMetricsCollectorDownstreamTraffic = new LambdaFunction(metricsCollectorDownstreamTraffic);

    cloudfront5MinutesRuleFirst.addTarget(lambdaMetricsCollectorBandwidthOrigin);
    cloudfront5MinutesRuleFirst.addTarget(lambdaMetricsCollectorChrBandwidth);
    cloudfront5MinutesRuleFirst.addTarget(lambdaMetricsCollectorChrRequest);
    cloudfront5MinutesRuleFirst.addTarget(lambdaMetricsCollectorBandwidthCdn);
    cloudfront5MinutesRuleFirst.addTarget(lambdaMetricsCollectorDownstreamTraffic);

    const cloudfront5MinutesRuleSecond = new Rule(this, 'CFStandardLogs_5_minutes_rule_2', {
      schedule: Schedule.expression("cron(0/5 * * * ? *)"),
    });
    const lambdaMetricsCollectorStatusCodeCDN = new LambdaFunction(metricsCollectorStatusCodeCDN);
    const lambdaMetricsCollectorStatusCodeOrigin = new LambdaFunction(metricsCollectorStatusCodeOrigin);
    const lambdaMetricsCollectorRequestCDN = new LambdaFunction(metricsCollectorRequestCDN);
    const lambdaMetricsCollectorRequestOrigin = new LambdaFunction(metricsCollectorRequestOrigin);

    cloudfront5MinutesRuleSecond.addTarget(lambdaMetricsCollectorStatusCodeCDN);
    cloudfront5MinutesRuleSecond.addTarget(lambdaMetricsCollectorStatusCodeOrigin);
    cloudfront5MinutesRuleSecond.addTarget(lambdaMetricsCollectorRequestCDN);
    cloudfront5MinutesRuleSecond.addTarget(lambdaMetricsCollectorRequestOrigin);

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

    new cdk.CfnOutput(this, 'S3 bucket to store CloudFront logs', { value: cfLogBucket.bucketName });
    new cdk.CfnOutput(this, 'Dynamodb table', { value: cloudfrontMetricsTable.tableName });
    new cdk.CfnOutput(this, 'Glue table', { value: glueTableName });
    new cdk.CfnOutput(this, "API Key", { value: apiKey.keyArn });

  }

}


