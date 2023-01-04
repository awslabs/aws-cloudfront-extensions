import http
import json
import logging
import os

from .types_ import Event
from layer.cloudfront_service.client import CloudFrontUtilsService
from layer.cloudfront_service.types_ import DistributionConfigWithTags, Tags, Tag
from layer.common.response import Response
from layer.job_service.client import JobInfoUtilsService

logger = logging.getLogger('boto3:acm_cb_handler')
logger.setLevel(logging.INFO)
task_type = os.getenv('TASK_TYPE')
# get sns topic arn from environment variable
sns_topic_arn = os.environ.get('SNS_TOPIC')

job_info_client = JobInfoUtilsService(logger=logger)
cloudfront_client = CloudFrontUtilsService(logger=logger)


def handler(event: Event, context) -> Response:
    logger.info('Received event: %s', json.dumps(event, indent=4, default=str))
    logger.info('Received context: %s', json.dumps(event['input']['aws_request_id'], indent=4, default=str))
    job_token = event['input']['aws_request_id']
    try:
        sub_domain_name_list = event['input']['value']['sanList'] if event['input']['value']['sanList'] else None
        # customization configuration of CloudFront distribution
        original_cf_distribution_id = event['input']['value']['existing_cf_info']['distribution_id']
        # FIXME: just create cloudfront without cert
        if 'config_version_id' in event['input']['value']['existing_cf_info']:
            original_cf_distribution_version = event['input']['value']['existing_cf_info']['config_version_id']
            config = cloudfront_client.construct_cloudfront_config_with_version(
                distribution_id=original_cf_distribution_id,
                distribution_version=original_cf_distribution_version,
            )
        else:
            # Just fetch the config from source cloudfront distribution config
            config = cloudfront_client.construct_cloudfront_config_with_dist_id(
                distribution_id=original_cf_distribution_id,
            )

        distribution = cloudfront_client.create_distribution_with_tags(DistributionConfigWithTags(
            DistributionConfig=config,
            Tags=Tags(
                Items=[
                    Tag(
                        Key='job_token',
                        Value=job_token
                    )
                ]
            )
        ))

        return Response(statusCode=http.HTTPStatus.OK, body={
            'distributionId': distribution['Id'],
            'distributionArn': distribution['ARN'],
            'distributionDomainName': distribution['DomainName'],
            'aliases': sub_domain_name_list
        })
    except Exception as e:
        logger.error('Exception occurred, just update the ddb table')
        job_info_client.update_job_fields_by_dict(job_token, {
            'distStageStatus': 'FAILED',
            'promptInfo': str(e)
        })
        raise e
