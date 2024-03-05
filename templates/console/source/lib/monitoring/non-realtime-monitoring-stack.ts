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
import {Runtime} from "aws-cdk-lib/aws-lambda";
import { aws_apigateway as apigw } from 'aws-cdk-lib';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as as from 'aws-cdk-lib/aws-autoscaling';
import * as cwa from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { BlockDeviceVolume } from 'aws-cdk-lib/aws-autoscaling';

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
  readonly costUrl: string;
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

    // Used in logging API
    const domainBucket = new Bucket(this, 'CFDomainBucket', {
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
        memorySize: 4096,
        role: partitionRole,
        timeout: cdk.Duration.seconds(900),
        environment: {
          DELETE_LOG: props.deleteLogNonRealtime,
          DOMAIN_S3: domainBucket.bucketName,
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

    const metricsCollectorByCloudWatch = new lambda.Function(this, 'metricsCollectorByCloudWatch', {
      runtime: lambda.Runtime.PYTHON_3_10,
      handler: 'metric_collector_by_cloudwatch_for_tencent.lambda_handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/common/lambda-assets/cloudwatch_api.zip')),
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
    metricsCollectorByCloudWatch.node.addDependency(cloudfrontMetricsTable);
    metricsCollectorByCloudWatch.node.addDependency(glueDatabase);
    metricsCollectorByCloudWatch.node.addDependency(glueTable);
    metricsCollectorByCloudWatch.node.addDependency(cfGlueTable);
    metricsCollectorByCloudWatch.node.addDependency(cfLogBucket);

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

    cloudfront5MinutesRuleFirst.addTarget(lambdaMetricsCollectorBandwidthOrigin);
    cloudfront5MinutesRuleFirst.addTarget(lambdaMetricsCollectorBandwidthCdn);

    const cloudfront5MinutesRuleSecond = new Rule(this, 'CFStandardLogs_5_minutes_rule_2', {
      schedule: Schedule.expression("cron(0/" + props.monitoringInterval + " * * * ? *)"),
    });

    const cloudfront5MinutesRuleThird = new Rule(this, 'CFStandardLogs_5_minutes_rule_3', {
      schedule: Schedule.expression("cron(0/1 * * * ? *)"),
    });
    const lambdaMetricsCollectorByCloudWatch = new LambdaFunction(metricsCollectorByCloudWatch);

    cloudfront5MinutesRuleThird.addTarget(lambdaMetricsCollectorByCloudWatch);

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

    // Cost API
    const costManager = new lambda.Function(this, 'CostManager', {
      runtime: lambda.Runtime.PYTHON_3_10,
      handler: 'cost_manager.lambda_handler',
      memorySize: 2048,
      timeout: cdk.Duration.seconds(60),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/cost_manager')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfrontMetricsTable.tableName,
        S3_BUCKET: cfLogBucket.bucketName,
        ACCOUNT_ID: this.account,
        DOMAIN_LIST: props.domainList,
        INTERVAL: props.monitoringInterval,
        REGION_NAME: this.region
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [cloudfrontSharedLayer]
    });

    costManager.node.addDependency(cloudfrontMetricsTable);
    costManager.node.addDependency(glueDatabase);
    costManager.node.addDependency(glueTable);
    costManager.node.addDependency(cfGlueTable);
    costManager.node.addDependency(cfLogBucket);
    
    const costLogGroup = new logs.LogGroup(this, "CloudfrontCostApiGatewayAccessLogs");

    const costApi = new apigw.RestApi(this, 'CloudFrontCostApi', {
      description: 'CloudFront Cost API',
      deployOptions: {
        accessLogDestination: new LogGroupLogDestination(costLogGroup),
        accessLogFormat: AccessLogFormat.clf(),
      },
      endpointConfiguration: {
        types: [apigw.EndpointType.EDGE],
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: apigw.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key', 'X-Amz-Security-Token', 'X-Amz-User-Agent'], // Customize as needed
      },
    });

    const costApiKey = costApi.addApiKey('costApiKey');

    // Define a resource and a GET method on the API Gateway
    const costApiResource = costApi.root.addResource('cost');
    const costApiIntegration = new apigw.LambdaIntegration(costManager);
    costApiResource.addMethod('GET', costApiIntegration, {
      apiKeyRequired: true,
    });

    const costUsagePlan = costApi.addUsagePlan('CFCostApiUsagePlan', {});
    costUsagePlan.addApiKey(costApiKey);
    costUsagePlan.addApiStage({
      stage: costApi.deploymentStage,
    });

    // this.costUrl = `https://${costApi.restApiId}.execute-api.${this.region}.amazonaws.com/${costApi.deploymentStage.stageName}`;

    // Logging API
    const dlq = new sqs.Queue(this, 'LoggingDLQ', {
      encryption: sqs.QueueEncryption.KMS_MANAGED,
      retentionPeriod: cdk.Duration.days(14),
      visibilityTimeout: cdk.Duration.hours(10),
    });

    const messageQueue = new sqs.Queue(this, 'LoggingMessageQueue', {
      encryption: sqs.QueueEncryption.KMS_MANAGED,
      visibilityTimeout: cdk.Duration.hours(5),
      deadLetterQueue: {
        queue: dlq,
        maxReceiveCount: 50,
      },
    });

    messageQueue.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ["sqs:*"],
        resources: ["*"],
        conditions: {
          Bool: { "aws:SecureTransport": "false" }
        }
      })
    );

    const convertS3Role = new iam.Role(this, 'LoggingRole', {
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal("lambda.amazonaws.com"),
        new iam.ServicePrincipal('ec2.amazonaws.com'),
      ),
    });

    const lambdaPolicy = new iam.Policy(this, 'LoggingLambdaPolicy', {
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
        }),
      ]
    });

    const sqsPolicy = new iam.Policy(this, 'LoggingSQSPolicy', {
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          resources: [messageQueue.queueArn],
          actions: [
            "sqs:DeleteMessage",
            "sqs:GetQueueUrl",
            "sqs:ChangeMessageVisibility",
            "sqs:PurgeQueue",
            "sqs:ReceiveMessage",
            "sqs:SendMessage",
            "sqs:GetQueueAttributes",
            "sqs:SetQueueAttributes",
          ],
        })
      ]
    });

    const cfPolicy = new iam.Policy(this, 'LoggingCFPolicy', {
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          resources: ['*'],
          actions: [
            "cloudfront:Get*",
            "cloudfront:List*",
            "cloudfront:CreateInvalidation",
            "ec2:Start*",
            "ec2:Stop*",
          ]
        })
      ]
    });

    const ec2_cloudwatch_policy = new iam.Policy(
        this,
        "LoggingCWPolicy",{
        statements: [
            new iam.PolicyStatement( {
            effect: iam.Effect.ALLOW,
            resources: ['*'],
            actions: [
              "logs:CreateLogGroup",
              "logs:CreateLogStream",
              "logs:PutLogEvents"]
        })]
    });

    const asgRole = new iam.Role(this, 'LoggingASGRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com')
    });

    convertS3Role.attachInlinePolicy(lambdaPolicy);
    convertS3Role.attachInlinePolicy(sqsPolicy);
    convertS3Role.attachInlinePolicy(cfPolicy);
    convertS3Role.attachInlinePolicy(s3ReadAndWritePolicy);
    asgRole.attachInlinePolicy(sqsPolicy);
    asgRole.attachInlinePolicy(cfPolicy);
    asgRole.attachInlinePolicy(ec2_cloudwatch_policy);
    asgRole.attachInlinePolicy(s3ReadAndWritePolicy);

    const metric = new cloudwatch.MathExpression({
      expression: "visible + hidden",
      usingMetrics: {
        visible: messageQueue.metricApproximateNumberOfMessagesVisible({ period: cdk.Duration.seconds(60) }),
        hidden: messageQueue.metricApproximateNumberOfMessagesNotVisible({ period: cdk.Duration.seconds(60) }),
      },
      period: cdk.Duration.seconds(60),
    });
    const messageAlarm = metric.createAlarm(this, 'LoggingAlarm',
      {
        alarmDescription: 'Logs need to be converted in SQS',
        evaluationPeriods: 1,
        threshold: 0,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        // INSUFFICIENT DATA state in CloudWatch alarm will be ignored
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    const vpc = new ec2.Vpc(this, 'LoggingVpc', {
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'ingress',
          subnetType: ec2.SubnetType.PUBLIC,
        }
      ]
    });
    const securityGroup = new ec2.SecurityGroup(this, 'LoggingSG', { vpc });
    const loggingAsg = new as.AutoScalingGroup(this, 'LoggingASG',
      {
        instanceType: new ec2.InstanceType("c5.2xlarge"),
        machineImage: new ec2.AmazonLinuxImage({ generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2 }),
        vpc: vpc,
        role: asgRole,
        securityGroup: securityGroup,
        allowAllOutbound: true,
        maxCapacity: 50,
        minCapacity: 0,
        desiredCapacity: 0,
        blockDevices: [{
          deviceName: '/dev/xvda',
          volume: BlockDeviceVolume.ebs(300)
        }],
        signals: as.Signals.waitForMinCapacity(),
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        }
      }
    );
    loggingAsg.applyCloudFormationInit(ec2.CloudFormationInit.fromElements(
      ec2.InitFile.fromFileInline('/etc/logging/convert_s3_logs.py', path.join(__dirname, '../../lambda/monitoring/non_realtime/convert_s3_logs/convert_s3_logs.py')),
      ec2.InitFile.fromFileInline('/etc/logging/requirements.txt', path.join(__dirname, '../../lambda/monitoring/non_realtime/convert_s3_logs/requirements.txt')),
    ));
    // Add cron command
    loggingAsg.addUserData(
      'exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1',
      'pip3 install -r /etc/logging/requirements.txt',
      `python3 /etc/logging/convert_s3_logs.py ` + messageQueue.queueUrl + ` ${cdk.Aws.REGION} ` + domainBucket.bucketName
    );

    const agentScaleOut = new as.StepScalingAction(this, 'LoggingScaleOut', {
      autoScalingGroup: loggingAsg,
      adjustmentType: as.AdjustmentType.CHANGE_IN_CAPACITY,
    });
    agentScaleOut.addAdjustment({
      adjustment: 0,
      lowerBound: 0,
      upperBound: 1,
    });
    agentScaleOut.addAdjustment({
      adjustment: 2,
      lowerBound: 1,
    });
    messageAlarm.addAlarmAction(new cwa.AutoScalingAction(agentScaleOut));

    const agentScaleIn = new as.StepScalingAction(this, 'LoggingScaleIn', {
      autoScalingGroup: loggingAsg,
      adjustmentType: as.AdjustmentType.EXACT_CAPACITY,
    });
    agentScaleIn.addAdjustment({
      adjustment: 0,
      lowerBound: 0,
      upperBound: 1,
    });
    agentScaleIn.addAdjustment({
      adjustment: 0,
      lowerBound: 1,
    });
    messageAlarm.addOkAction(new cwa.AutoScalingAction(agentScaleIn));

    const logScheduler = new lambda.Function(this, 'LogScheduler', {
      runtime: lambda.Runtime.PYTHON_3_10,
      handler: 'log_scheduler.lambda_handler',
      memorySize: 256,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/non_realtime/log_scheduler')),
      role: convertS3Role,
      environment: {
        DOMAIN_S3_BUCKET: domainBucket.bucketName,
        SQS_QUEUE_URL: messageQueue.queueUrl,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    const cloudfront1HourRule = new Rule(this, 'CFConvertLogs_1_hour_rule', {
      schedule: Schedule.expression("cron(0 * * * ? *)"),
    });
    const convertRuleTarget = new LambdaFunction(logScheduler);
    cloudfront1HourRule.addTarget(convertRuleTarget);

    new cdk.CfnOutput(this, 'S3 bucket to store CloudFront logs', { value: cfLogBucket.bucketName });
    new cdk.CfnOutput(this, 'S3 bucket to store temp logs', { value: domainBucket.bucketName });
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
    // new cdk.CfnOutput(this, "Cost Url", {
    //   value: this.costUrl,
    //   exportName: 'costUrl'
    // });
  }

}


