import * as cdk from 'aws-cdk-lib';
import { EndpointType, LambdaRestApi, RequestValidator } from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import * as path from 'path';


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
      visibilityTimeout: cdk.Duration.minutes(60),
    });

    const messageQueue = new sqs.Queue(this, 'PrewarmMessageQueue', {
      encryption: sqs.QueueEncryption.KMS_MANAGED,
      receiveMessageWaitTime: cdk.Duration.seconds(5),
      visibilityTimeout: cdk.Duration.hours(1),
      deadLetterQueue: {
        queue: dlq,
        maxReceiveCount: 50,
      },
    });

    const prewarmRole = new iam.Role(this, 'PrewarmRole', {
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal("lambda.amazonaws.com"),
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
          ]
        })
      ]
    });

    prewarmRole.attachInlinePolicy(ddbPolicy);
    prewarmRole.attachInlinePolicy(lambdaPolicy);
    prewarmRole.attachInlinePolicy(sqsPolicy);
    prewarmRole.attachInlinePolicy(cfPolicy);

    const agentLambda = new lambda.Function(this, 'PrewarmAgent', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'agent.lambda_handler',
      timeout: cdk.Duration.minutes(15),
      code: lambda.Code.fromAsset(path.join(__dirname, './lambda/lib/lambda-assets/agent.zip')),
      architecture: lambda.Architecture.ARM_64,
      role: prewarmRole,
      memorySize: 7168,
      environment: {
        DDB_TABLE_NAME: prewarmStatusTable.tableName,
        THREAD_CONCURRENCY: '6'
      },
      logRetention: logs.RetentionDays.ONE_WEEK
    });

    agentLambda.addEventSource(new SqsEventSource(messageQueue, {
      batchSize: 1,
      maxBatchingWindow: cdk.Duration.minutes(1),
    }));

    const schedulerLambda = new lambda.Function(this, 'PrewarmScheduler', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'scheduler.lambda_handler',
      timeout: cdk.Duration.minutes(15),
      code: lambda.Code.fromAsset(path.join(__dirname, './lambda/lib/lambda-assets/scheduler.zip')),
      architecture: lambda.Architecture.ARM_64,
      role: prewarmRole,
      memorySize: 512,
      environment: {
        DDB_TABLE_NAME: prewarmStatusTable.tableName,
        SQS_QUEUE_URL: messageQueue.queueUrl
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
      memorySize: 512,
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

  }

}
