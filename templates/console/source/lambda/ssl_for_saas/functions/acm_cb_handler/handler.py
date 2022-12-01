import http
import json
import logging
import os

from types_ import Event
from layer.acm_service.client import AcmUtilsService
from layer.cloudfront_service.client import CloudFrontUtilsService
from layer.cloudfront_service.types_ import DistributionConfigWithTags, Tags, Tag
from layer.common.response import Response
from layer.job_service.client import JobInfoUtilsService
from layer.sns_service.client import SnsUtilsService

logger = logging.getLogger('boto3:acm_cb_handler')
logger.setLevel(logging.INFO)
task_type = os.getenv('TASK_TYPE')
# get sns topic arn from environment variable
sns_topic_arn = os.environ.get('SNS_TOPIC')

acm_client = AcmUtilsService(logger=logger)
job_info_client = JobInfoUtilsService(logger=logger)
cloudfront_client = CloudFrontUtilsService(logger=logger)
sns_client = SnsUtilsService(logger=logger)


def handler(event: Event, context) -> Response:
    logger.info('Received event: %s', json.dumps(event, indent=4, default=str))
    domain_name = event['input']['domainName']
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

    try:
        # delete such domain name in DynamoDB
        resp = acm_client.delete_by_task_id_and_domain(task_token, domain_name)
        sub_domain_name_list = event['input']['sanList'] if event['input']['sanList'] else None
        if 'originsItemsDomainName' in event['input']:
            origins_items_domain_name = '%s' % event['input']['originsItemsDomainName'] if event['input'][
                'originsItemsDomainName'] else None
        else:
            origins_items_domain_name = ''
        # concatenate from OriginsItemsDomainName and random string
        # origins_items_id = '%s-%s' % (str(uuid.uuid4())[:8], origins_items_domain_name)
        # default_root_object = ''
        # origins_items_origin_path = ''
        # default_cache_behavior_target_origin_id = origins_items_id
        certificate_arn = cert_arn
        # customization configuration of CloudFront distribution
        original_cf_distribution_id = event['input']['existing_cf_info']['distribution_id']

        if 'config_version_id' in event['input']['existing_cf_info']:
            original_cf_distribution_version = event['input']['existing_cf_info']['config_version_id']
            config = cloudfront_client.construct_cloudfront_config_with_version(
                certificate_arn,
                distribution_id=original_cf_distribution_id,
                distribution_version=original_cf_distribution_version,
                sub_domain_name_list=sub_domain_name_list
            )
        else:
            # Just fetch the config from source cloudfront distribution config
            config = cloudfront_client.construct_cloudfront_config_with_dist_id(
                certificate_arn,
                distribution_id=original_cf_distribution_id,
                sub_domain_name_list=sub_domain_name_list
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

        # update the job info table for completed cloudfront number
        job_info = job_info_client.get_job_info_by_id(job_token)

        if not job_info:
            logger.error(f"failed to get the job info of job_id:{job_token} ")

        cloudfront_distribution_created_number = job_info['cloudfront_distribution_created_number']
        new_number = int(cloudfront_distribution_created_number) + 1
        job_info_client.update_job_field(job_token, 'cloudfront_distribution_created_number', new_number)

        return Response(statusCode=http.HTTPStatus.OK, body={
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
