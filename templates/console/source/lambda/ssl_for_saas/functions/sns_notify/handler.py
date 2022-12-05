import http
import json
import logging
import os
from typing import Any

from layer.acm_service.client import AcmUtilsService
from layer.common.response import Response
from layer.job_service.client import JobInfoUtilsService
from layer.sns_service.client import SnsUtilsService

logger = logging.getLogger('boto3:acm_cb')
logger.setLevel(logging.INFO)
# get sns topic arn from environment variable
sns_topic_arn = os.environ.get('SNS_TOPIC')
sns_client = SnsUtilsService(logger=logger)
job_info_client = JobInfoUtilsService(logger=logger)
acm_client = AcmUtilsService(logger=logger)


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

    return Response(statusCode=http.HTTPStatus.OK, body=json.dumps('SNS Notification Sent'))
