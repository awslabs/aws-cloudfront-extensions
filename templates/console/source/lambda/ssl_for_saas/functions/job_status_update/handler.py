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
    # logger.info("Received event: " + json.dumps(event))
    job_id = event['job_id']

    job_info = job_info_client.get_job_info_by_id(job_id)
    # check whether the job is to only create SSL certificates
    job_input = json.loads(job_info['job_input'])
    request_ssl_num = job_info['cert_total_number']
    # Update the validation task status based on SSL certificate status
    if job_input['auto_creation'] == 'false' and job_info['certValidationStageStatus'] != 'SUCCESS':
        # get the total certificate with status "Issued"
        certificates = acm_client.list_certificates_by_status(statuses=['ISSUED'])
        result = acm_client.get_results(job_id, certificates)
        if len(request_ssl_num) == len(result):
            # the validation process has completed and update the job info table of certValidationStageStatus to SUCCESS
            job_info_client.update_job_fields_by_dict(job_id, {
                'certValidationStageStatus': 'SUCCESS',
                'cert_completed_number': request_ssl_num
            })
        else:
            job_info_client.update_job_fields_by_dict(job_id, {
                'cert_completed_number': len(result)
            })

    if job_input['auto_creation'] == 'true' and job_info['certValidationStageStatus'] != 'SUCCESS':
        # get the total certificate with status "Issued"
        certificates = acm_client.list_certificates_by_status(statuses=['FAILED'])
        result = acm_client.get_results(job_id, certificates)
        logger.info(json.dumps(result))
        if len(result) > 0:
            # The SSL DNS validation has TIMEOUT and mark the task status to FAILED
            prompt_msg = "DNS Validation TIMEOUT for " + json.dumps(result) + ", original validation message: " + \
                         job_info['dcv_validation_msg']
            job_info_client.update_job_fields_by_dict(job_id, {
                'certValidationStageStatus': 'FAILED',
                'dcv_validation_msg': prompt_msg
            })

    return Response(statusCode=http.HTTPStatus.OK, body='success')
