import logging
import uuid
import boto3
import os
import json
from job_table_utils import get_job_info, create_job_info, update_job_cert_completed_number, update_job_cloudfront_distribution_created_number, update_job_field

# certificate need to create in region us-east-1 for cloudfront to use
acm = boto3.client('acm', region_name='us-east-1')

LAMBDA_TASK_ROOT = os.environ.get('LAMBDA_TASK_ROOT')
JOB_INFO_TABLE_NAME = os.environ.get('JOB_INFO_TABLE')

logger = logging.getLogger('boto3')
logger.setLevel(logging.INFO)

# add execution path
os.environ['PATH'] = os.environ['PATH'] + ':' + os.environ['LAMBDA_TASK_ROOT']

# get sns topic arn from environment variable
snsTopicArn = os.environ.get('SNS_TOPIC')


def lambda_handler(event, context):
    """

    :param event:
    :param context:
    """
    logger.info("Received event: " + json.dumps(event))

    # {
    #     "input": {
    #       "acm_op": "import",
    #       "auto_creation": "true",
    #       "dist_aggregate": "false",
    #       "enable_cname_check": "false",
    #       "cnameList": [
    #           {
    #               "domainName": "test-ssl-for-saas.dev.demo.solutions.aws.a2z.org.cn",
    #               "sanList": [
    #                   "test-ssl-for-saas.dev.demo.solutions.aws.a2z.org.cn"
    #               ],
    #               "originsItemsDomainName": "cloudfront-test-source-bucket-2021.s3.us-east-1.amazonaws.com"
    #           }
    #       ],
    #       "pemList": [
    #           {
    #               "CertPem": "\n-----BEGIN CERTIFICATE-----\n\n-----END CERTIFICATE-----\n",
    #               "PrivateKeyPem": "\n-----BEGIN PRIVATE KEY-----\n\n-----END PRIVATE KEY-----\n",
    #               "ChainPem": "\n-----BEGIN CERTIFICATE-----\n\n-----END CERTIFICATE-----\n-----BEGIN CERTIFICATE-----\n\n-----END CERTIFICATE-----\n",
    #               "originsItemsDomainName": "cloudfront-test-source-bucket-2021.s3.us-east-1.amazonaws.com"
    #           }
    #       ],
    #       "fn_acm_import_cb": {
    #           "status": "SUCCEEDED"
    #       },
    #       "error": {
    #           "Error": "RetryError",
    #           "Cause": "{\"errorMessage\":\"RetryError[<Future at 0x7f26508fbe20 state=finished raised Timeout>]\",\"errorType\":\"RetryError\",\"stackTrace\":[\"  File \\\"/var/task/acm_cb_handler.py\\\", line 233, in lambda_handler\\n    response = scan_for_cert(callback_table, domain_name)\\n\",\"  File \\\"/var/task/tenacity/__init__.py\\\", line 324, in wrapped_f\\n    return self(f, *args, **kw)\\n\",\"  File \\\"/var/task/tenacity/__init__.py\\\", line 404, in __call__\\n    do = self.iter(retry_state=retry_state)\\n\",\"  File \\\"/var/task/tenacity/__init__.py\\\", line 361, in iter\\n    raise retry_exc from fut.exception()\\n\"]}"
    #       },
    #       "fn_failure_handling": {
    #           "ExecutedVersion": "$LATEST",
    #           "Payload": {
    #               "statusCode": 400,
    #               "body": "\"step to clean up the resources completed\""
    #       },
    #     "SdkHttpMetadata": {
    #         "AllHttpHeaders": {
    #             "X-Amz-Executed-Version": [
    #                 "$LATEST"
    #             ],
    #             "x-amzn-Remapped-Content-Length": [
    #                 "0"
    #             ],
    #             "Connection": [
    #                 "keep-alive"
    #             ],
    #             "x-amzn-RequestId": [
    #                 "140aef3a-d8b0-4dad-829c-4e82c1be458a"
    #             ],
    #             "Content-Length": [
    #                 "75"
    #             ],
    #             "Date": [
    #                 "Tue, 26 Apr 2022 08:00:31 GMT"
    #             ],
    #             "X-Amzn-Trace-Id": [
    #                 "root=1-6267a69e-229df7b21381207c6e89044f;sampled=0"
    #             ],
    #             "Content-Type": [
    #                 "application/json"
    #             ]
    #         },
    #         "HttpHeaders": {
    #             "Connection": "keep-alive",
    #             "Content-Length": "75",
    #             "Content-Type": "application/json",
    #             "Date": "Tue, 26 Apr 2022 08:00:31 GMT",
    #             "X-Amz-Executed-Version": "$LATEST",
    #             "x-amzn-Remapped-Content-Length": "0",
    #             "x-amzn-RequestId": "140aef3a-d8b0-4dad-829c-4e82c1be458a",
    #             "X-Amzn-Trace-Id": "root=1-6267a69e-229df7b21381207c6e89044f;sampled=0"
    #         },
    #         "HttpStatusCode": 200
    #     },
    #     "SdkResponseMetadata": {
    #         "RequestId": "140aef3a-d8b0-4dad-829c-4e82c1be458a"
    #     },
    #     "StatusCode": 200
    # }
    #     }
    # }

    message_to_be_published = {
        'Deployment Status': 'Failure',
        'Details': str(event['input']),
    }

    # notify to sns topic for distribution event
    sns_client = boto3.client('sns')
    sns_client.publish(
        TopicArn=snsTopicArn,
        Message=str(message_to_be_published),
        Subject='SSL for SaaS generation failure occurred'
    )

    job_token = event['input']['aws_request_id']
    logger.error("Exception occurred, just update the ddb table")
    resp = get_job_info(JOB_INFO_TABLE_NAME,job_token)
    if 'Items' in resp:
        ddb_record = resp['Items'][0]
        distStageStatus = ddb_record['distStageStatus']
        if distStageStatus == 'INPROGRESS':
            update_job_field(JOB_INFO_TABLE_NAME,
                             job_token,
                             'distStageStatus',
                             'FAILED')
    else:
        logger.error(f"failed to get the job info of job_id:{job_token} ")

    cause = event['input']['error']['Cause']
    if cause == "":
        cause = event['input']['error']['Error']

    update_job_field(JOB_INFO_TABLE_NAME,
                     job_token,
                     'promptInfo',
                     cause)

    return {
        'statusCode': 200,
        'body': json.dumps('SNS Notification Sent')
    }
