import logging
import uuid
import boto3
import os
import json
from job_table_utils import create_job_info, update_job_cert_completed_number, update_job_cloudfront_distribution_created_number, update_job_field

# certificate need to create in region us-east-1 for cloudfront to use
acm = boto3.client('acm', region_name='us-east-1')

LAMBDA_TASK_ROOT = os.environ.get('LAMBDA_TASK_ROOT')
JOB_INFO_TABLE_NAME = os.environ.get('JOB_INFO_TABLE')
JOB_STATUS_TABLE_NAME = os.environ.get('JOB_STATUS_TABLE')

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
    #         "xx": "xx"
    #         "fn_acm_cb": {
    #             "status": "SUCCEEDED"
    #         },
    #         "fn_acm_cb_handler_map": [
    #             {
    #                 "domainName": "cdn2.risetron.cn",
    #                 "sanList": [
    #                     "*.risetron.cn"
    #                 ],
    #                 "originsItemsDomainName": "xx",
    #                 "fn_acm_cb_handler": {
    #                     "Payload": {
    #                         "statusCode": 200,
    #                         "body": {
    #                             "distributionId": "xx",
    #                             "distributionArn": "arn:aws:cloudfront::xx:distribution/xx",
    #                             "distributionDomainName": "xx.cloudfront.net"
    #                         }
    #                     }
    #                 }
    #             },
    #         ]
    #     }
    # }

    # Update the job info table to mark the cloudfront distribution creation succeed
    job_token = event['input']['aws_request_id']
    update_job_field(JOB_INFO_TABLE_NAME,
                     job_token,
                     'distStageStatus',
                     'SUCCESS')

    msg = []
    # iterate distribution list from event
    for record in event['input']['fn_acm_cb_handler_map']:
        msg.append("Distribution domain name {} created, ARN: {}"
                   .format(record['fn_acm_cb_handler']['Payload']['body']['distributionDomainName'],
                           record['fn_acm_cb_handler']['Payload']['body']['distributionArn']
                           )
                   )

    logger.info("deliver message: %s to sns topic arn: %s", str(msg), snsTopicArn)

    # multiplex same sns notify function for cert creat and import
    if 'fn_acm_cb' in event['input']:
        status = event['input']['fn_acm_cb']['status']
    elif 'fn_acm_import_cb' in event['input']:
        status = event['input']['fn_acm_import_cb']['status']

    message_to_be_published = {
        'Deployment Status': status,
        'Details': str(msg),
    }

    # notify to sns topic for distribution event
    sns_client = boto3.client('sns')
    sns_client.publish(
        TopicArn=snsTopicArn,
        Message=str(message_to_be_published),
        Subject='SSL for SaaS event received'
    )

    return {
        'statusCode': 200,
        'body': json.dumps('SNS Notification Sent')
    }
