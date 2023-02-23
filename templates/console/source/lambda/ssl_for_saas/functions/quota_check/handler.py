import logging
import boto3
import json

from layer.job_service.client import JobInfoUtilsService

logger = logging.getLogger('boto3')
logger.setLevel(logging.INFO)
quota_client = boto3.client('service-quotas', region_name='us-east-1')
acm_client = boto3.client('acm', region_name='us-east-1')
cf_client = boto3.client('cloudfront', region_name='us-east-1')
job_info_client = JobInfoUtilsService(logger=logger)


def get_quota_number(service_code, quota_code):
    try:
        response = quota_client.get_service_quota(
            ServiceCode=service_code,
            QuotaCode=quota_code
        )
        return response['Quota']['Value']
    except quota_client.exceptions.NoSuchResourceException as e:
        logger.info(f"No applied quota for {service_code}, {quota_code}, trying to check default value")
        try:
            response = quota_client.get_aws_default_service_quota(
                ServiceCode=service_code,
                QuotaCode=quota_code
            )
            return response['Quota']['Value']
        except Exception as e:
            logger.error(f"Failed to check the default {service_code},{quota_code}")
            raise e


def get_ssl_number():
    response = acm_client.list_certificates(
        CertificateStatuses=['PENDING_VALIDATION', 'ISSUED'],
    )

    if "CertificateSummaryList" in response:
        logger.info(len(response["CertificateSummaryList"]))
        return len(response["CertificateSummaryList"])
    else:
        return 0


def get_cloudfront_number():
    # get all cloudfront distributions
    dist_list = []

    response = cf_client.list_distributions()
    distribution_list = response['DistributionList']['Items']
    dist_list.extend(distribution_list)

    while 'NextMarker' in response['DistributionList']:
        next_token = response['DistributionList']['NextMarker']
        response = cf_client.list_distributions(Marker=next_token)
        dist_list.extend(response['DistributionList']['Items'])

    logger.info(len(dist_list))

    return len(dist_list)


def handler(event, context):
    """
     :param event:
     :param context:
     """
    logger.info("Received event: " + json.dumps(event))

    auto_creation = event['input']['auto_creation']

    job_info_client.create_job_with_event(event)

    cert_request_number = len(event['input']['cnameList'])
    cloudfront_dist_request_number = 0 if (auto_creation == 'false') else cert_request_number

    cert_space_remaining = int(get_quota_number('acm', 'L-F141DD1D')) - get_ssl_number()
    cf_dist_remaining = int(get_quota_number('cloudfront', 'L-24B04930')) - get_cloudfront_number()

    if cert_request_number > cert_space_remaining:
        logger.error(
            f"Cert quota exceeded, cert space remaining: {cert_space_remaining}, but request  cert number: {cert_request_number}")
        # raise Exception(
        #     f"Cert quota exceeded, cert space remaining: {cert_space_remaining}, but request  cert number: {cert_request_number}")
    if cloudfront_dist_request_number > cf_dist_remaining:
        logger.error(
            f"Cloudfront quota exceeded, cloudfront space remaining: {cf_dist_remaining}, but request  cloudfront "
            f"number: {cloudfront_dist_request_number}")
        # raise Exception(
        #     f"Cloudfront quota exceeded, cloudfront space remaining: {cf_dist_remaining}, but request  cloudfront "
        #     f"number: {cloudfront_dist_request_number}")

    return {
        'statusCode': 200,
        'body': json.dumps('AWS resource check completed')
    }


# def create_job_info(event):
#     """
#     :param event:
#     event example:
#     {
#         "input": {
#         "acm_op": "create",
#         "auto_creation": "true",
#         "dist_aggregate": "false",
#         "enable_cname_check": "false",
#         "cnameList": [
#             {
#                 "domainName": "web1.v2.ssl-for-saas.demo.solutions.aws.a2z.org.cn",
#                 "sanList": [
#                     "web1.v2.ssl-for-saas.demo.solutions.aws.a2z.org.cn"
#                 ],
#                 "originsItemsDomainName": "",
#                 "existing_cf_info": {
#                     "distribution_id": "E2CWQXEO490X1W",
#                     "config_version_id": "1"
#                 }
#             }
#         ],
#         "pemList": [
#             {
#                 "CertPem": "",
#                 "PrivateKeyPem": "",
#                 "ChainPem": "",
#                 "originsItemsDomainName": "",
#                 "existing_cf_info": {
#                     "distribution_id": "E2CWQXEO490X1W",
#                     "config_version_id": "1"
#                 }
#             }
#         ],
#         "aws_request_id": "a9543ea5-96d5-4c12-9672-cf9f30bdabf2"
#         }
#     }
#     :return:
#     """
#     job_token = event['input']['aws_request_id']
#     if job_info_client.get_job_info_by_id(job_token) is None:
#         domain_name_list = event['input']['cnameList']
#
#     auto_creation = event['input']['auto_creation']
#     cert_total_number = len(event['input']['cnameList'])
#     cloudfront_total_number = 0 if (auto_creation == 'false') else cert_total_number
#     job_type = event['input']['acm_op']
#     creation_date = str(datetime.now())
#     cert_create_stage_status = 'INPROGRESS'
#     cert_validation_stage_status = 'NOTSTART'
#     dist_stage_status = 'NOTSTART'
#
#     body_without_pem = copy.deepcopy(event['input'])
#     if 'pemList' in body_without_pem:
#         del body_without_pem['pemList']
#
#     if job_info_client.get_job_info_by_id(job_token) is None:
#         job_info_client.create_job_info(JobInfo(
#             jobId=job_token,
#             job_input=json.dumps(body_without_pem, indent=4, default=str),
#             cert_total_number=cert_total_number,
#             cloudfront_distribution_total_number=cloudfront_total_number,
#             cert_completed_number=0,
#             cloudfront_distribution_created_number=0,
#             jobType=job_type,
#             creationDate=creation_date,
#             certCreateStageStatus=cert_create_stage_status,
#             certValidationStageStatus=cert_validation_stage_status,
#             distStageStatus=dist_stage_status,
#             promptInfo='',
#             certList=[],
#             dcv_validation_msg='',
#             distList=[]
#         ))
