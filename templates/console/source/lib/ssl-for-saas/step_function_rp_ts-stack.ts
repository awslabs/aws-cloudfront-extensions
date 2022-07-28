import * as cdk from "aws-cdk-lib";
import { aws_s3 as s3 } from "aws-cdk-lib";
import { aws_iam as iam } from "aws-cdk-lib";
import { aws_stepfunctions as _step } from "aws-cdk-lib";
import { aws_stepfunctions_tasks as _task } from "aws-cdk-lib";
import { aws_lambda as _lambda } from "aws-cdk-lib";
import { aws_sns as sns } from "aws-cdk-lib";
import { aws_sns_subscriptions as subs } from "aws-cdk-lib";
import { aws_dynamodb as dynamodb } from "aws-cdk-lib";
import { aws_events as events } from "aws-cdk-lib";
import { aws_events_targets as targets } from "aws-cdk-lib";
import { aws_apigateway as _apigw } from "aws-cdk-lib";
import { aws_appsync as _appsync } from "aws-cdk-lib";
import * as _appsync_alpha from "@aws-cdk/aws-appsync-alpha";
import { CfnParameter } from "aws-cdk-lib";
import { Duration } from "aws-cdk-lib";
import { StateMachine } from "aws-cdk-lib/aws-stepfunctions";
import { AppsyncFunction } from "@aws-cdk/aws-appsync-alpha";
import path from "path";
import { CommonProps } from "../cf-common/cf-common-stack";
import { AuthorizationType, EndpointType } from "aws-cdk-lib/aws-apigateway";

export class StepFunctionRpTsStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: CommonProps) {
    super(scope, id, props);

    //check appsync is existed in props
    if (props == null) {
      throw Error("The props can not be null");
    }
    if (props.appsyncApi == null) {
      throw Error("appsync should be included in the props");
    }

    // dynamodb table for acm callback
    const callback_table = new dynamodb.Table(this, "acm_metadata", {
      partitionKey: {
        name: "taskToken",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "domainName",
        type: dynamodb.AttributeType.STRING,
      },
    });

    // dynamodb table for job info
    const ssl_for_sass_job_info_table = new dynamodb.Table(
      this,
      "ssl_for_saas_job_info_table",
      {
        partitionKey: {
          name: "jobId",
          type: dynamodb.AttributeType.STRING,
        },
      }
    );

    // dynamodb table for acm callback
    const ssl_for_saas_job_status_table = new dynamodb.Table(
      this,
      "ssl_for_saas_job_status_table",
      {
        partitionKey: {
          name: "jobId",
          type: dynamodb.AttributeType.STRING,
        },
        sortKey: {
          name: "step",
          type: dynamodb.AttributeType.STRING,
        },
      }
    );

    // create sns topic
    const sns_topic = new sns.Topic(
      this,
      "CloudFront_Distribution_Notification",
      {
        displayName: "SNS Topic",
        topicName: "CloudFront_Distribution_Notification",
      }
    );

    // create email subscription
    const email_address = new CfnParameter(this, "email-subs", {
      description: "email address to be notified",
      type: "String",
    });
    sns_topic.addSubscription(
      new subs.EmailSubscription(email_address.valueAsString)
    );

    // create another lambda subscription to handle DCV as provided in sample code, TBD

    // create lambda iam role
    const _fn_appsync_func_role = new iam.Role(this, "_fn_appsync_func_role", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole"
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "AWSCertificateManagerFullAccess"
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonDynamoDBFullAccess"),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "AWSStepFunctionsFullAccess"
        ),
      ],
    });

    const _fn_ssl_api_handler_role = new iam.Role(
      this,
      "_fn_ssl_api_handler_role",
      {
        assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            "service-role/AWSLambdaBasicExecutionRole"
          ),
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            "AWSCertificateManagerFullAccess"
          ),
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            "AmazonDynamoDBFullAccess"
          ),
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            "AWSStepFunctionsFullAccess"
          ),
        ],
      }
    );

    const _fn_acm_cb_role = new iam.Role(this, "_fn_acm_cb_role", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole"
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "AWSCertificateManagerFullAccess"
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonDynamoDBFullAccess"),
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSNSFullAccess"),
        iam.ManagedPolicy.fromAwsManagedPolicyName("CloudfrontFullAccess"),
      ],
    });

    const _fn_acm_import_cb_role = new iam.Role(
      this,
      "_fn_acm_import_cb_role",
      {
        assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            "service-role/AWSLambdaBasicExecutionRole"
          ),
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            "AWSCertificateManagerFullAccess"
          ),
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            "AmazonDynamoDBFullAccess"
          ),
          iam.ManagedPolicy.fromAwsManagedPolicyName("CloudfrontFullAccess"),
        ],
      }
    );

    const _fn_failure_handling_lambda_role = new iam.Role(
      this,
      "_fn_failure_handling_lambda_role",
      {
        assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            "service-role/AWSLambdaBasicExecutionRole"
          ),
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            "AWSCertificateManagerFullAccess"
          ),
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            "AmazonDynamoDBFullAccess"
          ),
        ],
      }
    );

    const _fn_acm_cron_role = new iam.Role(this, "_fn_acm_cron_role", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole"
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "AWSCertificateManagerFullAccess"
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonDynamoDBFullAccess"),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "AWSStepFunctionsFullAccess"
        ),
      ],
    });

    const _fn_acm_cb_handler_role = new iam.Role(
      this,
      "_fn_acm_cb_handler_role",
      {
        assumedBy: new iam.CompositePrincipal(
          new iam.ServicePrincipal("edgelambda.amazonaws.com"),
          new iam.ServicePrincipal("lambda.amazonaws.com")
        ),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            "service-role/AWSLambdaBasicExecutionRole"
          ),
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            "AWSCertificateManagerFullAccess"
          ),
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            "AmazonDynamoDBFullAccess"
          ),
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            "AWSStepFunctionsFullAccess"
          ),
          iam.ManagedPolicy.fromAwsManagedPolicyName("CloudFrontFullAccess"),
          iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess"),
          iam.ManagedPolicy.fromAwsManagedPolicyName("AWSLambda_FullAccess"),
        ],
      }
    );

    const _fn_sns_notify_role = new iam.Role(this, "_fn_sns_notify_role", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole"
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonDynamoDBFullAccess"),
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSNSFullAccess"),
      ],
    });

    // lambda function to handle acm import operation
    const fn_acm_import_cb = new _lambda.DockerImageFunction(
      this,
      "acm_import_callback",
      {
        code: _lambda.DockerImageCode.fromImageAsset(
          path.join(__dirname, "../../lambda/ssl-for-saas/acm_import_cb")
        ),
        environment: {
          SNS_TOPIC: sns_topic.topicArn,
          CALLBACK_TABLE: callback_table.tableName,
          JOB_INFO_TABLE: ssl_for_sass_job_info_table.tableName,
          JOB_STATUS_TABLE: ssl_for_saas_job_status_table.tableName,
          TASK_TYPE: "placeholder",
          CONFIG_VERSION_DDB_TABLE_NAME: cdk.Fn.importValue(
            "configVersionDDBTableName"
          ),
        },
        timeout: Duration.seconds(900),
        role: _fn_acm_import_cb_role,
        memorySize: 1024,
      }
    );

    // lambda function to handle acm create operation
    const fn_acm_cb = new _lambda.DockerImageFunction(this, "acm_callback", {
      code: _lambda.DockerImageCode.fromImageAsset(
        path.join(__dirname, "../../lambda/ssl-for-saas/acm_cb")
      ),
      environment: {
        SNS_TOPIC: sns_topic.topicArn,
        CALLBACK_TABLE: callback_table.tableName,
        JOB_INFO_TABLE: ssl_for_sass_job_info_table.tableName,
        JOB_STATUS_TABLE: ssl_for_saas_job_status_table.tableName,
        TASK_TYPE: "placeholder",
        CONFIG_VERSION_DDB_TABLE_NAME: cdk.Fn.importValue(
          "configVersionDDBTableName"
        ),
      },
      timeout: Duration.seconds(900),
      role: _fn_acm_cb_role,
      memorySize: 512,
    });

    // lambda function to create cloudfront distribution after certification been verified and issued
    const fn_acm_cb_handler = new _lambda.DockerImageFunction(
      this,
      "acm_callback_handler",
      {
        code: _lambda.DockerImageCode.fromImageAsset(
          path.join(__dirname, "../../lambda/ssl-for-saas/acm_cb_handler")
        ),
        environment: {
          PAYLOAD_EVENT_KEY: "placeholder",
          CALLBACK_TABLE: callback_table.tableName,
          JOB_INFO_TABLE: ssl_for_sass_job_info_table.tableName,
          JOB_STATUS_TABLE: ssl_for_saas_job_status_table.tableName,
          TASK_TYPE: "placeholder",
          GRAPHQL_API_URL: props.appsyncApi.graphqlUrl,
          GRAPHQL_API_KEY: props.appsyncApi.apiKey || "",
          CONFIG_VERSION_DDB_TABLE_NAME: cdk.Fn.importValue(
            "configVersionDDBTableName"
          ),
        },
        timeout: Duration.seconds(900),
        role: _fn_acm_cb_handler_role,
        memorySize: 1024,
      }
    );

    // background lambda running regularly to scan the acm certification and notify acm_callback_handler when cert been issued
    const fn_acm_cron = new _lambda.DockerImageFunction(this, "acm_cron_job", {
      code: _lambda.DockerImageCode.fromImageAsset(
        path.join(__dirname, "../../lambda/ssl-for-saas/acm_cron")
      ),
      environment: {
        PAYLOAD_EVENT_KEY: "placeholder",
        CALLBACK_TABLE: callback_table.tableName,
        JOB_INFO_TABLE: ssl_for_sass_job_info_table.tableName,
        JOB_STATUS_TABLE: ssl_for_saas_job_status_table.tableName,
        TASK_TYPE: "placeholder",
      },
      timeout: Duration.seconds(900),
      role: _fn_acm_cron_role,
      memorySize: 1024,
    });

    // send out sns failure notification
    const fn_sns_failure_notify = new _lambda.DockerImageFunction(
      this,
      "sns_failure_notify",
      {
        code: _lambda.DockerImageCode.fromImageAsset(
          path.join(__dirname, "../../lambda/ssl-for-saas/sns_failure_notify")
        ),
        environment: {
          SNS_TOPIC: sns_topic.topicArn,
          CALLBACK_TABLE: callback_table.tableName,
          JOB_INFO_TABLE: ssl_for_sass_job_info_table.tableName,
          JOB_STATUS_TABLE: ssl_for_saas_job_status_table.tableName,
          TASK_TYPE: "placeholder",
        },
        timeout: Duration.seconds(900),
        role: _fn_sns_notify_role,
        memorySize: 1024,
      }
    );

    // send out sns notification
    const fn_sns_notify = new _lambda.DockerImageFunction(this, "sns_notify", {
      code: _lambda.DockerImageCode.fromImageAsset(
        path.join(__dirname, "../../lambda/ssl-for-saas/sns_notify")
      ),
      environment: {
        SNS_TOPIC: sns_topic.topicArn,
        CALLBACK_TABLE: callback_table.tableName,
        JOB_INFO_TABLE: ssl_for_sass_job_info_table.tableName,
        JOB_STATUS_TABLE: ssl_for_saas_job_status_table.tableName,
        TASK_TYPE: "placeholder",
      },
      timeout: Duration.seconds(900),
      role: _fn_sns_notify_role,
      memorySize: 1024,
    });

    // function to clean up garbage resources when error occurred during acm create or import
    const fn_failure_handling = new _lambda.DockerImageFunction(
      this,
      "function_to_handle_ssl_for_sass_failure",
      {
        code: _lambda.DockerImageCode.fromImageAsset(
          path.join(__dirname, "../../lambda/ssl-for-saas/failure_handling")
        ),
        environment: {
          SNS_TOPIC: sns_topic.topicArn,
          CALLBACK_TABLE: callback_table.tableName,
          JOB_INFO_TABLE: ssl_for_sass_job_info_table.tableName,
          JOB_STATUS_TABLE: ssl_for_saas_job_status_table.tableName,
          TASK_TYPE: "placeholder",
        },
        timeout: Duration.seconds(900),
        role: _fn_failure_handling_lambda_role,
        memorySize: 1024,
      }
    );

    //step function task to handle error
    const failure_handling_job = new _task.LambdaInvoke(
      this,
      "Failure Handling Job",
      {
        lambdaFunction: fn_failure_handling,
        payload: _step.TaskInput.fromObject({
          input: _step.JsonPath.entirePayload,
        }),
        resultPath: "$.fn_failure_handling",
      }
    );

    // {
    //   "Error": "{\"status\": \"FAILED\"}",
    //   "Cause": null
    // }
    const snsFailureNotify = new _task.LambdaInvoke(
      this,
      "Failure Notification Job",
      {
        lambdaFunction: fn_sns_failure_notify,
        payload: _step.TaskInput.fromObject({
          input: _step.JsonPath.entirePayload,
        }),
        // Lambda's result is in the attribute `Payload`
        resultSelector: { Payload: _step.JsonPath.stringAt("$.Payload") },
        resultPath: "$.fn_sns_notify",
      }
    );

    failure_handling_job.next(snsFailureNotify);

    // {
    //     "acm_op": "create",
    //     "auto_creation": "false",
    //     "dist_aggregation": "false",
    //     "enable_cname_check": "true",
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
    const acm_callback_job = new _task.LambdaInvoke(
      this,
      "ACM Create Callback Job",
      {
        lambdaFunction: fn_acm_cb,
        integrationPattern: _step.IntegrationPattern.WAIT_FOR_TASK_TOKEN,
        payload: _step.TaskInput.fromObject({
          task_token: _step.JsonPath.taskToken,
          input: _step.JsonPath.entirePayload,
          callback: "true",
        }),
        resultPath: "$.fn_acm_cb",
      }
    ).addCatch(failure_handling_job, {
      resultPath: "$.error",
    });

    const acm_import_callback_job = new _task.LambdaInvoke(
      this,
      "ACM Import Callback Job",
      {
        lambdaFunction: fn_acm_import_cb,
        integrationPattern: _step.IntegrationPattern.WAIT_FOR_TASK_TOKEN,
        payload: _step.TaskInput.fromObject({
          task_token: _step.JsonPath.taskToken,
          input: _step.JsonPath.entirePayload,
        }),
        resultPath: "$.fn_acm_import_cb",
      }
    ).addCatch(failure_handling_job, {
      // "errors": ["$.errorMessage"],
      resultPath: "$.error",
    });

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
    const acm_callback_handler_job = new _task.LambdaInvoke(
      this,
      "ACM Callback Handler Job",
      {
        lambdaFunction: fn_acm_cb_handler,
        payload: _step.TaskInput.fromObject({
          input: _step.JsonPath.entirePayload,
        }),
        resultSelector: { Payload: _step.JsonPath.stringAt("$.Payload") },
        resultPath: "$.fn_acm_cb_handler",
      }
    );

    // invoke lambda from map state
    const acm_callback_handler_map = new _step.Map(
      this,
      "ACM Callback Handler Map",
      {
        maxConcurrency: 10,
        itemsPath: _step.JsonPath.stringAt("$.cnameList"),
        resultPath: "$.fn_acm_cb_handler_map",
      }
    );
    acm_callback_handler_map.iterator(acm_callback_handler_job);
    acm_callback_handler_map.addCatch(failure_handling_job, {
      resultPath: "$.error",
    });

    const sns_notify_job = new _task.LambdaInvoke(
      this,
      "Success Notification Job",
      {
        lambdaFunction: fn_sns_notify,
        payload: _step.TaskInput.fromObject({
          input: _step.JsonPath.entirePayload,
        }),
        // Lambda's result is in the attribute `Payload`
        resultSelector: { Payload: _step.JsonPath.stringAt("$.Payload") },
        resultPath: "$.fn_sns_notify",
      }
    );

    const wait_10s_for_cert_create = new _step.Wait(
      this,
      "Wait 10s for ACM Cert Create",
      {
        time: _step.WaitTime.duration(Duration.seconds(10)),
      }
    );
    const wait_10s_for_cert_import = new _step.Wait(
      this,
      "Wait 10s for ACM Cert Import",
      {
        time: _step.WaitTime.duration(Duration.seconds(10)),
      }
    );

    // entry point for step function with cert create/import process
    const stepFunctionEntry = new _step.Choice(this, "Initial entry point");
    stepFunctionEntry.when(
      _step.Condition.and(
        _step.Condition.stringEquals("$.acm_op", "create"),
        _step.Condition.stringEquals("$.auto_creation", "true")
      ),
      acm_callback_job
        .next(wait_10s_for_cert_create)
        .next(acm_callback_handler_map)
    );

    stepFunctionEntry.when(
      _step.Condition.and(
        _step.Condition.stringEquals("$.acm_op", "import"),
        _step.Condition.stringEquals("$.auto_creation", "true")
      ),
      acm_import_callback_job
        .next(wait_10s_for_cert_import)
        .next(acm_callback_handler_map)
        .next(sns_notify_job)
    );

    const stepFunction = new _step.StateMachine(this, "SSL for SaaS", {
      definition: stepFunctionEntry,
      stateMachineName: "SSL-for-SaaS-StateMachine",
      stateMachineType: _step.StateMachineType.STANDARD,
      // set global timeout, don't set timeout in callback inside
      timeout: Duration.hours(24),
    });

    // lambda in step function & cron job
    const fn_ssl_api_handler = new _lambda.DockerImageFunction(
      this,
      "fn_ssl_api_handler",
      {
        code: _lambda.DockerImageCode.fromImageAsset(
          path.join(__dirname, "../../lambda/ssl-for-saas/ssl_api_handler")
        ),
        environment: {
          STEP_FUNCTION_ARN: stepFunction.stateMachineArn,
          CALLBACK_TABLE: callback_table.tableName,
          JOB_INFO_TABLE: ssl_for_sass_job_info_table.tableName,
          JOB_STATUS_TABLE: ssl_for_saas_job_status_table.tableName,
          TASK_TYPE: "placeholder",
        },
        timeout: Duration.seconds(900),
        role: _fn_ssl_api_handler_role,
        memorySize: 1024,
      }
    );

    // API Gateway with Lambda proxy integration
    const ssl_api_handler = new _apigw.LambdaRestApi(this, "ssl_api_handler", {
      handler: fn_ssl_api_handler,
      description: "restful api to trigger the ssl for saas workflow",
      proxy: false,
      restApiName: "ssl_for_saas_manager",
      endpointConfiguration: {
        types: [EndpointType.EDGE],
      },
    });

    const ssl_api = ssl_api_handler.root.addResource("ssl_for_saas");

    ssl_api.addMethod("POST", undefined, {
      // authorizationType: AuthorizationType.IAM,
      apiKeyRequired: true,
    });

    const cert_list = ssl_api.addResource("cert_list");
    cert_list.addMethod("GET", undefined, {
      // authorizationType: AuthorizationType.IAM,
      apiKeyRequired: true,
    });

    const list_ssl_jobs = ssl_api.addResource("list_ssl_jobs");
    list_ssl_jobs.addMethod("GET", undefined, {
      // authorizationType: AuthorizationType.IAM,
      apiKeyRequired: true,
    });

    const get_ssl_job = ssl_api.addResource("get_ssl_job");
    get_ssl_job.addMethod("GET", undefined, {
      // authorizationType: AuthorizationType.IAM,
      apiKeyRequired: true,
    });

    // cloudwatch event cron job for 5 minutes
    new events.Rule(this, "ACM status check", {
      schedule: events.Schedule.expression("cron(*/5 * * * ? *)"),
      targets: [new targets.LambdaFunction(fn_acm_cron)],
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
    new events.Rule(this, "ACM health event", {
      eventPattern: {
        region: ["us-east-1"],
        source: ["aws.acm"],
        detailType: ["ACM Certificate Approaching Expiration"],
      },
      targets: [new targets.SnsTopic(sns_topic)],
    });

    // Lambda function to integrate with AppSync
    const fn_appsync_function = new _lambda.DockerImageFunction(
      this,
      "appsync_func",
      {
        code: _lambda.DockerImageCode.fromImageAsset(
          path.join(__dirname, "../../lambda/ssl-for-saas/appsync_func"),
          {
            buildArgs: {
              "--platform": "linux/amd64",
            },
          }
        ),
        environment: {
          STEP_FUNCTION_ARN: stepFunction.stateMachineArn,
          CALLBACK_TABLE: callback_table.tableName,
          JOB_INFO_TABLE: ssl_for_sass_job_info_table.tableName,
          JOB_STATUS_TABLE: ssl_for_saas_job_status_table.tableName,
          TASK_TYPE: "placeholder",
        },
        timeout: Duration.seconds(900),
        role: _fn_appsync_func_role,
        memorySize: 1024,
      }
    );

    //appsyncApi is imported from common stack
    const appsyncApi = props?.appsyncApi;

    // An AppSync datasource backed by a Lambda function
    const appsyncFunc = new _appsync_alpha.LambdaDataSource(
      this,
      "LambdaDataSource",
      {
        api: appsyncApi,
        lambdaFunction: fn_appsync_function,
        description: "Lambda Data Source for cert create/import",
        name: "certMutation",
      }
    );

    // An AppSync resolver to resolve the Lambda function

    appsyncFunc.createResolver({
      typeName: "Mutation",
      fieldName: "certCreateOrImport",
      requestMappingTemplate: _appsync_alpha.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: _appsync_alpha.MappingTemplate.lambdaResult(),
    });

    appsyncFunc.createResolver({
      typeName: "Query",
      fieldName: "listCertifications",
      requestMappingTemplate: _appsync_alpha.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: _appsync_alpha.MappingTemplate.lambdaResult(),
    });

    appsyncFunc.createResolver({
      typeName: "Query",
      fieldName: "listCertificationsWithJobId",
      requestMappingTemplate: _appsync_alpha.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: _appsync_alpha.MappingTemplate.lambdaResult(),
    });

    appsyncFunc.createResolver({
      typeName: "Query",
      fieldName: "listSSLJobs",
      requestMappingTemplate: _appsync_alpha.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: _appsync_alpha.MappingTemplate.lambdaResult(),
    });

    appsyncFunc.createResolver({
      typeName: "Query",
      fieldName: "getJobInfo",
      requestMappingTemplate: _appsync_alpha.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: _appsync_alpha.MappingTemplate.lambdaResult(),
    });

    const usagePlan = ssl_api_handler.addUsagePlan("SSL_for_Saas_UsagePlan", {
      description: "SSL for SAAS API usage plan",
    });
    const apiKey = ssl_api_handler.addApiKey("SSL_for_SAAS_ApiKey");
    usagePlan.addApiKey(apiKey);
    usagePlan.addApiStage({
      stage: ssl_api_handler.deploymentStage,
    });

    new cdk.CfnOutput(this, "ssl_for_saas_rest_api_post", {
      value: ssl_api.path.substring(1),
    });
    new cdk.CfnOutput(this, "list_certs", {
      value: cert_list.path.substring(1),
    });
    new cdk.CfnOutput(this, "SSL for SAAS API key", {
      value: apiKey.keyArn,
    });
  }
}
