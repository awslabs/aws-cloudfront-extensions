import copy
import os
from datetime import datetime
import http
import json
import logging

from types_ import Event
from layer.acm_service.client import AcmUtilsService
from layer.cloudfront_service.client import CloudFrontUtilsService
from layer.common.response import Response
from layer.job_service.client import JobInfoUtilsService
from layer.job_service.types_ import JobInfo
from layer.sns_service.client import SnsUtilsService

logger = logging.getLogger('boto3:acm_cb')
logger.setLevel(logging.INFO)
task_type = os.getenv('TASK_TYPE')
# get sns topic arn from environment variable
sns_topic_arn = os.environ.get('SNS_TOPIC')

acm_client = AcmUtilsService(logger=logger)
job_info_client = JobInfoUtilsService(logger=logger)
cloudfront_client = CloudFrontUtilsService(logger=logger)
sns_client = SnsUtilsService(logger=logger)


def handler(event: Event, context) -> Response:
    logger.info('Received event: ' + json.dumps(event, default=str))

    task_token = event['task_token']
    # if event['input']['dist_aggregate']:
    #     dist_aggregate = event

    domain_name_list = event['input']['cnameList']

    task_token = acm_client.check_generate_task_token(task_token)
    job_token = event['input']['aws_request_id']

    auto_creation = event['input']['auto_creation']
    cert_total_number = len(event['input']['cnameList'])
    cloudfront_total_number = 0 if (auto_creation == 'false') else cert_total_number
    job_type = event['input']['acm_op']
    creation_date = str(datetime.now())
    cert_create_stage_status = 'INPROGRESS'
    cert_validation_stage_status = 'NOTSTART'
    dist_stage_status = 'NOTSTART'

    body_without_pem = copy.deepcopy(event['input'])
    if 'pemList' in body_without_pem:
        del body_without_pem['pemList']
    job_info_client.create_job_info(JobInfo(
        jobId=job_token,
        job_input=json.dumps(body_without_pem, indent=4, default=str),
        cert_total_number=cert_total_number,
        cloudfront_distribution_total_number=cloudfront_total_number,
        cert_completed_number=0,
        cloudfront_distribution_created_number=0,
        jobType=job_type,
        creationDate=creation_date,
        certCreateStageStatus=cert_create_stage_status,
        certValidationStageStatus=cert_validation_stage_status,
        distStageStatus=dist_stage_status,
        promptInfo='',
        certList=[],
        dcv_validation_msg='',
        distList=[]
    ))

    try:
        if 'true' == auto_creation:
            cloudfront_client.validate_source_cloudfront_dist(domain_name_list)

        # aggregate certificate if dist_aggregate is true
        if 'dist_aggregate' in event['input'] and event['input']['dist_aggregate'] == "true":
            sns_msg = acm_client.aggregate_dist(domain_name_list, task_token, task_type, job_token)
        else:
            sns_msg = acm_client.none_aggregate_dist(domain_name_list, task_token, task_type, job_token)
        sns_str = json.dumps(sns_msg, indent=4, default=str)

        job_info_client.update_job_fields_by_dict(job_token, {
            'certCreateStageStatus': 'SUCCESS',
            'certValidationStageStatus': 'INPROGRESS',
            'cert_completed_number': cert_total_number,
            'dcv_validation_msg': sns_client.generate_notify_content(sns_str)
        })

        sns_client.notify_sns_subscriber(sns_str, sns_topic_arn)
        logger.info('Certificate creation job %s completed successfully', job_token)
    except Exception as e:
        logger.error("Exception occurred, just update the ddb table")
        job_info_client.update_job_fields_by_dict(job_token, {
            'certCreateStageStatus': 'FAILED',
            'promptInfo': str(e)
        })
        raise e

    return Response(statusCode=http.HTTPStatus.OK, body=json.dumps('step to acm create callback complete'))
