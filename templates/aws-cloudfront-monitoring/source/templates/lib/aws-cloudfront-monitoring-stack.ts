import * as path from 'path';
import * as lambda from '@aws-cdk/aws-lambda';
import * as cdk from '@aws-cdk/core';
import {CfnParameter, CfnParameterProps, Construct, Duration, RemovalPolicy, Stack, StackProps} from '@aws-cdk/core';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as iam from '@aws-cdk/aws-iam';
import {ManagedPolicy} from '@aws-cdk/aws-iam';
import * as logs from '@aws-cdk/aws-logs';
import {AuthorizationType, CognitoUserPoolsAuthorizer, EndpointType, LambdaRestApi} from "@aws-cdk/aws-apigateway";
import * as cognito from '@aws-cdk/aws-cognito';
import {Bucket, BucketEncryption} from "@aws-cdk/aws-s3";
import * as kinesis from "@aws-cdk/aws-kinesis";
import {DeliveryStream, LambdaFunctionProcessor} from "@aws-cdk/aws-kinesisfirehose";
import * as destinations from '@aws-cdk/aws-kinesisfirehose-destinations';
import {Database, InputFormat, OutputFormat, SerializationLibrary, Table } from "@aws-cdk/aws-glue"

export class SolutionStack extends Stack {
  private _paramGroup: { [grpname: string]: CfnParameter[] } = {}

  protected setDescription(description: string) {
    this.templateOptions.description = description;
  }

  protected newParam(id: string, props?: CfnParameterProps): CfnParameter {
    return new CfnParameter(this, id, props);
  }

  protected addGroupParam(props: { [key: string]: CfnParameter[] }): void {
    for (const key of Object.keys(props)) {
      const params = props[key];
      this._paramGroup[key] = params.concat(this._paramGroup[key] ?? []);
    }
    this._setParamGroups();
  }

  private _setParamGroups(): void {
    if (!this.templateOptions.metadata) {
      this.templateOptions.metadata = {};
    }
    const mkgrp = (label: string, params: CfnParameter[]) => {
      return {
        Label: {default: label},
        Parameters: params.map(p => {
          return p ? p.logicalId : '';
        }).filter(id => id),
      };
    };
    this.templateOptions.metadata['AWS::CloudFormation::Interface'] = {
      ParameterGroups: Object.keys(this._paramGroup).map(key => mkgrp(key, this._paramGroup[key])),
    };
  }
}

export class CloudFrontMonitoringStack extends SolutionStack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);

    this.setDescription("(SO8150) - Cloudfront monitoring stack.");

    const CloudFrontLogKeepingDays = new CfnParameter(this, 'CloudFrontLogKeepDays', {
      description: 'Max number of days to keep cloudfront realtime logs in S3',
      type: 'Number',
      default: 120,
    })

    const deployStage = new CfnParameter(this, 'deployStage', {
      description: 'stageName of the deployment, this allow multiple deployment into one account',
      type: 'String',
      default: 'prod',
      allowedValues: ['dev','beta','gamma','preprod','prod']
    })

    cdk.Tags.of(this).add('stage', deployStage.valueAsString,{
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



    // create Dynamodb table to save the captcha index file
    const cloudfront_metrics_table = new dynamodb.Table(this, 'CloudFrontMetricsTable', {
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 1,
      writeCapacity: 1,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      partitionKey: {name: 'metricId', type: dynamodb.AttributeType.STRING},
      sortKey: {name: 'timestamp', type: dynamodb.AttributeType.STRING},
      pointInTimeRecovery: true,
    });

    const readAutoScaling = cloudfront_metrics_table.autoScaleReadCapacity({
      minCapacity: 1,
      maxCapacity: 10
    });

    readAutoScaling.scaleOnUtilization({
      targetUtilizationPercent: 75
    })

    const lambdaRole = new iam.Role(this, 'LambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
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


    // define add partition lambda function
    const addPartition = new lambda.Function(this, 'add-partition-lambda', {
      functionName: "addPartition",
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'index.handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda.d/add_partition')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfront_metrics_table.tableName,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // define delete partition lambda function
    const deletePartition = new lambda.Function(this, 'delete-partition-lambda', {
      functionName: "deletePartition",
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'index.handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda.d/delete_partition')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfront_metrics_table.tableName,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    const metricsCollectorBandwidthCdn = new lambda.Function(this, 'metrics_collector_bandwidth_cdn', {
      functionName: "metricsCollectorBandwidthCdn",
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'index.handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda.d/metric_collector_bandwidth_cdn')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfront_metrics_table.tableName,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    const metricsCollectorBandwidthOrigin = new lambda.Function(this, 'metrics_collector_bandwidth_origin', {
      functionName: "metricsCollectorBandwidthOrigin",
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'index.handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda.d/metric_collector_bandwidth_origin')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfront_metrics_table.tableName,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    const metricsCollectorChrBandwidth = new lambda.Function(this, 'metrics_collector_chr_bandwidth', {
      functionName: "metricsCollectorChrBandwidth",
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'index.handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda.d/metric_collector_chr_bandwidth')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfront_metrics_table.tableName,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    const metricsCollectorChrRequest = new lambda.Function(this, 'metrics_collector_chr_request', {
      functionName: "metricsCollectorChrRequest",
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'index.handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda.d/metric_collector_chr_request')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfront_metrics_table.tableName,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    const metricsCollectorDownloadSpeedCDN = new lambda.Function(this, 'metrics_collector_download_speed_cdn', {
      functionName: "metricsCollectorDownloadSpeedCDN",
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'index.handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda.d/metric_collector_download_speed_cdn')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfront_metrics_table.tableName,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    const metricsCollectorDownloadSpeedOrigin = new lambda.Function(this, 'metrics_collector_download_speed_origin', {
      functionName: "metricsCollectorDownloadSpeedOrigin",
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'index.handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda.d/metric_collector_bandwidth_origin')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfront_metrics_table.tableName,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    const metricsCollectorRequestCDN = new lambda.Function(this, 'metrics_collector_request_cdn', {
      functionName: "metricsCollectorRequestCDN",
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'index.handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda.d/metric_collector_request_cdn')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfront_metrics_table.tableName,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    const metricsCollectorRequestOrigin = new lambda.Function(this, 'metrics_collector_request_origin', {
      functionName: "metricsCollectorRequestOrigin",
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'index.handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda.d/metric_collector_request_origin')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfront_metrics_table.tableName,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    const metricsCollectorStatusCodeCDN = new lambda.Function(this, 'metrics_collector_status_code_cdn', {
      functionName: "metricsCollectorStatusCodeCDN",
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'index.handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda.d/metric_collector_status_code_cdn')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfront_metrics_table.tableName,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    const metricsCollectorStatusCodeOrigin = new lambda.Function(this, 'metrics_collector_status_code_origin', {
      functionName: "metricsCollectorStatusCodeOrigin",
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'index.handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda.d/metric_collector_status_code_orgin')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfront_metrics_table.tableName,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    const metricsManager = new lambda.Function(this, 'metrics_manager', {
      functionName: "matrics_manager",
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'index.handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(900),
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda.d/metric_manager')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: cloudfront_metrics_table.tableName,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    addPartition.node.addDependency(cloudfront_metrics_table);
    deletePartition.node.addDependency(cloudfront_metrics_table);
    metricsCollectorBandwidthCdn.node.addDependency(cloudfront_metrics_table);
    metricsCollectorBandwidthOrigin.node.addDependency(cloudfront_metrics_table);
    metricsCollectorChrBandwidth.node.addDependency(cloudfront_metrics_table);
    metricsCollectorChrRequest.node.addDependency(cloudfront_metrics_table);
    metricsCollectorDownloadSpeedOrigin.node.addDependency(cloudfront_metrics_table);
    metricsCollectorDownloadSpeedCDN.node.addDependency(cloudfront_metrics_table);
    metricsCollectorStatusCodeCDN.node.addDependency(cloudfront_metrics_table);
    metricsCollectorStatusCodeOrigin.node.addDependency(cloudfront_metrics_table);
    metricsCollectorRequestCDN.node.addDependency(cloudfront_metrics_table);
    metricsCollectorRequestOrigin.node.addDependency(cloudfront_metrics_table);
    metricsManager.node.addDependency(cloudfront_metrics_table);


    const rest_api = new LambdaRestApi(this, 'performance_metrics_restfulApi', {
      handler: metricsManager,
      description: "restful api to get the cloudfront performance data",
      proxy: false,
      restApiName:'CloudfrontPerformanceMetrics',
      endpointConfiguration: {
        types: [ EndpointType.EDGE]
      }
    })

    // create cognito user pool
    const cloudfront_metrics_userpool = new cognito.UserPool(this, 'CloudFrontMetricsCognitoUserPool', {
      userPoolName: 'cloudfront-metrics-userpool',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
    });

    const cognitoAuthorizer = new CognitoUserPoolsAuthorizer(this, `Cloudfront-Metrics-CognitoAuthorizer`, {
      authorizerName : `Metric-Cognito-Authorizer`,
      cognitoUserPools : [ cloudfront_metrics_userpool ],
      identitySource : "method.request.header.Authorization"
    });

    const performance_metric_proxy = rest_api.root.addResource('metric');
    performance_metric_proxy.addMethod('GET', undefined, {
      authorizationType: AuthorizationType.COGNITO,
      authorizer: cognitoAuthorizer
    });

    //Policy to allow client to call this restful api
    const api_client_policy = new ManagedPolicy(this, "cloudfront_metrics_api_client_policy", {
      managedPolicyName: "cloudfront_metric_client_policy_"+deployStage.valueAsString,
      description: "policy for client to call stage:"+deployStage.valueAsString,
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
      shardCount: 200
    })

    // Provide a Lambda function that will transform records before delivery, with custom
    // buffering and retry configuration
    const cloudfrontRealtimeLogTransformer = new lambda.Function(this, 'Cloudfront-realtime-log-transformer', {
      functionName: "cf-real-time-logs-transformer",
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'app.lambda_handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../../../../edge/python/rt_log_transformer/rt_log_transformer')),
    });

    const lambdaProcessor = new LambdaFunctionProcessor(cloudfrontRealtimeLogTransformer, {
      bufferInterval: cdk.Duration.minutes(1),
      bufferSize: cdk.Size.mebibytes(3),
      retries: 3,
    });

    const deliveryStreamRole = new iam.Role(this, 'Delivery Stream Role', {
      assumedBy: new iam.ServicePrincipal('firehose.amazonaws.com'),
    });
    const destinationRole = new iam.Role(this, 'Destination Role', {
      assumedBy: new iam.ServicePrincipal('firehose.amazonaws.com'),
    });

    const s3Destination = new destinations.S3Bucket(cloudfront_monitoring_s3_bucket, {
      processor: lambdaProcessor,
      role:destinationRole
    });

    const cloudfront_realtime_log_delivery_stream = new DeliveryStream(this, 'Delivery Stream', {
      sourceStream: cloudfront_realtime_log_stream,
      destinations: [s3Destination],
      role: deliveryStreamRole
    });

    const glueDatabase = new Database(this, "cf_reatime_database",{
      databaseName: "glue_accesslogs_database"
    });
    const glueTable = new Table(this, "cf_realtime_logs", {
      compressed: false,
      columns: [
        {
          name: "timestamp",
          type: {
              inputString: "bigint",
              isPrimitive: false
          }
        },
        {
          name: "c-ip",
          type: {
            inputString: "string",
            isPrimitive: true
          }
        },
        {
          name: "time-to-first-byte",
          type: {
            inputString: "float",
            isPrimitive: false
          }
        },
        {
          name: "sc-status",
          type: {
            inputString: "int",
            isPrimitive: true
          }
        },
        {
          name: "sc-bytes",
          type: {
            inputString: "int",
            isPrimitive: true
          }
        },
        {
          name: "cs-method",
          type: {
            inputString: "string",
            isPrimitive: true
          }
        },
        {
          name: "cs-protocol",
          type: {
            inputString: "string",
            isPrimitive: true
          }
        },
        {
          name: "cs-host",
          type: {
            inputString: "string",
            isPrimitive: true
          }
        },
        {
          name: "cs-uri-stem",
          type: {
            inputString: "string",
            isPrimitive: true
          }
        },
        {
          name: "cs-bytes",
          type: {
            inputString: "int",
            isPrimitive: true
          }
        },
        {
          name: "x-edge-location",
          type: {
            inputString: "string",
            isPrimitive: true
          }
        },
        {
          name: "x-edge-request-id",
          type: {
            inputString: "string",
            isPrimitive: true
          }
        },
        {
          name: "x-host-header",
          type: {
            inputString: "string",
            isPrimitive: true
          }
        },
        {
          name: "time-taken",
          type: {
            inputString: "float",
            isPrimitive: false
          }
        },
        {
          name: "cs-protocol-version",
          type: {
            inputString: "string",
            isPrimitive: true
          }
        },
        {
          name: "c-ip-version",
          type: {
            inputString: "string",
            isPrimitive: true
          }
        },
        {
          name: "cs-user-agent",
          type: {
            inputString: "string",
            isPrimitive: true
          }
        },
        {
          name: "cs-referer",
          type: {
            inputString: "string",
            isPrimitive: true
          }
        },
        {
          name: "cs-cookie",
          type: {
            inputString: "string",
            isPrimitive: true
          }
        },
        {
          name: "cs-uri-query",
          type: {
            inputString: "string",
            isPrimitive: true
          }
        },
        {
          name: "x-edge-response-result-type",
          type: {
            inputString: "string",
            isPrimitive: true
          }
        },
        {
          name: "x-forwarded-for",
          type: {
            inputString: "string",
            isPrimitive: true
          }
        },
        {
          name: "ssl-protocol",
          type: {
            inputString: "string",
            isPrimitive: true
          }
        },
        {
          name: "ssl-cipher",
          type: {
            inputString: "string",
            isPrimitive: true
          }
        },
        {
          name: "x-edge-result-type",
          type: {
            inputString: "string",
            isPrimitive: true
          }
        },
        {
          name: "fle-encrypted-fields",
          type: {
            inputString: "string",
            isPrimitive: true
          }
        },
        {
          name: "fle-status",
          type: {
            inputString: "string",
            isPrimitive: true
          }
        },
        {
          name: "sc-content-type",
          type: {
            inputString: "string",
            isPrimitive: true
          }
        },
        {
          name: "sc-content-len",
          type: {
            inputString: "int",
            isPrimitive: true
          }
        },
        {
          name: "sc-range-start",
          type: {
            inputString: "int",
            isPrimitive: true
          }
        },
        {
          name: "sc-range-end",
          type: {
            inputString: "int",
            isPrimitive: true
          }
        },
        {
          name: "c-port",
          type: {
            inputString: "int",
            isPrimitive: true
          }
        },
        {
          name: "x-edge-detailed-result-type",
          type: {
            inputString: "string",
            isPrimitive: true
          }
        },
        {
          name: "c-country",
          type: {
            inputString: "string",
            isPrimitive: true
          }
        },
        {
          name: "cs-accept-encoding",
          type: {
            inputString: "string",
            isPrimitive: true
          }
        },
        {
          name: "cs-accept",
          type: {
            inputString: "string",
            isPrimitive: true
          }
        },
        {
          name: "cache-behavior-path-pattern",
          type: {
            inputString: "string",
            isPrimitive: true
          }
        },
        {
          name: "cs-headers",
          type: {
            inputString: "string",
            isPrimitive: true
          }
        },
        {
          name: "cs-header-names",
          type: {
            inputString: "string",
            isPrimitive: true
          }
        },
        {
          name: "cs-headers-count",
          type: {
            inputString: "int",
            isPrimitive: true
          }
        },
        {
          name: "isp",
          type: {
            inputString: "string",
            isPrimitive: true
          }
        },
        {
          name: "country-name",
          type: {
            inputString: "string",
            isPrimitive: true
          }
        }
      ],
      tableName: "cloudfront_realtime_log",
      database: glueDatabase,
      dataFormat:{
        // inputFormat: new InputFormat("TEXT"),
        // outputFormat: new OutputFormat("HIVE_IGNORE_KEY_TEXT"),
        inputFormat: new InputFormat('org.apache.hadoop.mapred.TextInputFormat'),
        outputFormat: new OutputFormat('org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat'),
        serializationLibrary: new SerializationLibrary('org.apache.hadoop.hive.serde2.lazy.LazySimpleSerDe')
      },
      bucket: cloudfront_monitoring_s3_bucket
    });

    new cdk.CfnOutput(this,'cloudfront_monitoring_s3_bucket', {value: cloudfront_monitoring_s3_bucket.bucketName});
    new cdk.CfnOutput(this,'cloudfront_metrics_dynamodb', {value: cloudfront_metrics_table.tableName});
    new cdk.CfnOutput(this,'api-gateway_policy', {value: api_client_policy.managedPolicyName});
    new cdk.CfnOutput(this,'glue_table_name',{value:glueTable.tableName});
    new cdk.CfnOutput(this,'realtime_log_firehose_delivery',{value:cloudfront_realtime_log_delivery_stream.deliveryStreamName})
  }
}
