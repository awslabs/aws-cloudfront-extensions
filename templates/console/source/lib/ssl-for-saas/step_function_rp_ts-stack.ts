import * as cdk from 'aws-cdk-lib';
import { aws_s3 as s3 } from 'aws-cdk-lib';
import { aws_iam as iam } from 'aws-cdk-lib';
import { aws_stepfunctions as _step } from 'aws-cdk-lib';
import { aws_stepfunctions_tasks as _task } from 'aws-cdk-lib';
import { aws_lambda as _lambda } from 'aws-cdk-lib';
import { aws_sns as sns } from 'aws-cdk-lib';
import { aws_sns_subscriptions as subs } from 'aws-cdk-lib';
import { aws_dynamodb as dynamodb } from 'aws-cdk-lib';
import { aws_events as events } from 'aws-cdk-lib';
import { aws_events_targets as targets } from 'aws-cdk-lib';
import { aws_apigateway as _apigw } from 'aws-cdk-lib';
import { aws_appsync as _appsync } from 'aws-cdk-lib';
import * as _appsync_alpha from '@aws-cdk/aws-appsync-alpha';
import { CfnParameter } from 'aws-cdk-lib';
import { Duration } from 'aws-cdk-lib';
import { StateMachine } from 'aws-cdk-lib/aws-stepfunctions';
import { AppsyncFunction } from '@aws-cdk/aws-appsync-alpha';
import path from "path";

export class StepFunctionRpTsStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // dynadmodb table for acm callback
    const callback_table = new dynamodb.Table(this, 'acm_metadata', {
      tableName: 'acm_metadata_store',
      partitionKey: {
        name: 'taskToken',
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'domainName',
        type: dynamodb.AttributeType.STRING
      }
    });

    // create sns topic
    const sns_topic = new sns.Topic(this, 'CloudFront_Distribution_Notification', {
      displayName: 'SNS Topic',
      topicName: 'CloudFront_Distribution_Notification'
    });

    // create email subscription
    const email_address = new CfnParameter(this, 'email-subs');
    sns_topic.addSubscription(new subs.EmailSubscription(email_address.valueAsString));

    // create another lambda subscription to handle DCV as provided in sample code, TBD

    // create lambda iam role
    const _fn_appsync_func_role = new iam.Role(this, '_fn_appsync_func_role', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSCertificateManagerFullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSStepFunctionsFullAccess')
      ]
    });

    const _fn_acm_direct_op_role = new iam.Role(this, '_fn_acm_direct_op_role', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"),
        iam.ManagedPolicy.fromAwsManagedPolicyName("AWSCertificateManagerFullAccess"),
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonDynamoDBFullAccess"),
        iam.ManagedPolicy.fromAwsManagedPolicyName("AWSStepFunctionsFullAccess")
      ]
    });

    const _fn_acm_cb_role = new iam.Role(this, '_fn_acm_cb_role', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"),
        iam.ManagedPolicy.fromAwsManagedPolicyName("AWSCertificateManagerFullAccess"),
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonDynamoDBFullAccess"),
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSNSFullAccess")
      ]
    });

    const _fn_acm_import_cb_role = new iam.Role(this, '_fn_acm_import_cb_role', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"),
        iam.ManagedPolicy.fromAwsManagedPolicyName("AWSCertificateManagerFullAccess"),
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonDynamoDBFullAccess")
      ]
    });

    const _fn_acm_cron_role = new iam.Role(this, '_fn_acm_cron_role', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"),
        iam.ManagedPolicy.fromAwsManagedPolicyName("AWSCertificateManagerFullAccess"),
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonDynamoDBFullAccess"),
        iam.ManagedPolicy.fromAwsManagedPolicyName("AWSStepFunctionsFullAccess")
      ]
    });

    const _fn_acm_cb_handler_role = new iam.Role(this, '_fn_acm_cb_handler_role', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"),
        iam.ManagedPolicy.fromAwsManagedPolicyName("AWSCertificateManagerFullAccess"),
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonDynamoDBFullAccess"),
        iam.ManagedPolicy.fromAwsManagedPolicyName("AWSStepFunctionsFullAccess"),
        iam.ManagedPolicy.fromAwsManagedPolicyName("CloudFrontFullAccess")
      ]
    });

    const _fn_sns_notify_role = new iam.Role(this, '_fn_sns_notify_role', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"),
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonDynamoDBFullAccess"),
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSNSFullAccess")
      ]
    });

    // create lambda function
    const fn_acm_import_cb = new _lambda.DockerImageFunction(this, 'acm_import_callback', {
      code:_lambda.DockerImageCode.fromImageAsset(path.join(__dirname, "../../lambda/ssl-for-saas/acm_import_cb")),
      environment:{'SNS_TOPIC': sns_topic.topicArn, 'CALLBACK_TABLE': callback_table.tableName, 'TASK_TYPE': 'placeholder'},timeout:Duration.seconds(900), 
      role:_fn_acm_import_cb_role, 
      memorySize:1024});

    const fn_acm_cb = new _lambda.DockerImageFunction(this, 'acm_callback', {
      code:_lambda.DockerImageCode.fromImageAsset(path.join(__dirname,"../../lambda/ssl-for-saas/acm_cb")),
      environment:{'SNS_TOPIC': sns_topic.topicArn, 'CALLBACK_TABLE': callback_table.tableName, 'TASK_TYPE': 'placeholder'},timeout:Duration.seconds(900), 
      role:_fn_acm_cb_role, 
      memorySize:512});

    const fn_acm_cb_handler = new _lambda.DockerImageFunction(this, 'acm_callback_handler', {
      code:_lambda.DockerImageCode.fromImageAsset(path.join(__dirname,"../../lambda/ssl-for-saas/acm_cb_handler")),
      environment:{'PAYLOAD_EVENT_KEY': 'placeholder', 'CALLBACK_TABLE': callback_table.tableName, 'TASK_TYPE': 'placeholder'},timeout:Duration.seconds(900), 
      role:_fn_acm_cb_handler_role, 
      memorySize:1024});

    const fn_acm_cron = new _lambda.DockerImageFunction(this, 'acm_cron_job', {
      code:_lambda.DockerImageCode.fromImageAsset(path.join(__dirname, "../../lambda/ssl-for-saas/acm_cron")),
      environment:{'PAYLOAD_EVENT_KEY': 'placeholder', 'CALLBACK_TABLE': callback_table.tableName, 'TASK_TYPE': 'placeholder'},timeout:Duration.seconds(900), 
      role:_fn_acm_cron_role, 
      memorySize:1024});

    const fn_sns_notify = new _lambda.DockerImageFunction(this, 'sns_notify', {
      code:_lambda.DockerImageCode.fromImageAsset(path.join(__dirname,"../../lambda/ssl-for-saas/acm_cron")),
      environment:{'SNS_TOPIC': sns_topic.topicArn, 'CALLBACK_TABLE': callback_table.tableName, 'TASK_TYPE': 'placeholder'},timeout:Duration.seconds(900),
      role:_fn_sns_notify_role, 
      memorySize:1024});

    // {
    //   "Error": "{\"status\": \"FAILED\"}",
    //   "Cause": null
    // }
    const snsFailureNotify = new _task.SnsPublish(this, 'Failure Notification', {
      topic: sns_topic,
      integrationPattern: _step.IntegrationPattern.REQUEST_RESPONSE,
      message: _step.TaskInput.fromObject({
        "error": _step.JsonPath.stringAt("$.Error")
      }),
      resultPath: "$.snsFailure"
    });

    // {
    //     "acm_op": "create",
    //     "auto_creation": "false",
    //     "dist_aggregation": "false",
    //     "cnameList": [
    //         {
    //         "domainName": "cdn2.risetron.cn",
    //         "sanList": [
    //             "cdn3.risetron.cn"
    //         ],
    //         "originsItemsDomainName": "risetron.s3.ap-east-1.amazonaws.com"
    //         },
    //         {
    //         "domainName": "cdn4.risetron.cn",
    //         "sanList": [
    //             "cdn5.risetron.cn"
    //         ],
    //         "originsItemsDomainName": "risetron.s3.ap-east-1.amazonaws.com"
    //         }
    //     ],
    //     "CertPem": "",
    //     "PrivateKeyPem": "",
    //     "ChainPem": "",
    // }
    const acm_callback_job = new _task.LambdaInvoke(this, 'ACM Create Callback Job', {
      lambdaFunction: fn_acm_cb,
      integrationPattern: _step.IntegrationPattern.WAIT_FOR_TASK_TOKEN,
      payload: _step.TaskInput.fromObject({
        "task_token": _step.JsonPath.taskToken,
        "input": _step.JsonPath.entirePayload,
        // _step.JsonPath.stringAt("$.someField"),
        "callback": "true"
      }),
      resultPath: "$.fn_acm_cb"
    }).addCatch(snsFailureNotify);

    const acm_import_callback_job = new _task.LambdaInvoke(this, 'ACM Import Callback Job', {
      lambdaFunction: fn_acm_import_cb,
      integrationPattern: _step.IntegrationPattern.WAIT_FOR_TASK_TOKEN,
      payload: _step.TaskInput.fromObject({
        "task_token": _step.JsonPath.taskToken,
        "input": _step.JsonPath.entirePayload,
        // _step.JsonPath.stringAt("$.someField"),
      }),
      resultPath: "$.fn_acm_import_cb"
    }).addCatch(snsFailureNotify);

    // {
    //   "domainName": "cdn2.risetron.cn",
    //   "sanList": [
    //       "cdn3.risetron.cn"
    // ],
    //   "originsItemsDomainName": "risetron.s3.ap-east-1.amazonaws.com"
    // },
    // {
    //   "domainName": "cdn4.risetron.cn",
    //   "sanList": [
    //        "cdn5.risetron.cn"
    //   ],
    //   "originsItemsDomainName": "risetron.s3.ap-east-1.amazonaws.com"
    // }
    const acm_callback_handler_job = new _task.LambdaInvoke(this, 'ACM Callback Handler Job', {
      lambdaFunction: fn_acm_cb_handler,
      payload: _step.TaskInput.fromObject({
        "input": _step.JsonPath.entirePayload,
        // _step.JsonPath.stringAt("$.someField"),
      }),
      resultSelector: {"Payload": _step.JsonPath.stringAt("$.Payload")},
      resultPath: "$.fn_acm_cb_handler"
    });

    // invoke lambda from map state
    const acm_callback_handler_map = new _step.Map(this, 'ACM Callback Handler Map', {
      maxConcurrency: 10,
      itemsPath: _step.JsonPath.stringAt("$.cnameList"),
      resultPath: "$.fn_acm_cb_handler_map",
    })
    acm_callback_handler_map.iterator(acm_callback_handler_job)

    const sns_notify_job = new _task.LambdaInvoke(this, 'Success Notification Job', {
      lambdaFunction: fn_sns_notify,
      payload: _step.TaskInput.fromObject({
        "input": _step.JsonPath.entirePayload,
        // _step.JsonPath.stringAt("$.someField"),
      }),
      // Lambda's result is in the attribute `Payload`
      resultSelector: {"Payload": _step.JsonPath.stringAt("$.Payload")},
      // outputPath: "$.Payload",
      resultPath: "$.fn_sns_notify"
    })

    const wait_10s_for_cert_create = new _step.Wait(this, 'Wait 10s for ACM Cert Create', {
      time: _step.WaitTime.duration(Duration.seconds(10))
    })
    const wait_10s_for_cert_import = new _step.Wait(this, 'Wait 10s for ACM Cert Import', {
      time: _step.WaitTime.duration(Duration.seconds(10))
    })

    // entry point for step function with cert create/import process
    const stepFunctionEntry = new _step.Choice(this, 'Initial entry point')
    stepFunctionEntry.when(_step.Condition.and(_step.Condition.stringEquals("$.acm_op", "create"), _step.Condition.stringEquals("$.auto_creation", "true")), acm_callback_job.next(wait_10s_for_cert_create).next(acm_callback_handler_map))

    stepFunctionEntry.when(_step.Condition.and(_step.Condition.stringEquals("$.acm_op", "import"), _step.Condition.stringEquals("$.auto_creation", "true")), acm_import_callback_job.next(wait_10s_for_cert_import).next(acm_callback_handler_map).next(sns_notify_job))

    const stepFunction = new _step.StateMachine(this, 'SSL for SaaS', {
      definition: stepFunctionEntry,
      stateMachineName: 'SSL-for-SaaS-StateMachine',
      stateMachineType: _step.StateMachineType.STANDARD,
      // set global timeout, don't set timeout in callback inside
      timeout: Duration.hours(24)
    })

    // lambda in step function & cron job
    const fn_acm_direct_op = new _lambda.DockerImageFunction(this, 'acm_direct_op', {
      code:_lambda.DockerImageCode.fromImageAsset(path.join(__dirname,"../../lambda/ssl-for-saas/acm_direct_op")),
      environment:{'STEP_FUNCTION_ARN': stepFunction.stateMachineArn, 'CALLBACK_TABLE': callback_table.tableName, 'TASK_TYPE': 'placeholder'},
      timeout:Duration.seconds(900), 
      role:_fn_acm_direct_op_role, 
      memorySize:1024});

    // API Gateway with Lambda proxy integration
    const api_acm_direct_op = new _apigw.LambdaRestApi(this, 'api_acm_direct_op', {
      handler: fn_acm_direct_op,
      proxy: false
    });

    api_acm_direct_op.root.addResource('ssl_for_saas').addMethod('POST');

    // cloudwatch event crob job for 5 minutes
    new events.Rule(this, 'ACM status check', {
      schedule: events.Schedule.expression("cron(0/1 * * * ? *)"),
      targets: [new targets.LambdaFunction(fn_acm_cron)]
    });

    // configure cloudwatch event rule and trigger action whenever certain ACM expires

    // sample input 
    // {
    //     "version": "0",
    //     "id": "9c95e8e4-96a4-ef3f-b739-b6aa5b193afb",
    //     "detail-type": "ACM Certificate Approaching Expiration",
    //     "source": "aws.acm",
    //     "account": "123456789012",
    //     "time": "2020-09-30T06:51:08Z",
    //     "region": "us-east-1",
    //     "resources": ["arn:aws:acm:us-east-1:123456789012:certificate/61f50cd4-45b9-4259-b049-d0a53682fa4b"],
    //     "detail": {
    //         "DaysToExpiry": 31,
    //         "CommonName": "Aperture Science Portal Certificate Authority - R4"
    //     }
    // }
    new events.Rule(this, 'ACM health event', {
      eventPattern: {
        region: ['us-east-1'],
        source: ['aws.acm'],
        detailType: ['ACM Certificate Approaching Expiration']
      },
      targets: [new targets.SnsTopic(sns_topic)]
    });

    // Lambda function to integrate with AppSync
    const fn_appsync_function = new _lambda.DockerImageFunction(this, 'appsync_func', {
      code:_lambda.DockerImageCode.fromImageAsset(path.join(__dirname,"../../lambda/ssl-for-saas/appsync_func")),
      environment:{'STEP_FUNCTION_ARN': stepFunction.stateMachineArn, 'CALLBACK_TABLE': callback_table.tableName, 'TASK_TYPE': 'placeholder'},timeout:Duration.seconds(900), 
      role:_fn_appsync_func_role, 
      memorySize:1024});

    const appsyncApi = new _appsync_alpha.GraphqlApi(this, 'appsyncApi', {
      name: 'appsyncApi',
      schema: _appsync_alpha.Schema.fromAsset(path.join(__dirname,'../../graphql/schema.graphql')),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: _appsync_alpha.AuthorizationType.IAM,
        },
      },
      xrayEnabled: false,
    });

    // An AppSync datasource backed by a Lambda function
    const appsyncFunc = new _appsync_alpha.LambdaDataSource(this, 'LambdaDataSource', {
      api: appsyncApi,
      lambdaFunction: fn_appsync_function,
      description: 'Lambda Data Source for cert create/import',
      name: 'certMutation',
      // serviceRole: _fn_appsync_func_role,
    });

    // An AppSync resolver to resolve the Lambda function
    appsyncFunc.createResolver({
      typeName: 'Mutation',
      fieldName: 'certCreate',
      requestMappingTemplate: _appsync_alpha.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: _appsync_alpha.MappingTemplate.lambdaResult(),
    });

    appsyncFunc.createResolver({
      typeName: 'Mutation',
      fieldName: 'certImport',
      requestMappingTemplate: _appsync_alpha.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: _appsync_alpha.MappingTemplate.lambdaResult(),
    });

  }
}
