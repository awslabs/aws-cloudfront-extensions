from unicodedata import name
from aws_cdk import (
    Stack,
    aws_iam as iam,
    aws_stepfunctions as _step,
    aws_stepfunctions_tasks as _task,
    aws_lambda as _lambda,
    aws_sns as sns,
    aws_sns_subscriptions as subs,
    aws_dynamodb as dynamodb,
    aws_events as events,
    aws_events_targets as targets,
    aws_apigateway as _apigw,
    aws_appsync as _appsync,
    aws_appsync_alpha as _appsync_alpha,
    CfnParameter,
    Duration,
    # core
)

from constructs import Construct

START_EXECUTION_REQUEST_TEMPLATE = """
  {
    "version": "2018-05-29",
    "method": "POST",
    "resourcePath": "/",
    "params": {
      "headers": {
        "content-type": "application/x-amz-json-1.0",
        "x-amz-target":"AWSStepFunctions.StartSyncExecution"
      },
      "body": {
        "stateMachineArn": "${stateMachineArn}",
        "name" : "$context.args.execution.name",
        "input": "{ \\\"input\\\": \\\"$context.args.execution.input\\\"}"
      }
    }
  }
"""

RESPONSE_TEMPLATE = """
## Raise a GraphQL field error in case of a datasource invocation error
#if($ctx.error)
  $util.error($ctx.error.message, $ctx.error.type)
#end
## if the response status code is not 200, then return an error. Else return the body **
#if($ctx.result.statusCode == 200)
    ## If response is 200, return the body.
  $ctx.result.body
#else
    ## If response is not 200, append the response to error block.
    $utils.appendError($ctx.result.body, $ctx.result.statusCode)
#end
"""

class StepFunctionRpStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # dynadmodb table for acm callback
        callback_table = dynamodb.Table(
            self,
            "acm_metadata",
            table_name="acm_metadata_store",
            partition_key=dynamodb.Attribute(
                name="taskToken",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="domainName",
                type=dynamodb.AttributeType.STRING
            )
        )

        # create sns topic
        sns_topic = sns.Topic(self, "CloudFront_Distribution_Notification",
            display_name="SNS Topic",
            topic_name="CloudFront_Distribution_Notification"
        )

        # create email subscription
        email_address = CfnParameter(self, "email-subs")
        sns_topic.add_subscription(subs.EmailSubscription(email_address.value_as_string))

        _fn_appsync_func_role = iam.Role(self, "_fn_appsync_func_role",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole"),
                iam.ManagedPolicy.from_aws_managed_policy_name("AWSCertificateManagerFullAccess"),
                iam.ManagedPolicy.from_aws_managed_policy_name("AmazonDynamoDBFullAccess"),
                iam.ManagedPolicy.from_aws_managed_policy_name("AWSStepFunctionsFullAccess")
            ]
        )

        _fn_acm_direct_op_role = iam.Role(self, "_fn_acm_direct_op_role",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole"),
                iam.ManagedPolicy.from_aws_managed_policy_name("AWSCertificateManagerFullAccess"),
                iam.ManagedPolicy.from_aws_managed_policy_name("AmazonDynamoDBFullAccess"),
                iam.ManagedPolicy.from_aws_managed_policy_name("AWSStepFunctionsFullAccess")
            ]
        )

        _fn_acm_import_cb_role = iam.Role(self, "_fn_acm_op_role",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole"),
                iam.ManagedPolicy.from_aws_managed_policy_name("AWSCertificateManagerFullAccess"),
                iam.ManagedPolicy.from_aws_managed_policy_name("AmazonDynamoDBFullAccess")
            ]
        )

        _fn_acm_cb_role = iam.Role(self, "_fn_acm_cb_role",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole"),
                iam.ManagedPolicy.from_aws_managed_policy_name("AWSCertificateManagerFullAccess"),
                iam.ManagedPolicy.from_aws_managed_policy_name("AmazonDynamoDBFullAccess"),
                iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSNSFullAccess")
            ]
        )

        _fn_acm_cron_role = iam.Role(self, "_fn_acm_cron_role",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole"),
                iam.ManagedPolicy.from_aws_managed_policy_name("AWSCertificateManagerFullAccess"),
                iam.ManagedPolicy.from_aws_managed_policy_name("AmazonDynamoDBFullAccess"),
                iam.ManagedPolicy.from_aws_managed_policy_name("AWSStepFunctionsFullAccess")
            ]
        )

        _fn_acm_cb_handler_role = iam.Role(self, "_fn_acm_cb_handler_role",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole"),
                iam.ManagedPolicy.from_aws_managed_policy_name("AWSCertificateManagerFullAccess"),
                iam.ManagedPolicy.from_aws_managed_policy_name("AmazonDynamoDBFullAccess"),
                iam.ManagedPolicy.from_aws_managed_policy_name("AWSStepFunctionsFullAccess"),
                iam.ManagedPolicy.from_aws_managed_policy_name("CloudFrontFullAccess")
            ]
        )

        _fn_sns_notify_role = iam.Role(self, "_fn_sns_notify_role",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole"),
                iam.ManagedPolicy.from_aws_managed_policy_name("AmazonDynamoDBFullAccess"),
                iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSNSFullAccess")
            ]
        )

        fn_acm_import_cb = _lambda.DockerImageFunction(self, "acm_import_callback", code=_lambda.DockerImageCode.from_image_asset("step_function_rp/lambda_code/acm_import_cb"), environment={'SNS_TOPIC': sns_topic.topic_arn, 'CALLBACK_TABLE': callback_table.table_name, 'TASK_TYPE': 'placeholder'}, timeout=Duration.seconds(900), role=_fn_acm_import_cb_role, memory_size=1024)

        fn_acm_cb = _lambda.DockerImageFunction(self, "acm_callback", code=_lambda.DockerImageCode.from_image_asset("step_function_rp/lambda_code/acm_cb"), environment={'SNS_TOPIC': sns_topic.topic_arn, 'CALLBACK_TABLE': callback_table.table_name, 'TASK_TYPE': 'placeholder'}, timeout=Duration.seconds(900), role=_fn_acm_cb_role, memory_size=512)

        fn_acm_cb_handler = _lambda.DockerImageFunction(self, "acm_callback_handler", code=_lambda.DockerImageCode.from_image_asset("step_function_rp/lambda_code/acm_cb_handler"), environment={'PAYLOAD_EVENT_KEY': 'placeholder', 'CALLBACK_TABLE': callback_table.table_name, 'TASK_TYPE': 'placeholder'}, timeout=Duration.seconds(900), role=_fn_acm_cb_handler_role, memory_size=1024)

        fn_acm_cron = _lambda.DockerImageFunction(self, "acm_cron_job", code=_lambda.DockerImageCode.from_image_asset("step_function_rp/lambda_code/acm_cron"), environment={'PAYLOAD_EVENT_KEY': 'placeholder', 'CALLBACK_TABLE': callback_table.table_name, 'TASK_TYPE': 'placeholder'}, timeout=Duration.seconds(900), role=_fn_acm_cron_role, memory_size=1024)

        fn_sns_notify = _lambda.DockerImageFunction(self, "sns_notify", code=_lambda.DockerImageCode.from_image_asset("step_function_rp/lambda_code/sns_notify"), environment={'SNS_TOPIC': sns_topic.topic_arn, 'CALLBACK_TABLE': callback_table.table_name, 'TASK_TYPE': 'placeholder'}, timeout=Duration.seconds(900), role=_fn_sns_notify_role, memory_size=1024)

        # {
        # "Error": "{\"status\": \"FAILED\"}",
        # "Cause": null
        # }
        snsFailureNotify = _task.SnsPublish(self, "Failure Notification",
            topic=sns_topic,
            integration_pattern=_step.IntegrationPattern.REQUEST_RESPONSE,
            message=_step.TaskInput.from_object({
                "error": _step.JsonPath.string_at("$.Error")
            }),
            result_path="$.snsFailure"
        )

        # {
        #     "acm_op": "create",
        #     "auto_creation": "false",
        #     "dist_aggregation": "false",
        #     "cnameList": [
        #         {
        #         "domainName": "cdn2.risetron.cn",
        #         "sanList": [
        #             "cdn3.risetron.cn"
        #         ],
        #         "originsItemsDomainName": "risetron.s3.ap-east-1.amazonaws.com"
        #         },
        #         {
        #         "domainName": "cdn4.risetron.cn",
        #         "sanList": [
        #             "cdn5.risetron.cn"
        #         ],
        #         "originsItemsDomainName": "risetron.s3.ap-east-1.amazonaws.com"
        #         }
        #     ],
        #     "CertPem": "",
        #     "PrivateKeyPem": "",
        #     "ChainPem": "",
        # }
        acm_callback_job = _task.LambdaInvoke(self, "ACM Create Callback Job",
            lambda_function=fn_acm_cb,
            integration_pattern=_step.IntegrationPattern.WAIT_FOR_TASK_TOKEN,
            payload=_step.TaskInput.from_object({
                "task_token": _step.JsonPath.task_token,
                "input": _step.JsonPath.entire_payload,
                # _step.JsonPath.string_at("$.someField"),
                "callback": "true"
            }),
            # output_path = "$.Payload",
            result_path = "$.fn_acm_cb"
        ).add_catch(snsFailureNotify)

        acm_import_callback_job = _task.LambdaInvoke(self, "ACM Import Callback Job",
            lambda_function=fn_acm_import_cb,
            integration_pattern=_step.IntegrationPattern.WAIT_FOR_TASK_TOKEN,
            payload=_step.TaskInput.from_object({
                "task_token": _step.JsonPath.task_token,
                "input": _step.JsonPath.entire_payload,
                # _step.JsonPath.string_at("$.someField"),
                "callback": "true"
            }),
            # output_path = "$.Payload",
            result_path = "$.fn_acm_import_cb"
        ).add_catch(snsFailureNotify)

        # {
        #   "domainName": "cdn2.risetron.cn",
        #   "sanList": [
        #       "cdn3.risetron.cn"
        # ],
        #   "originsItemsDomainName": "risetron.s3.ap-east-1.amazonaws.com"
        # },
        # {
        #   "domainName": "cdn4.risetron.cn",
        #   "sanList": [
        #        "cdn5.risetron.cn"
        #   ],
        #   "originsItemsDomainName": "risetron.s3.ap-east-1.amazonaws.com"
        # }
        acm_callback_handler_job = _task.LambdaInvoke(self, "ACM Callback Handler Job",
            lambda_function=fn_acm_cb_handler,
            payload=_step.TaskInput.from_object({
                "input": _step.JsonPath.entire_payload
                # _step.JsonPath.string_at("$.someField"),
            }),
            # Lambda's result is in the attribute `Payload`
            result_selector={
                "Payload": _step.JsonPath.string_at("$.Payload")
            },
            # output_path = "$.Payload",
            result_path = "$.fn_acm_cb_handler",
        )

        # invoke lambda from map state
        acm_callback_handler_map = _step.Map(self, "ACM Callback Handler Map",
            max_concurrency=10,
            items_path=_step.JsonPath.string_at("$.cnameList"),
            result_path= "$.fn_acm_cb_handler_map",
        )
        acm_callback_handler_map.iterator(acm_callback_handler_job)

        sns_notify_job = _task.LambdaInvoke(self, "Success Notification Job",
            lambda_function=fn_sns_notify,
            payload=_step.TaskInput.from_object({
                "input": _step.JsonPath.entire_payload
                # _step.JsonPath.string_at("$.someField"),
            }),
            # Lambda's result is in the attribute `Payload`
            result_selector={
                "Payload": _step.JsonPath.string_at("$.Payload")
            },
            # output_path = "$.Payload",
            result_path = "$.fn_sns_notify"
        )

        wait_10s_for_cert_create = _step.Wait(self, "Wait 10 Seconds for cert create", time=_step.WaitTime.duration(Duration.seconds(10)))
        wait_10s_for_cert_import = _step.Wait(self, "Wait 10 Seconds for cert import", time=_step.WaitTime.duration(Duration.seconds(10)))

        # entry point for step function with cert create/import process
        stepFunctionEntry = _step.Choice(self, "Initial entry point")
        stepFunctionEntry.when(_step.Condition.and_(_step.Condition.string_equals("$.acm_op", "create"), _step.Condition.string_equals("$.auto_creation", "true")), acm_callback_job\
            .next(wait_10s_for_cert_create)\
            .next(acm_callback_handler_map)\
        )
        stepFunctionEntry.when(_step.Condition.and_(_step.Condition.string_equals("$.acm_op", "import"), _step.Condition.string_equals("$.auto_creation", "true")), acm_import_callback_job\
            .next(wait_10s_for_cert_import)\
            .next(acm_callback_handler_map)\
            .next(sns_notify_job)
        )

        stepFunction = _step.StateMachine(self, "SSL for SaaS",
            definition=stepFunctionEntry,
            state_machine_name="SSL-for-SaaS-StateMachine",
            state_machine_type=_step.StateMachineType.STANDARD,
            # set global timeout, don't set timeout in callback inside
            timeout=Duration.hours(24),
        )

        # lambda in step function & cron job
        fn_acm_direct_op = _lambda.DockerImageFunction(self, "acm_direct_op", code=_lambda.DockerImageCode.from_image_asset("step_function_rp/lambda_code/acm_direct_op"), environment={'STEP_FUNCTION_ARN': stepFunction.state_machine_arn, 'CALLBACK_TABLE': callback_table.table_name, 'TASK_TYPE': 'placeholder'}, timeout=Duration.seconds(900), role=_fn_acm_direct_op_role, memory_size=1024)

        # API Gateway with Lambda proxy integration
        api_acm_direct_op = _apigw.LambdaRestApi(self, "api_acm_direct_op", handler=fn_acm_direct_op, proxy=True)
        items = api_acm_direct_op.root.add_resource("ssl_for_saas")
        items.add_method("GET") # GET /ssl_for_saas
        items.add_method("POST") # POST /ssl_for_saas

        # item = items.add_resource("{item}")
        # item.add_method("GET") # GET /ssl_for_saas/{item}

        # cloudwatch event crob job for 5 minutes
        events.Rule(self, "ACM status check",
            schedule=events.Schedule.expression("cron(0/1 * * * ? *)"),
            targets=[targets.LambdaFunction(fn_acm_cron)]
        )

        # configure cloudwatch event rule and trigger action whenever certain ACM expires

        # sample input 
        # {
        #     "version": "0",
        #     "id": "9c95e8e4-96a4-ef3f-b739-b6aa5b193afb",
        #     "detail-type": "ACM Certificate Approaching Expiration",
        #     "source": "aws.acm",
        #     "account": "123456789012",
        #     "time": "2020-09-30T06:51:08Z",
        #     "region": "us-east-1",
        #     "resources": ["arn:aws:acm:us-east-1:123456789012:certificate/61f50cd4-45b9-4259-b049-d0a53682fa4b"],
        #     "detail": {
        #         "DaysToExpiry": 31,
        #         "CommonName": "Aperture Science Portal Certificate Authority - R4"
        #     }
        # }
        events.Rule(self, "ACM health event", 
            event_pattern=events.EventPattern(
                region=["us-east-1"],
                source=["aws.acm"],
                detail_type=["ACM Certificate Approaching Expiration"],
            ), 
            targets=[targets.SnsTopic(sns_topic)]
        )

        # Lambda function to integrate with AppSync
        fn_appsync_function = _lambda.DockerImageFunction(self, "appsync_func", code=_lambda.DockerImageCode.from_image_asset("step_function_rp/lambda_code/appsync_func"), environment={'STEP_FUNCTION_ARN': stepFunction.state_machine_arn, 'CALLBACK_TABLE': callback_table.table_name, 'TASK_TYPE': 'placeholder'}, timeout=Duration.seconds(900), role=_fn_appsync_func_role, memory_size=1024)

        api_appsync = _appsync_alpha.GraphqlApi(self, "Api",
            name="SSL for SaaS",
            schema=_appsync_alpha.Schema.from_asset("step_function_rp/appsync_schema/schema.graphql"),
            authorization_config=_appsync_alpha.AuthorizationConfig(
                default_authorization=_appsync_alpha.AuthorizationMode(
                    authorization_type=_appsync_alpha.AuthorizationType.IAM
                )
            ),
            xray_enabled=False
        )

        # An AppSync datasource backed by a Lambda function
        lambda_data_source = _appsync_alpha.LambdaDataSource(
            self,
            'LambdaDataSource',
            api=api_appsync,
            lambda_function=fn_appsync_function,
            description = 'Lambda Data Source',
            name = 'certCreate',
            # service_role=lambda_service_role,
        )

        lambda_data_source.create_resolver(
            type_name='Mutation',
            field_name='certCreate',
            request_mapping_template=_appsync_alpha.MappingTemplate.from_string(
                """
                {
                    "version": "2017-02-28",
                    "method": "POST",
                    "resourcePath": "/",
                    "params":{
                        "headers": {
                            "Accept":"application/json",
                            "Content-Type":"application/json"
                        },
                        "queryParams": {},
                        "path": "/",
                        "body": $input.json('$')
                    }
                }
                """
            ),
            response_mapping_template=_appsync_alpha.MappingTemplate.from_string(
                """
                {
                    "body": $util.toJson($context.result),
                    "headers": {
                        "Content-Type": "application/json"
                    }
                }
                """
            )
        )

        

