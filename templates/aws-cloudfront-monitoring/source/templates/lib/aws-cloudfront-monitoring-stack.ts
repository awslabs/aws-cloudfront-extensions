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

    this.setDescription("(SO8013) - Intelligent Captcha stack.");

    const maxDailyIndex = new CfnParameter(this, 'MaxDailyCaptchaNumber', {
      description: 'Max number of Captcha to be generated each day',
      type: 'Number',
      default: 100,
    })

    const captchaKeepingDays = new CfnParameter(this, 'MaxCaptchaKeepDays', {
      description: 'Max number of days to keep generated Captcha in S3',
      type: 'Number',
      default: 7,
    })

    const deployStage = new CfnParameter(this, 'deployStage', {
      description: 'stageName of the deployment, this allow multiple deployment into one account',
      type: 'String',
      default: 'prod',
      allowedValues: ['dev','beta','gamma','preprod','prod']
    })

    const notifyEmail = new CfnParameter(this, 'notifyEmail', {
      description: 'enter the email address to be notified about captcha generating status, eg: xxx@qq.com',
      type: 'String',
      default: '',
    })

    const captchaGenerateHour = new CfnParameter(this, 'captchaGenerateHour', {
      description: 'enter the hour of day in UTC to start generating captcha images, from 0 to 23, default is 8 which is 16:00 of Beijing time',
      type: 'Number',
      default: '8',
      allowedValues: ['0','1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23']
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

    const vpcId = this.node.tryGetContext('vpcId');
    const vpc = vpcId ? Vpc.fromLookup(this, 'CaptchaGeneratorVpc', {
      vpcId: vpcId === 'default' ? undefined : vpcId,
      isDefault: vpcId === 'default' ? true : undefined,
    }) : (() => {
      const newVpc = new Vpc(this, 'CaptchaGeneratorVpc', {
        maxAzs: 3,
        gatewayEndpoints: {
          s3: {
            service: GatewayVpcEndpointAwsService.S3,
          },
          dynamodb: {
            service: GatewayVpcEndpointAwsService.DYNAMODB,
          },
        },
        enableDnsHostnames: true,
        enableDnsSupport: true
      });
      return newVpc;
    })();

    const accessLogBucket = new Bucket(this, 'BucketAccessLog', {
      encryption: BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.RETAIN,
      serverAccessLogsPrefix: 'accessLogBucketAccessLog' + '-' + deployStage.valueAsString,
    });

    const captcha_s3_bucket = new Bucket(this, 'CaptchaGenerationBucket', {
      bucketName: "captcha-generator-buckets-" + this.account + '-' + this.region + '-' + deployStage.valueAsString,
      encryption: BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.RETAIN,
      autoDeleteObjects: true,
      serverAccessLogsBucket: accessLogBucket,
      serverAccessLogsPrefix: 'dataBucketAccessLog' + '-' + deployStage.valueAsString,
      lifecycleRules: [
        {
          enabled: true,
          expiration: Duration.days(captchaKeepingDays.valueAsNumber),
        },
      ],
      blockPublicAccess: new BlockPublicAccess({ blockPublicPolicy: false })
    });

    // create Dynamodb table to save the captcha index file
    const captcha_index_table = new dynamodb.Table(this, 'Captcha_index', {
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 100,
      writeCapacity: 100,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      partitionKey: {name: 'captcha_date', type: dynamodb.AttributeType.STRING},
      sortKey: {name: 'captcha_index', type: dynamodb.AttributeType.NUMBER},
      pointInTimeRecovery: true,
      timeToLiveAttribute: 'ExpirationTime'
    });

    const readAutoScaling = captcha_index_table.autoScaleReadCapacity({
      minCapacity: 100,
      maxCapacity: 3000
    });

    readAutoScaling.scaleOnUtilization({
      targetUtilizationPercent: 75
    })

    const lambdaRole = new iam.Role(this, 'LambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    // front end lambda only need to access DynamoDB
    lambdaRole.addManagedPolicy(
        ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess')
    );

    // define get captcha function
    const getCaptchaLambda = new lambda.Function(this, 'get-captcha-lambda', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'index.handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(60),
      code: lambda.Code.fromAsset(path.join(__dirname, '/../lambda.d/captchaGenerator')),
      role: lambdaRole,
      environment: {
        DDB_TABLE_NAME: captcha_index_table.tableName,
        MAX_DAILY_INDEX: maxDailyIndex.valueAsString
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    getCaptchaLambda.node.addDependency(captcha_index_table);

    const captcha_generating_result_topic = new sns.Topic(this, 'CaptchaGenerateResultTopic', {
      displayName: 'Captcha Generating result',
      fifo: false,
      topicName: 'captchaGeneratingResultTopic',
    });

    if (notifyEmail.valueAsString != ''){
      captcha_generating_result_topic.addSubscription(new subscriptions.EmailSubscription(notifyEmail.valueAsString));
    }


    const rest_api = new LambdaRestApi(this, 'restfulApi', {
      handler: getCaptchaLambda,
      description: "restful api to get the captcha",
      proxy: false,
      restApiName:'restfulGetCaptcha',
      endpointConfiguration: {
        types: [ EndpointType.REGIONAL]
      }
    })

    const captcha_proxy = rest_api.root.addResource('captcha');
    captcha_proxy.addMethod('GET', undefined, {
      authorizationType: AuthorizationType.IAM
    })

    //Policy to allow client to call this restful api
    const api_client_policy = new ManagedPolicy(this, "captcha_client_policy", {
      managedPolicyName: "captcha_client_policy_"+deployStage.valueAsString,
      description: "policy for client to call stage:"+deployStage.valueAsString,
      statements: [
        new iam.PolicyStatement({
          resources: [rest_api.arnForExecuteApi()],
          actions: ['execute-api:Invoke'],
          effect: iam.Effect.ALLOW,
        }),
      ],
    });

    new cdk.CfnOutput(this,'captcha_s3_bucket', {value: captcha_s3_bucket.bucketName});
    new cdk.CfnOutput(this,'captcha_dynamodb', {value: captcha_index_table.tableName});
    new cdk.CfnOutput(this,'api-gateway_policy', {value: api_client_policy.managedPolicyName});
  }
}
