import * as path from 'path';
import * as lambda from '@aws-cdk/aws-lambda';
import * as sns from '@aws-cdk/aws-sns';
import * as cdk from '@aws-cdk/core';
import {CfnParameter, CfnParameterProps, Construct, Duration, RemovalPolicy, Stack, StackProps} from '@aws-cdk/core';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as iam from '@aws-cdk/aws-iam';
import {ManagedPolicy} from '@aws-cdk/aws-iam';
import * as logs from '@aws-cdk/aws-logs';
import {BlockPublicAccess, Bucket, BucketEncryption} from "@aws-cdk/aws-s3";
import {GatewayVpcEndpointAwsService, Vpc} from "@aws-cdk/aws-ec2";
import {AuthorizationType, EndpointType, LambdaRestApi} from "@aws-cdk/aws-apigateway";
import * as subscriptions from '@aws-cdk/aws-sns-subscriptions';

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
      description: 'Max number of days to keep generated Captcha in S3',
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
      removalPolicy: RemovalPolicy.RETAIN,
      serverAccessLogsPrefix: 'accessLogBucketAccessLog' + '-' + deployStage.valueAsString,
    });

    const cloudfront_monitoring_s3_bucket = new Bucket(this, 'CloudfrontMonitoringS3Bucket', {
      bucketName: "cloudfront-monitoring-s3-buckets-" + this.account + '-' + this.region + '-' + deployStage.valueAsString,
      encryption: BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.RETAIN,
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

    const captcha_generating_result_topic = new sns.Topic(this, 'CaptchaGenerateResultTopic', {
      displayName: 'Captcha Generating result',
      fifo: false,
      topicName: 'captchaGeneratingResultTopic',
    });

    const rest_api = new LambdaRestApi(this, 'performance_metrics_restfulApi', {
      handler: metricsManager,
      description: "restful api to get the cloudfront performance data",
      proxy: false,
      restApiName:'CloudfrontPerformanceMetrics',
      endpointConfiguration: {
        types: [ EndpointType.EDGE]
      }
    })

    const performance_proxy = rest_api.root.addResource('metric');
    performance_proxy.addMethod('GET', undefined, {
      authorizationType: AuthorizationType.COGNITO
    })

    //Policy to allow client to call this restful api
    const api_client_policy = new ManagedPolicy(this, "captcha_client_policy", {
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

    new cdk.CfnOutput(this,'cloudfront_monitoring_s3_bucket', {value: cloudfront_monitoring_s3_bucket.bucketName});
    new cdk.CfnOutput(this,'cloudfront_metrics_dynamodb', {value: cloudfront_metrics_table.tableName});
    new cdk.CfnOutput(this,'api-gateway_policy', {value: api_client_policy.managedPolicyName});
  }
}
