import http
import json
import logging
import os
from typing import Any

from layer.common.response import Response
from layer.job_service.client import JobInfoUtilsService
from layer.sns_service.client import SnsUtilsService

logger = logging.getLogger('boto3:acm_cb')
logger.setLevel(logging.INFO)
# get sns topic arn from environment variable
sns_topic_arn = os.environ.get('SNS_TOPIC')
sns_client = SnsUtilsService(logger=logger)
job_info_client = JobInfoUtilsService(logger=logger)


def handler(event: Any, context: Any) -> Response:
    logger.info("Received event: " + json.dumps(event))

    # Update the job info table to mark the cloudfront distribution creation succeed
    job_token = event['input']['aws_request_id']
    response = job_info_client.get_job_info_by_id(job_token)
    if response is not None:
        job_info_client.update_job_fields_by_dict(job_token, {
            'cloudfront_distribution_created_number': response['cloudfront_distribution_total_number'],
            'cert_total_number': response['cert_total_number'],
            'distStageStatus': 'SUCCESS',
        })
    else:
        logger.error('No job info found for job token: ' + job_token)

    msg = []
    # iterate distribution list from event
    for record in event['input']['fn_acm_cb_handler_map']:
        msg.append("Distribution domain name {} created, ARN: {}, aliases: {}"
                   .format(record['fn_acm_cb_handler']['Payload']['body']['distributionDomainName'],
                           record['fn_acm_cb_handler']['Payload']['body']['distributionArn'],
                           record['fn_acm_cb_handler']['Payload']['body']['aliases']
                           )
                   )

    logger.info("deliver message: %s to sns topic arn: %s", str(msg), sns_topic_arn)
    # multiplex same sns notify function for cert creat and import
    status = ''
    if 'fn_acm_cb' in event['input']:
        status = event['input']['fn_acm_cb']['status']
    elif 'fn_acm_import_cb' in event['input']:
        status = event['input']['fn_acm_import_cb']['status']

    message_to_be_published = {
        'Deployment Status': status,
        'Details': str(msg),
    }

    sns_client.publish_by_topic(
        topic_arn=sns_topic_arn,
        msg=str(message_to_be_published),
        subject='SSL for SaaS event received'
    )

    return Response(statusCode=http.HTTPStatus.OK, body=json.dumps('SNS Notification Sent'))
