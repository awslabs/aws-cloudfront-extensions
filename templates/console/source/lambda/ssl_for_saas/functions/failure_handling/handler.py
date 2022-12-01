import http
import json
import logging
from typing import Any

from layer.acm_service.client import AcmUtilsService
from layer.common.response import Response
from layer.job_service.client import JobInfoUtilsService

logger = logging.getLogger('boto3:failure_handling')
logger.setLevel(logging.INFO)
job_info_client = JobInfoUtilsService(logger=logger)
acm_client = AcmUtilsService(logger=logger)


def handler(event: Any, context: Any) -> Response:
    logger.info("Received event: " + json.dumps(event, indent=2))
    # remove all dynmodb records related to the jobs
    job_token = event['input']['aws_request_id']
    try:
        # resp = acm_client.(job_token)
        # if resp is not None:
        #     job_info_client.delete_job_by_task_token_domain(task_token=resp['jobToken'], resp[''])
        metadata = acm_client.scan_by_job_token(job_token)
        logger.info("ddb query response: %s", json.dumps(metadata, default=str))
        for m in metadata:
            acm_client.delete_by_task_id_and_domain(m['taskToken'], m['domainName'])
    except Exception as e:
        logger.error("failed to delete the failure job related items with error : %s", str(e))

    return Response(statusCode=http.HTTPStatus.OK, body=json.dumps('step to clean up the resources completed'))
