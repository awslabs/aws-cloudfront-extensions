import http
import json
import logging
import os
from typing import TypedDict, Any

from layer.acm_service.client import AcmUtilsService
from layer.cloudfront_service.client import CloudFrontUtilsService
from layer.cloudfront_service.types_ import GetDistributionConfigOutput
from layer.common.response import Response
from layer.common.types_ import Cname
from layer.job_service.client import JobInfoUtilsService

logger = logging.getLogger('boto3:acm_cb_handler')
logger.setLevel(logging.INFO)
task_type = os.getenv('TASK_TYPE')

acm_client = AcmUtilsService(logger=logger)
job_info_client = JobInfoUtilsService(logger=logger)
cloudfront_client = CloudFrontUtilsService(logger=logger)


class CloudFrontInfo(TypedDict):
    distributionId: str
    distributionArn: str
    distributionDomainName: str
    aliases: Any


class Payload(TypedDict):
    body: CloudFrontInfo


class PayloadContainer(TypedDict):
    Payload: Payload


class Input(TypedDict):
    value: Cname
    fn_cloudfront_bind: PayloadContainer


class Event(TypedDict):
    input: Input


def handler(event: Event, context) -> Response:
    logger.info('Received event: %s', json.dumps(event, indent=4, default=str))
    domain_name = event['input']['value']['domainName']
    # logger.info("Domain name : " + domain_name)
    # scan domain name in DynamoDB and filter status is CERT_ISSUED, TBD retry here
    response = acm_client.scan_for_cert(domain_name)
    logger.info('scan result of DynamoDB %s', json.dumps(response))
    # fetch certArn from DynamoDB, assume such reverse search only had one result
    cert_arn = response[0]['certArn']
    # fetch taskToken from DynamoDB
    task_token = response[0]['taskToken']
    # fetch jobToken from DynamoDB
    job_token = response[0]['jobToken']
    job_info_client.update_job_fields_by_dict(job_token, {
        'certValidationStageStatus': 'SUCCESS',
        'distStageStatus': 'INPROGRESS',
    })
    distribution_id = event['input']['fn_cloudfront_bind']['Payload']['body']['distributionId']
    try:
        # delete such domain name in DynamoDB
        resp = acm_client.delete_by_task_id_and_domain(task_token, domain_name)
        sub_domain_name_list = event['input']['value']['sanList'] if event['input']['value']['sanList'] else None

        resp = cloudfront_client.client.get_distribution_config(
            Id=distribution_id
        )
        named_ = GetDistributionConfigOutput(**resp)

        config = cloudfront_client.construct_cloudfront_config(
            certificate_arn=cert_arn,
            template=named_['DistributionConfig'],
            sub_domain_list=sub_domain_name_list
        )

        distribution = cloudfront_client.update_distribution(
            config=config,
            cloudfront_id=distribution_id,
            etag=named_['ETag']
        )

        # update the job info table for completed cloudfront number
        job_info = job_info_client.get_job_info_by_id(job_token)

        if not job_info:
            logger.error(f"failed to get the job info of job_id:{job_token} ")

        cloudfront_distribution_created_number = job_info['cloudfront_distribution_created_number']
        new_number = int(cloudfront_distribution_created_number) + 1
        job_info_client.update_job_field(job_token, 'cloudfront_distribution_created_number', new_number)

        return Response(statusCode=http.HTTPStatus.OK, body={
            'certificateArn': cert_arn,
            'distributionId': distribution['Id'],
            'distributionArn': distribution['ARN'],
            'distributionDomainName': distribution['DomainName'],
            'aliases': distribution['DistributionConfig']['Aliases']
        })
    except Exception as e:
        logger.error('Exception occurred, just update the ddb table')
        job_info_client.update_job_fields_by_dict(job_token, {
            'distStageStatus': 'FAILED',
            'promptInfo': str(e)
        })
        raise e
