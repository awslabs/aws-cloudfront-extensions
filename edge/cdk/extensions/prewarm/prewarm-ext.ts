import * as cdk from 'aws-cdk-lib';
import { EndpointType, LambdaRestApi, RequestValidator } from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as as from 'aws-cdk-lib/aws-autoscaling';
import * as eb from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cwa from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Construct } from 'constructs';
import * as path from 'path';
import { RemovalPolicy } from 'aws-cdk-lib';
import { ComparisonOperator, TreatMissingData } from 'aws-cdk-lib/aws-cloudwatch';
import { BlockDeviceVolume } from 'aws-cdk-lib/aws-autoscaling';


export class PrewarmStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    this.templateOptions.description = "(SO8138) - Prewarm resources in specific pop";

    const prewarmStatusTable = new dynamodb.Table(this, 'PrewarmStatus', {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      partitionKey: { name: 'reqId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'url', type: dynamodb.AttributeType.STRING },
      pointInTimeRecovery: true,
    });

    const dlq = new sqs.Queue(this, 'PrewarmDLQ', {
      encryption: sqs.QueueEncryption.KMS_MANAGED,
      retentionPeriod: cdk.Duration.days(14),
      visibilityTimeout: cdk.Duration.hours(10),
    });

    const messageQueue = new sqs.Queue(this, 'PrewarmMessageQueue', {
      encryption: sqs.QueueEncryption.KMS_MANAGED,
      // receiveMessageWaitTime: cdk.Duration.seconds(5),
      visibilityTimeout: cdk.Duration.hours(10),
      deadLetterQueue: {
        queue: dlq,
        maxReceiveCount: 50,
      },
    });

    const prewarmRole = new iam.Role(this, 'PrewarmRole', {
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal("lambda.amazonaws.com"),
        new iam.ServicePrincipal('ec2.amazonaws.com'),
      ),
    });

    const ddbPolicy = new iam.Policy(this, 'PrewarmDDBPolicy', {
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          resources: [prewarmStatusTable.tableArn],
          actions: [
            "dynamodb:*"
          ]
        })
      ]
    });

    const lambdaPolicy = new iam.Policy(this, 'PrewarmLambdaPolicy', {
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

    const sqsPolicy = new iam.Policy(this, 'PrewarmSQSPolicy', {
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
          ]
        })
      ]
    });

    const cfPolicy = new iam.Policy(this, 'PrewarmCFPolicy', {
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

    const asgRole = new iam.Role(this, 'PrewarmASGRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com')
    });

    prewarmRole.attachInlinePolicy(ddbPolicy);
    prewarmRole.attachInlinePolicy(lambdaPolicy);
    prewarmRole.attachInlinePolicy(sqsPolicy);
    prewarmRole.attachInlinePolicy(cfPolicy);
    asgRole.attachInlinePolicy(ddbPolicy);
    asgRole.attachInlinePolicy(sqsPolicy);
    asgRole.attachInlinePolicy(cfPolicy);

    const metric = new cloudwatch.MathExpression({
      expression: "visible + hidden",
      usingMetrics: {
        visible: messageQueue.metricApproximateNumberOfMessagesVisible({period: cdk.Duration.seconds(60)}),
        hidden: messageQueue.metricApproximateNumberOfMessagesNotVisible({period: cdk.Duration.seconds(60)}),
      },
      period: cdk.Duration.seconds(60), 
    });
    // const metric = messageQueue.metricApproximateNumberOfMessagesVisible({
    //   period: cdk.Duration.seconds(60),
    // });
    const messageAlarm = metric.createAlarm(this, 'PrewarmMessage',
      {
        alarmDescription: 'The SQS has messages need to be pre-warmed',
        evaluationPeriods: 1,
        threshold: 0,
        comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
        // INSUFFICIENT DATA state in CloudWatch alarm will be ignored
        treatMissingData: TreatMissingData.NOT_BREACHING,
      }
    );

    const vpc = new ec2.Vpc(this, 'PrewarmVpc', {
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'ingress',
          subnetType: ec2.SubnetType.PUBLIC,
        }
      ]
    });
    const securityGroup = new ec2.SecurityGroup(this, 'PrewarmSG', { vpc });
    const prewarmAsg = new as.AutoScalingGroup(this, 'PrewarmASG',
      {
        instanceType: new ec2.InstanceType("m5dn.xlarge"),
        machineImage: new ec2.AmazonLinuxImage({ generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2 }),
        vpc: vpc,
        role: asgRole,
        securityGroup: securityGroup,
        allowAllOutbound: true,
        maxCapacity: 50,
        minCapacity: 0,
        desiredCapacity: 0,
        spotPrice: "0.15",
        blockDevices: [{
          deviceName: '/dev/xvda',
          volume: BlockDeviceVolume.ebs(150)
        }],
        signals: as.Signals.waitForMinCapacity(),
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        }
      }
    );
    prewarmAsg.applyCloudFormationInit(ec2.CloudFormationInit.fromElements(
      ec2.InitFile.fromFileInline('/etc/agent/agent.py', path.join(__dirname, './lambda/agent/agent.py')),
      ec2.InitFile.fromFileInline('/etc/agent/requirements.txt', path.join(__dirname, './lambda/agent/requirements.txt')),
    ));
    prewarmAsg.addUserData(
      'exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1',
      'pip3 install -r /etc/agent/requirements.txt',
      `python3 /etc/agent/agent.py ` + messageQueue.queueUrl + ` ` + prewarmStatusTable.tableName + ` ${cdk.Aws.REGION} 4`
    );

    const agentScaleOut = new as.StepScalingAction(this, 'PrewarmScaleOut', {
      autoScalingGroup: prewarmAsg,
      adjustmentType: as.AdjustmentType.EXACT_CAPACITY,
    });
    agentScaleOut.addAdjustment({
      adjustment: 0,
      lowerBound: 0,
      upperBound: 1,
    }); 
    agentScaleOut.addAdjustment({
      adjustment: 1,
      lowerBound: 1,
      upperBound: 2,
    });
    agentScaleOut.addAdjustment({
      adjustment: 2,
      lowerBound: 2,
      upperBound: 5,
    });
    agentScaleOut.addAdjustment({
      adjustment: 4,
      lowerBound: 5,
      upperBound: 10,
    });
    agentScaleOut.addAdjustment({
      adjustment: 10,
      lowerBound: 10,
      upperBound: 25,
    });
    agentScaleOut.addAdjustment({
      adjustment: 15,
      lowerBound: 25,
      upperBound: 40,
    });
    agentScaleOut.addAdjustment({
      adjustment: 20,
      lowerBound: 40,
      upperBound: 55,
    });
    agentScaleOut.addAdjustment({
      adjustment: 25,
      lowerBound: 55,
      upperBound: 65,
    });
    agentScaleOut.addAdjustment({
      adjustment: 30,
      lowerBound: 65,
      upperBound: 80,
    });
    agentScaleOut.addAdjustment({
      adjustment: 35,
      lowerBound: 80,
      upperBound: 100,
    });
    agentScaleOut.addAdjustment({
      adjustment: 50,
      lowerBound: 100,
    });
    messageAlarm.addAlarmAction(new cwa.AutoScalingAction(agentScaleOut));

    const agentScaleIn = new as.StepScalingAction(this, 'PrewarmScaleIn', {
      autoScalingGroup: prewarmAsg,
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

    const invLambda = new lambda.Function(this, 'CacheInvalidator', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'cache_invalidator.lambda_handler',
      timeout: cdk.Duration.minutes(15),
      code: lambda.Code.fromAsset(path.join(__dirname, './lambda/lib/lambda-assets/cache_invalidator.zip')),
      architecture: lambda.Architecture.ARM_64,
      role: prewarmRole,
      memorySize: 256,
      environment: {
        DDB_TABLE_NAME: prewarmStatusTable.tableName,
        SQS_QUEUE_URL: messageQueue.queueUrl,
        INV_WAIT_TIME: '1',
      },
      logRetention: logs.RetentionDays.ONE_WEEK
    });

    const schedulerLambda = new lambda.Function(this, 'PrewarmScheduler', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'scheduler.lambda_handler',
      timeout: cdk.Duration.minutes(15),
      code: lambda.Code.fromAsset(path.join(__dirname, './lambda/scheduler')),
      architecture: lambda.Architecture.ARM_64,
      role: prewarmRole,
      memorySize: 256,
      environment: {
        DDB_TABLE_NAME: prewarmStatusTable.tableName,
        INVALIDATOR_ARN: invLambda.functionArn
      },
      logRetention: logs.RetentionDays.ONE_WEEK
    });

    const statusFetcherLambda = new lambda.Function(this, 'PrewarmStatusFetcher', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'status_fetcher.lambda_handler',
      timeout: cdk.Duration.seconds(60),
      code: lambda.Code.fromAsset(path.join(__dirname, './lambda/status_fetcher')),
      architecture: lambda.Architecture.ARM_64,
      role: prewarmRole,
      memorySize: 256,
      environment: {
        DDB_TABLE_NAME: prewarmStatusTable.tableName,
      },
      logRetention: logs.RetentionDays.ONE_WEEK
    });

    // Restful API to prewarm resources, prod stage has been created by default
    const schedulerApi = new LambdaRestApi(this, 'PrewarmApi', {
      handler: schedulerLambda,
      description: "Restful API to prewarm resources",
      proxy: false,
      endpointConfiguration: {
        types: [EndpointType.EDGE]
      }
    });

    // Restful API to get prewarm status from Dynamodb table
    const statusApi = new LambdaRestApi(this, 'PrewarmStatusApi', {
      handler: statusFetcherLambda,
      description: "Restful API to get prewarm status",
      proxy: false,
      endpointConfiguration: {
        types: [EndpointType.EDGE]
      }
    });

    const schedulerProxy = schedulerApi.root.addResource('prewarm');
    schedulerProxy.addMethod('POST', undefined, {
      apiKeyRequired: true,
    });

    const statusProxy = statusApi.root.addResource('status');
    statusProxy.addMethod('GET', undefined, {
      requestParameters: {
        'method.request.querystring.requestID': true,
      },
      apiKeyRequired: true,
      requestValidator: new RequestValidator(this, "PrewarmStatusApiValidator", {
        validateRequestBody: false,
        validateRequestParameters: true,
        requestValidatorName: 'defaultValidator',
        restApi: statusApi
      }),
    });

    const usagePlan = schedulerApi.addUsagePlan('PrewarmUsagePlan', {
      description: 'Prewarm API usage plan',
    });
    const apiKey = schedulerApi.addApiKey('PrewarmApiKey');
    usagePlan.addApiKey(apiKey);
    usagePlan.addApiStage({
      stage: schedulerApi.deploymentStage,
    });

    usagePlan.addApiStage({
      stage: statusApi.deploymentStage,
    });

    // Output
    new cdk.CfnOutput(this, "Prewarm API key", {
      value: apiKey.keyArn
    });

    // new cdk.CfnOutput(this, "User data", {
    //   value: ud.
    // });

  }

}
