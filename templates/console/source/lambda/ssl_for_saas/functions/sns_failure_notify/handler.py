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
    message_to_be_published = {
        'Deployment Status': 'Failure',
        'Details': str(event['input']),
    }
    sns_client.publish_by_topic(sns_topic_arn,
                                subject='SSL for SaaS generation failure occurred',
                                msg=str(message_to_be_published)
                                )

    job_token = event['input']['aws_request_id']
    logger.error("Exception occurred, just update the ddb table")
    job_info = job_info_client.get_job_info_by_id(job_id=job_token)

    if job_info is not None and job_info['distStageStatus'] == 'INPROGRESS':
        job_info_client.update_job_field(job_id=job_token, field='distStageStatus', value='FAILED')
    else:
        logger.error(f"failed to get the job info of job_id:{job_token} ")

    cause = event['input']['error']['Cause']
    if cause == "":
        cause = event['input']['error']['Error']
    job_info_client.update_job_field(job_id=job_token, field='promptInfo', value=cause)
    return Response(statusCode=200, body=json.dumps('SNS Notification Sent'))