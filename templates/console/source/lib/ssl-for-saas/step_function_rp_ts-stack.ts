import * as cdk from "aws-cdk-lib";
import {RemovalPolicy} from "aws-cdk-lib";
import {aws_iam as iam} from "aws-cdk-lib";
import {aws_stepfunctions as _step} from "aws-cdk-lib";
import {aws_stepfunctions_tasks as _task} from "aws-cdk-lib";
import {aws_lambda as _lambda} from "aws-cdk-lib";
import {aws_sns as sns} from "aws-cdk-lib";
import {aws_sns_subscriptions as subs} from "aws-cdk-lib";
import {aws_dynamodb as dynamodb} from "aws-cdk-lib";
import {aws_events as events} from "aws-cdk-lib";
import {aws_events_targets as targets} from "aws-cdk-lib";
import {aws_apigateway as _apigw} from "aws-cdk-lib";
import * as _appsync_alpha from "@aws-cdk/aws-appsync-alpha";
import * as logs from "aws-cdk-lib/aws-logs";
import {Duration} from "aws-cdk-lib";
import {aws_kms as kms} from "aws-cdk-lib";
import path from "path";
import {CommonProps} from "../cf-common/cf-common-stack";
import {
    AccessLogFormat,
    EndpointType,
    LogGroupLogDestination,
    RequestValidator,
} from "aws-cdk-lib/aws-apigateway";
import {Construct} from "constructs";
import "./iam_policies";
import {
    stepFunction_loggin_policy,
    lambda_rw_policy,
    stepFunction_run_policy,
    lambdaRunPolicy,
    acm_admin_policy,
    ddb_rw_policy,
    cloudfront_create_update_policy,
    kms_policy,
    sns_update_policy,
    s3_read_policy,
    tag_update_policy, quota_service_policy
} from "./iam_policies";
import * as appsync from "@aws-cdk/aws-appsync-alpha";
import {PythonFunction, PythonFunctionProps, PythonLayerVersion} from "@aws-cdk/aws-lambda-python-alpha";
import {Architecture, Code, LayerVersion, LayerVersionProps, Runtime} from "aws-cdk-lib/aws-lambda";

export interface StepFunctionProps extends CommonProps {
    configVersionDDBTableName: string;
    notificationEmail: string;
}

// export class StepFunctionRpTsStack extends Stack {
//   constructor(scope: Construct, id: string, props?: StepFunctionProps) {
//     super(scope, id, props);
//     new StepFunctionRpTsConstruct(this, id, props);
//   }
// }

declare interface CommonLambdaLayers {
    openSSlLayer: LayerVersion
    sharedPythonLibLayer: LayerVersion
}

declare interface SslFunctionRolesSummary {
    _fn_acm_import_cb_role:iam.Role,
    _fn_acm_cb_role:iam.Role,
    _fn_acm_cb_handler_role:iam.Role,
    _fn_failure_handling_lambda_role:iam.Role,
    _stepFunction_loggin_role:iam.Role,
    _fn_acm_cron_role:iam.Role,
    _fn_appsync_func_role:iam.Role,
    _fn_sns_notify_role: iam.Role,
    _fn_ssl_api_handler_role: iam.Role,
    _fn_job_create_check_quota_role: iam.Role
}

declare interface SslFunctionsSummary {

    // lambda function to handle acm import operation
    fn_acm_import_cb: _lambda.IFunction,

    // lambda function to handle acm create operation
    fn_acm_cb: _lambda.IFunction,

    // lambda function to create cloudfront distribution after certification been verified and issued
    fn_acm_cb_handler: _lambda.IFunction,

    // send out sns failure notification
    fn_sns_failure_notify: _lambda.IFunction,

    // send out sns notification
    fn_sns_notify: _lambda.IFunction,

    //step function task to handle error
    // function to clean up garbage resources when error occurred during acm create or import
    fn_failure_handling: _lambda.IFunction,

    // lambda function to be called by appsyync function and api handler to update the job validation task status
    fn_job_status_update: _lambda.IFunction,

    // bind acm cert to cloudfront
    fn_cloudfront_bind: _lambda.IFunction,

    // create ssl job and check acm and cloudfront resources quota
    fn_job_create_check_resource: _lambda.IFunction
}

declare interface SslStepFunctionsSegments {
    // {
    //   "Error": "{\"status\": \"FAILED\"}",
    //   "Cause": null
    // }
    failure_handling_job: _task.LambdaInvoke,

    snsFailureNotify: _task.LambdaInvoke,
    acm_callback_job: _task.LambdaInvoke,

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
    acm_import_callback_job: _task.LambdaInvoke,

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
    acm_callback_handler_job: _task.LambdaInvoke,
    cloudfront_bind_job: _task.LambdaInvoke,
    sns_notify_job: _task.LambdaInvoke,

    job_create_check_resource_job: _task.LambdaInvoke
}

export class StepFunctionRpTsConstruct extends Construct {
    readonly baseFolder = 'lambda/ssl_for_saas';
    readonly src = `${this.baseFolder}/functions`;


    constructor(scope: Construct, id: string, props?: StepFunctionProps) {
        super(scope, id);

        //check appsync is existed in props
        if (props == null) {
            throw Error("The props can not be null");
        }
        if (props.appsyncApi == null) {
            throw Error("appsync should be included in the props");
        }

        // dynamodb table for acm callback
        const callback_table = this.createAcmCallBackDynamoDb()

        // dynamodb table for job info
        const ssl_for_sass_job_info_table = this.createSslForSaasJobInfoTable()

        const sns_topic = this.createSnsTopic(props.notificationEmail)

        const configVersionDDBTableName = props.configVersionDDBTableName;

        const roles = this.createRoles(sns_topic);

        const layers = this.createCommonLayers();

        this.createAcmCronJob(
            callback_table.tableName,
            ssl_for_sass_job_info_table.tableName,
            sns_topic,
            roles._fn_acm_cron_role,
            layers
        );

        const functions = this.createAllFunctions(scope,
            roles,
            sns_topic,
            props.appsyncApi,
            callback_table.tableName,
            ssl_for_sass_job_info_table.tableName,
            configVersionDDBTableName,
            layers
        );

        const stepFunctionSegments = this.createSslStepFunctionsSegments(functions)

        stepFunctionSegments.acm_callback_job.addCatch(stepFunctionSegments.failure_handling_job, {
            resultPath: "$.error",
        });

        stepFunctionSegments.acm_import_callback_job.addCatch(stepFunctionSegments.failure_handling_job, {
            // "errors": ["$.errorMessage"],
            resultPath: "$.error",
        });

        // invoke lambda from map state
        const acm_callback_handler_map = new _step.Map(
            this,
            "CloudFront & ACM Creation Map",
            {
                maxConcurrency: 5,
                itemsPath: _step.JsonPath.stringAt("$.cnameList"),
                resultPath: "$.fn_acm_cb_handler_map",
                parameters: {
                    "aws_request_id.$": "$.aws_request_id",
                    "value.$": "$$.Map.Item.Value"
                }
            }
        );
        // stepFunctionSegments.acm_callback_handler_job.next(stepFunctionSegments.cloudfront_bind_job);
        acm_callback_handler_map.iterator(stepFunctionSegments.acm_callback_handler_job);
        acm_callback_handler_map.addCatch(stepFunctionSegments.failure_handling_job, {
            resultPath: "$.error",
        });

        stepFunctionSegments.job_create_check_resource_job.addCatch(stepFunctionSegments.failure_handling_job, {
            resultPath: "$.error",
        });

        stepFunctionSegments.job_create_check_resource_job.next(acm_callback_handler_map);

        const bind_handler_map = new _step.Map(
            this,
            "Bind ACM SSL Cert to CloudFront Map",
            {
                maxConcurrency: 5,
                itemsPath: _step.JsonPath.stringAt("$.fn_acm_cb_handler_map"),
                resultPath: _step.JsonPath.DISCARD,
            }
        );
        bind_handler_map.iterator(stepFunctionSegments.cloudfront_bind_job);
        bind_handler_map.addCatch(stepFunctionSegments.failure_handling_job, {
            resultPath: "$.error",
        });
        bind_handler_map.next(stepFunctionSegments.sns_notify_job);
        stepFunctionSegments.failure_handling_job.next(stepFunctionSegments.snsFailureNotify);

        // entry point for step function with cert create/import process
        const stepFunctionEntry = new _step.Choice(this, "Create and Process Acm Certificate")
            .when(
                _step.Condition.and(
                    _step.Condition.stringEquals("$.acm_op", "create"),
                    _step.Condition.stringEquals("$.auto_creation", "true")
                ),
                stepFunctionSegments.acm_callback_job
                    .next(bind_handler_map)
            )
            .when(
                _step.Condition.and(
                    _step.Condition.stringEquals("$.acm_op", "import"),
                    _step.Condition.stringEquals("$.auto_creation", "true")
                ),
                stepFunctionSegments.acm_import_callback_job
                    .next(bind_handler_map)
            );

        acm_callback_handler_map.next(stepFunctionEntry);

        const stepFunction = new _step.StateMachine(this, "SSL for SaaS", {
            definition: stepFunctionSegments.job_create_check_resource_job,
            role: roles._stepFunction_loggin_role,
            stateMachineName: "SSL-for-SaaS-StateMachine",
            stateMachineType: _step.StateMachineType.STANDARD,
            // set global timeout, don't set timeout in callback inside
            timeout: Duration.days(60),
            logs: {
                destination: new logs.LogGroup(this, "ssl_step_function_logs", {
                    logGroupName: "/aws/step-functions/ssl_step_function_logs",
                    removalPolicy: RemovalPolicy.DESTROY,
                }),
                level: _step.LogLevel.ERROR,
            },
        });

        const fn_ssl_api_handler = new PythonFunction(scope, 'fn_ssl_api_handler', <PythonFunctionProps>{
            entry: `${this.src}/ssl_api_handler`,
            architecture: Architecture.X86_64,
            runtime: Runtime.PYTHON_3_9,
            index: 'handler.py',
            handler: 'handler',
            timeout: Duration.seconds(900),
            role: roles._fn_ssl_api_handler_role,
            memorySize: 1024,
            environment: {
                STEP_FUNCTION_ARN: stepFunction.stateMachineArn,
                CALLBACK_TABLE: callback_table.tableName,
                JOB_INFO_TABLE: ssl_for_sass_job_info_table.tableName,
                SNS_TOPIC: sns_topic.topicArn,
                TASK_TYPE: "placeholder",
                STATUS_UPDATE_LAMBDA_FUNCTION: functions.fn_job_status_update.functionName,
            },
            layers: [ layers.sharedPythonLibLayer, layers.openSSlLayer ],
        });

        this.createRestfulApis(fn_ssl_api_handler);

        // Lambda function to integrate with AppSync
        const fn_appsync_function = new PythonFunction(scope, 'appsync_func', <PythonFunctionProps>{
            entry: `${this.src}/appsync_func`,
            architecture: Architecture.X86_64,
            runtime: Runtime.PYTHON_3_9,
            index: 'handler.py',
            handler: 'handler',
            timeout: Duration.seconds(900),
            role: roles._fn_appsync_func_role,
            memorySize: 1024,
            layers: [
                layers.sharedPythonLibLayer, layers.openSSlLayer
            ],
            environment: {
                STEP_FUNCTION_ARN: stepFunction.stateMachineArn,
                CALLBACK_TABLE: callback_table.tableName,
                JOB_INFO_TABLE: ssl_for_sass_job_info_table.tableName,
                TASK_TYPE: "placeholder",
                SNS_TOPIC: sns_topic.topicArn,
                STATUS_UPDATE_LAMBDA_FUNCTION: functions.fn_job_status_update.functionName,
            },
        })

        this.createAppsync(props.appsyncApi, fn_appsync_function);
    }


    private createCommonLayers(): CommonLambdaLayers {
        return {
            openSSlLayer: new LayerVersion(this, 'openssl-layer', <LayerVersionProps>{
                compatibleRuntimes: [Runtime.PYTHON_3_9],
                code: Code.fromAsset(`${this.baseFolder}/openssl-layer/layer.zip`)
            }),
            sharedPythonLibLayer:  new PythonLayerVersion(this, 'cloudfront-ssl-shared-layer', {
                entry:  `${this.baseFolder}/`,
                bundling: {
                    outputPathSuffix: '/python',
                },
                compatibleRuntimes: [Runtime.PYTHON_3_9],
            })
        }
    }


    private createRoleWithPolicies(id: string, assumedBy: iam.IPrincipal, ...policies: iam.PolicyStatement[]): iam.Role {
        const newRole = new iam.Role(this, id, {
            assumedBy: assumedBy,
        });
        for(let policy of policies) {
            newRole.addToPolicy(policy)
        }
        return newRole
   }


    private createAcmCallBackDynamoDb(): dynamodb.Table {
        const callback_table = new dynamodb.Table(this, "acm_metadata", {
            partitionKey: {
                name: "taskToken",
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: "domainName",
                type: dynamodb.AttributeType.STRING,
            },
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        callback_table
            .autoScaleReadCapacity({
                minCapacity: 20,
                maxCapacity: 50,
            })
            .scaleOnUtilization({targetUtilizationPercent: 75});
        return callback_table

    }

    private createSslForSaasJobInfoTable(): dynamodb.Table {
        const ssl_for_sass_job_info_table = new dynamodb.Table(
            this,
            "ssl_for_saas_job_info_table",
            {
                partitionKey: {
                    name: "jobId",
                    type: dynamodb.AttributeType.STRING,
                },
                removalPolicy: cdk.RemovalPolicy.DESTROY,
            }
        );
        ssl_for_sass_job_info_table
            .autoScaleWriteCapacity({
                minCapacity: 40,
                maxCapacity: 100,
            })
            .scaleOnUtilization({targetUtilizationPercent: 75});
        return ssl_for_sass_job_info_table
    }

    private createSnsTopic(notificationEmail:string): sns.Topic {
        const snsKey = new kms.Key(this, "snsCustomKey", {
            enableKeyRotation: true,
        });

        // create sns topic
        const sns_topic = new sns.Topic(
            this,
            "CloudFront_Distribution_Notification",
            {
                displayName: "SNS Topic",
                topicName: "CloudFront_Distribution_Notification",
                masterKey: snsKey,
            }
        );

        // create email subscription
        sns_topic.addSubscription(
            new subs.EmailSubscription(notificationEmail)
        );
        sns_topic.addToResourcePolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.DENY,
                principals: [new iam.AnyPrincipal()],
                resources: [sns_topic.topicArn],
                actions: ["sns:Publish"],
                conditions: {Bool: {"aws:SecureTransport": "false"}},
            })
        );
        return sns_topic
    }

    private createAcmCronJob(callbackTable: string, sslForSaasJobInfoTable: string, snsTopic: sns.Topic, cronRole: iam.Role, layers: CommonLambdaLayers) {

        const fn_acm_cron = new PythonFunction(
            this,
            'acm_cron_job',
            <PythonFunctionProps>{
                entry: `${this.src}/acm_cron`,
                architecture: Architecture.X86_64,
                runtime: Runtime.PYTHON_3_9,
                index: 'handler.py',
                handler: 'handler',
                timeout: Duration.seconds(900),
                role: cronRole,
                memorySize: 1024,
                environment: {
                    PAYLOAD_EVENT_KEY: "placeholder",
                    CALLBACK_TABLE: callbackTable,
                    JOB_INFO_TABLE: sslForSaasJobInfoTable,
                    TASK_TYPE: "placeholder",
                    SNS_TOPIC: snsTopic.topicArn,
                },
                layers: [layers.sharedPythonLibLayer]
            }
        )

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
            targets: [new targets.SnsTopic(snsTopic)],
        });
    }

    private createRestfulApis(apiHandler: _lambda.IFunction) {
        const apiAccessLogGroup = new logs.LogGroup(
            this,
            "cloudfront_ssl-for-saas_ApiGatewayAccessLogs"
        );
        // API Gateway with Lambda proxy integration
        const ssl_api_handler = new _apigw.LambdaRestApi(this, "ssl_api_handler", {
            handler: apiHandler ,
            description: "restful api to trigger the ssl for saas workflow",
            proxy: false,
            restApiName: "ssl_for_saas_manager",
            endpointConfiguration: {
                types: [EndpointType.EDGE],
            },
            deployOptions: {
                accessLogDestination: new LogGroupLogDestination(apiAccessLogGroup),
                accessLogFormat: AccessLogFormat.clf(),
            },
        });

        const ssl_api = ssl_api_handler.root.addResource("ssl_for_saas");

        const ssl_requestValidator = new RequestValidator(
            this,
            "SSLRequestValidator",
            {
                restApi: ssl_api_handler,
                requestValidatorName: "SSLApiValidator",
                validateRequestBody: false,
                validateRequestParameters: true,
            }
        );

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
            requestParameters: {
                "method.request.querystring.jobId": true,
            },
            requestValidator: ssl_requestValidator,
        });

        const list_cloudfront_arn_with_jobId = ssl_api.addResource(
            "list_cloudfront_arn_with_jobId"
        );
        list_cloudfront_arn_with_jobId.addMethod("GET", undefined, {
            // authorizationType: AuthorizationType.IAM,
            apiKeyRequired: true,
            requestParameters: {
                "method.request.querystring.jobId": true,
            },
            requestValidator: ssl_requestValidator,
        });

        const list_ssl_certification_with_jobId = ssl_api.addResource(
            "list_ssl_certification_with_jobId"
        );
        list_ssl_certification_with_jobId.addMethod("GET", undefined, {
            // authorizationType: AuthorizationType.IAM,
            apiKeyRequired: true,
            requestParameters: {
                "method.request.querystring.jobId": true,
            },
            requestValidator: ssl_requestValidator,
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
            description: "the ssl for saas post rest api ",
        });
        new cdk.CfnOutput(this, "list_certs", {
            value: cert_list.path.substring(1),
            description: "the ssl for saas list certs rest api ",
        });
        new cdk.CfnOutput(this, "SSL for SAAS API key", {
            value: apiKey.keyArn,
            description: "the ssl for saas rest api key ",
        });
    }

    private createAppsync(appsyncApi: appsync.GraphqlApi, handler: _lambda.IFunction) {
        // An AppSync datasource backed by a Lambda function
        const appsyncFunc = new _appsync_alpha.LambdaDataSource(
            this,
            "LambdaDataSource",
            {
                api: appsyncApi,
                lambdaFunction: handler,
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
            fieldName: "listCloudFrontArnWithJobId",
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
    }

    private createRoles(sns_topic: sns.Topic): SslFunctionRolesSummary {
        return {
            _fn_acm_import_cb_role: this.createRoleWithPolicies("_fn_acm_import_cb_role",
                new iam.ServicePrincipal("lambda.amazonaws.com"),
                ...[
                    lambdaRunPolicy,
                    acm_admin_policy,
                    ddb_rw_policy,
                    cloudfront_create_update_policy,
                    kms_policy,
                    sns_update_policy(sns_topic.topicArn)
                ]),

            _fn_acm_cb_role: this.createRoleWithPolicies("_fn_acm_cb_role",
                new iam.ServicePrincipal("lambda.amazonaws.com"),
                ...[
                    lambdaRunPolicy,
                    acm_admin_policy,
                    ddb_rw_policy,
                    sns_update_policy(sns_topic.topicArn),
                    cloudfront_create_update_policy,
                    kms_policy,
                ]),

            _fn_acm_cb_handler_role: this.createRoleWithPolicies(
                "_fn_acm_cb_handler_role",
                new iam.CompositePrincipal(
                    new iam.ServicePrincipal("edgelambda.amazonaws.com"),
                    new iam.ServicePrincipal("lambda.amazonaws.com")
                ),
                ...[
                    lambdaRunPolicy,
                    acm_admin_policy,
                    ddb_rw_policy,
                    stepFunction_run_policy,
                    cloudfront_create_update_policy,
                    s3_read_policy,
                    lambda_rw_policy,
                    sns_update_policy(sns_topic.topicArn),
                    kms_policy,
                ]
            ),


            _fn_failure_handling_lambda_role: this.createRoleWithPolicies(
                "_fn_failure_handling_lambda_role",
                new iam.ServicePrincipal("lambda.amazonaws.com"),
                ...[
                    lambdaRunPolicy,
                    acm_admin_policy,
                    ddb_rw_policy,
                ]
            ),

            _stepFunction_loggin_role: this.createRoleWithPolicies(
                "_stepFunction_loggin_role", new iam.ServicePrincipal("states.amazonaws.com"),
                ...[
                    stepFunction_loggin_policy,
                    lambda_rw_policy,
                    stepFunction_run_policy,
                    lambdaRunPolicy,
                ]
            ),

            _fn_acm_cron_role: this.createRoleWithPolicies("_fn_acm_cron_role", new iam.ServicePrincipal("lambda.amazonaws.com"),
                ...[
                    lambdaRunPolicy,
                    acm_admin_policy,
                    ddb_rw_policy,
                    stepFunction_run_policy,
                    kms_policy,
                ]),


            _fn_appsync_func_role: this.createRoleWithPolicies("_fn_appsync_func_role", new iam.ServicePrincipal("lambda.amazonaws.com"),
                ...[
                    lambdaRunPolicy,
                    acm_admin_policy,
                    ddb_rw_policy,
                    stepFunction_run_policy,
                    tag_update_policy,
                    kms_policy,
                    sns_update_policy(sns_topic.topicArn),
                    lambda_rw_policy,
                ]),


            _fn_sns_notify_role: this.createRoleWithPolicies("_fn_sns_notify_role",
                new iam.ServicePrincipal("lambda.amazonaws.com"),
                ...[
                    lambdaRunPolicy,
                    ddb_rw_policy,
                    sns_update_policy(sns_topic.topicArn),
                    kms_policy,
                    acm_admin_policy
                ]
            ),

            _fn_ssl_api_handler_role: this.createRoleWithPolicies(
                "_fn_ssl_api_handler_role", new iam.ServicePrincipal("lambda.amazonaws.com"),
                ...[
                    lambdaRunPolicy,
                    acm_admin_policy,
                    ddb_rw_policy,
                    stepFunction_run_policy,
                    tag_update_policy,
                    kms_policy,
                    sns_update_policy(sns_topic.topicArn),
                ]
            ),

            _fn_job_create_check_quota_role: this.createRoleWithPolicies(
                "_fn_job_create_check_quota_role", new iam.ServicePrincipal("lambda.amazonaws.com"),
                ...[
                    lambdaRunPolicy,
                    acm_admin_policy,
                    ddb_rw_policy,
                    stepFunction_run_policy,
                    tag_update_policy,
                    kms_policy,
                    sns_update_policy(sns_topic.topicArn),
                    quota_service_policy,
                    cloudfront_create_update_policy
                ]
            )
        }
    }


    private createAllFunctions(scope: Construct, roles: SslFunctionRolesSummary, sns_topic: sns.Topic,
                               appsync: appsync.GraphqlApi, callbackTable: string, sslFoSaasJobInfoTable: string, configVersionDDBTableName: string, layers: CommonLambdaLayers): SslFunctionsSummary {
        return {
            fn_acm_import_cb: new PythonFunction(
                scope,
                'acm_import_callback',
                <PythonFunctionProps>{
                    entry: `${this.src}/acm_import_cb`,
                    architecture: Architecture.X86_64,
                    runtime: Runtime.PYTHON_3_9,
                    index: 'handler.py',
                    handler: 'handler',
                    timeout: Duration.seconds(900),
                    role: roles._fn_acm_import_cb_role,
                    memorySize: 1024,
                    environment: {
                        SNS_TOPIC: sns_topic.topicArn,
                        CALLBACK_TABLE: callbackTable,
                        JOB_INFO_TABLE: sslFoSaasJobInfoTable,
                        TASK_TYPE: "placeholder",
                        CONFIG_VERSION_DDB_TABLE_NAME: configVersionDDBTableName,
                    },
                    layers: [layers.sharedPythonLibLayer,layers.openSSlLayer]
                }
            ),

           fn_acm_cb: new PythonFunction(scope, 'acm_callback', <PythonFunctionProps>{
                entry: `${this.src}/acm_cb`,
                architecture: Architecture.X86_64,
                runtime: Runtime.PYTHON_3_9,
                index: 'handler.py',
                handler: 'handler',
                timeout: Duration.seconds(900),
                role: roles._fn_acm_cb_role,
                memorySize: 512,
                environment: {
                    SNS_TOPIC: sns_topic.topicArn,
                    CALLBACK_TABLE: callbackTable,
                    JOB_INFO_TABLE: sslFoSaasJobInfoTable,
                    TASK_TYPE: "placeholder",
                    CONFIG_VERSION_DDB_TABLE_NAME: configVersionDDBTableName,
                },
                layers: [layers.sharedPythonLibLayer],
            }),

            fn_acm_cb_handler: new PythonFunction(scope, 'acm_callback_handler', <PythonFunctionProps>{
                entry: `${this.src}/acm_cb_handler`,
                architecture: Architecture.X86_64,
                runtime: Runtime.PYTHON_3_9,
                index: 'handler.py',
                handler: 'handler',
                timeout: Duration.seconds(900),
                role: roles._fn_acm_cb_handler_role,
                memorySize: 1024,
                environment: {
                    PAYLOAD_EVENT_KEY: "placeholder",
                    CALLBACK_TABLE: callbackTable,
                    JOB_INFO_TABLE: sslFoSaasJobInfoTable,
                    TASK_TYPE: "placeholder",
                    GRAPHQL_API_URL: appsync.graphqlUrl,
                    GRAPHQL_API_KEY: appsync.apiKey || "",
                    CONFIG_VERSION_DDB_TABLE_NAME: configVersionDDBTableName,
                    SNS_TOPIC: sns_topic.topicArn,
                },
                layers: [layers.sharedPythonLibLayer],
            }),

            fn_sns_failure_notify: new PythonFunction(scope, 'sns_failure_notify', <PythonFunctionProps>{
                entry: `${this.src}/sns_failure_notify`,
                architecture: Architecture.X86_64,
                runtime: Runtime.PYTHON_3_9,
                index: 'handler.py',
                handler: 'handler',
                timeout: Duration.seconds(900),
                role: roles._fn_sns_notify_role,
                memorySize: 1024,
                environment: {
                    SNS_TOPIC: sns_topic.topicArn,
                    CALLBACK_TABLE: callbackTable,
                    JOB_INFO_TABLE: sslFoSaasJobInfoTable,
                    TASK_TYPE: "placeholder",
                },
                layers: [layers.sharedPythonLibLayer],
            }),

            fn_sns_notify: new PythonFunction(scope, 'sns_notify', <PythonFunctionProps>{
                entry: `${this.src}/sns_notify`,
                architecture: Architecture.X86_64,
                runtime: Runtime.PYTHON_3_9,
                index: 'handler.py',
                handler: 'handler',
                timeout: Duration.seconds(900),
                role: roles._fn_sns_notify_role,
                memorySize: 1024,
                environment: {
                    SNS_TOPIC: sns_topic.topicArn,
                    CALLBACK_TABLE: callbackTable,
                    JOB_INFO_TABLE: sslFoSaasJobInfoTable,
                    TASK_TYPE: "placeholder",
                },
                layers: [layers.sharedPythonLibLayer],
            }),


            fn_failure_handling: new PythonFunction(scope, 'function_to_handle_ssl_for_sass_failure', <PythonFunctionProps>{
                entry: `${this.src}/failure_handling`,
                architecture: Architecture.X86_64,
                runtime: Runtime.PYTHON_3_9,
                index: 'handler.py',
                handler: 'handler',
                timeout: Duration.seconds(900),
                role: roles._fn_failure_handling_lambda_role,
                memorySize: 1024,
                environment: {
                    SNS_TOPIC: sns_topic.topicArn,
                    CALLBACK_TABLE: callbackTable,
                    JOB_INFO_TABLE: sslFoSaasJobInfoTable,
                    TASK_TYPE: "placeholder",
                },
                layers: [layers.sharedPythonLibLayer,layers.openSSlLayer],
            }),

            fn_job_status_update: new PythonFunction(scope, 'job_status_update', <PythonFunctionProps>{
                entry: `${this.src}/job_status_update`,
                architecture: Architecture.X86_64,
                runtime: Runtime.PYTHON_3_9,
                index: 'handler.py',
                handler: 'handler',
                timeout: Duration.seconds(900),
                role: roles._fn_acm_cron_role,
                memorySize: 1024,
                environment: {
                    PAYLOAD_EVENT_KEY: "placeholder",
                    CALLBACK_TABLE: callbackTable,
                    JOB_INFO_TABLE: sslFoSaasJobInfoTable,
                    TASK_TYPE: "placeholder",
                    SNS_TOPIC: sns_topic.topicArn,
                },
                layers: [layers.sharedPythonLibLayer],
            }),

            fn_cloudfront_bind: new PythonFunction(scope, 'job_cloudfront_bind', <PythonFunctionProps>{
                entry: `${this.src}/cloudfront_bind`,
                architecture: Architecture.X86_64,
                runtime: Runtime.PYTHON_3_9,
                index: 'handler.py',
                handler: 'handler',
                timeout: Duration.seconds(900),
                role: roles._fn_acm_cb_handler_role,
                memorySize: 1024,
                environment: {
                    PAYLOAD_EVENT_KEY: "placeholder",
                    CALLBACK_TABLE: callbackTable,
                    JOB_INFO_TABLE: sslFoSaasJobInfoTable,
                    TASK_TYPE: "placeholder",
                    GRAPHQL_API_URL: appsync.graphqlUrl,
                    GRAPHQL_API_KEY: appsync.apiKey || "",
                    CONFIG_VERSION_DDB_TABLE_NAME: configVersionDDBTableName,
                    SNS_TOPIC: sns_topic.topicArn,
                },
                layers: [layers.sharedPythonLibLayer],
            }),

            fn_job_create_check_resource: new PythonFunction(scope, 'job_create_check_resource', <PythonFunctionProps>{
                entry: `${this.src}/quota_check`,
                architecture: Architecture.X86_64,
                runtime: Runtime.PYTHON_3_9,
                index: 'handler.py',
                handler:'handler',
                timeout: Duration.seconds(900),
                role: roles._fn_job_create_check_quota_role,
                memorySize: 1024,
                environment: {
                    PAYLOAD_EVENT_KEY: "placeholder",
                    CALLBACK_TABLE: callbackTable,
                    JOB_INFO_TABLE: sslFoSaasJobInfoTable,
                    TASK_TYPE: "placeholder",
                    GRAPHQL_API_URL: appsync.graphqlUrl,
                    GRAPHQL_API_KEY: appsync.apiKey || "",
                    CONFIG_VERSION_DDB_TABLE_NAME: configVersionDDBTableName,
                    SNS_TOPIC: sns_topic.topicArn,
                },
                layers: [layers.sharedPythonLibLayer],
            }),
        }
    }

    private createSslStepFunctionsSegments(functions: SslFunctionsSummary): SslStepFunctionsSegments {
        return {
            failure_handling_job: new _task.LambdaInvoke(
                this,
                "Failure Handling Job",
                {
                    lambdaFunction: functions.fn_failure_handling,
                    payload: _step.TaskInput.fromObject({
                        input: _step.JsonPath.entirePayload,
                    }),
                    resultPath: "$.fn_failure_handling",
                }
            ),

            snsFailureNotify: new _task.LambdaInvoke(
                this,
                "Failure Notification Job",
                {
                    lambdaFunction: functions.fn_sns_failure_notify,
                    payload: _step.TaskInput.fromObject({
                        input: _step.JsonPath.entirePayload,
                    }),
                    // Lambda's result is in the attribute `Payload`
                    resultSelector: {Payload: _step.JsonPath.stringAt("$.Payload")},
                    resultPath: "$.fn_sns_notify",
                }
            ),

            acm_callback_job: new _task.LambdaInvoke(
                this,
                "ACM Create Callback Job",
                {
                    lambdaFunction: functions.fn_acm_cb,
                    integrationPattern: _step.IntegrationPattern.WAIT_FOR_TASK_TOKEN,
                    payload: _step.TaskInput.fromObject({
                        task_token: _step.JsonPath.taskToken,
                        input: _step.JsonPath.entirePayload,
                        callback: "true",
                    }),
                    resultPath: "$.fn_acm_cb",
                }
            ),

            cloudfront_bind_job: new _task.LambdaInvoke(
                this,
                "Bind SSL Cert to CloudFront Job",
                {
                    lambdaFunction: functions.fn_cloudfront_bind,
                    payload: _step.TaskInput.fromObject({
                        input: _step.JsonPath.entirePayload,
                        callback: "true",
                    }),
                    resultPath: "$.fn_acm_cb_handler",
                }
            ),

            acm_import_callback_job: new _task.LambdaInvoke(
                this,
                "ACM Import Callback Job",
                {
                    lambdaFunction: functions.fn_acm_import_cb,
                    integrationPattern: _step.IntegrationPattern.WAIT_FOR_TASK_TOKEN,
                    payload: _step.TaskInput.fromObject({
                        task_token: _step.JsonPath.taskToken,
                        input: _step.JsonPath.entirePayload,
                    }),
                    resultPath: "$.fn_acm_import_cb",
                }
            ),

            acm_callback_handler_job: new _task.LambdaInvoke(
                this,
                "CloudFront & ACM Creation Job",
                {
                    lambdaFunction: functions.fn_acm_cb_handler,
                    payload: _step.TaskInput.fromObject({
                        input: _step.JsonPath.entirePayload,
                    }),
                    resultSelector: {
                        Payload: _step.JsonPath.stringAt("$.Payload")
                    },
                    resultPath: "$.fn_cloudfront_bind",
                    timeout: Duration.seconds(900),
                }
            ),

            sns_notify_job: new _task.LambdaInvoke(
                this,
                "Success Completed Job and Update Job Detail",
                {
                    lambdaFunction: functions.fn_sns_notify,
                    payload: _step.TaskInput.fromObject({
                        input: _step.JsonPath.entirePayload,
                    }),
                    // Lambda's result is in the attribute `Payload`
                    resultSelector: {Payload: _step.JsonPath.stringAt("$.Payload")},
                    resultPath: "$.fn_sns_notify",
                }
            ),

            job_create_check_resource_job: new _task.LambdaInvoke(
                this,
                "Quota Check",
                {
                    lambdaFunction: functions.fn_job_create_check_resource,
                    payload: _step.TaskInput.fromObject({
                        input: _step.JsonPath.entirePayload,
                    }),
                    // Lambda's result is in the attribute `Payload`
                    resultSelector: {Payload: _step.JsonPath.stringAt("$.Payload")},
                    resultPath: "$.fn_job_create_check_resource",
                }
            ),
        }
    }
}
