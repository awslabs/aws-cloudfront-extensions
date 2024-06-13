import os
import http
import json
import logging

from layer.acm_service.types_ import NotificationInput
from functions.acm_cb.types_ import Event
from layer.acm_service.client import AcmUtilsService
from layer.cloudfront_service.client import CloudFrontUtilsService
from layer.common.response import Response
from layer.job_service.client import JobInfoUtilsService
from layer.sns_service.client import SnsUtilsService

logger = logging.getLogger()
logger.setLevel(logging.INFO)
task_type = os.getenv("TASK_TYPE")
# get sns topic arn from environment variable
sns_topic_arn = os.environ.get("SNS_TOPIC")

acm_client = AcmUtilsService(logger=logger)
job_info_client = JobInfoUtilsService(logger=logger)
cloudfront_client = CloudFrontUtilsService(logger=logger)
sns_client = SnsUtilsService(logger=logger)


def handler(event: Event, context) -> Response:
    logger.info("Received event: " + json.dumps(event, default=str))

    cf_dist_id = event["cf_dist_id"]
    cert_arn = event["cert_arn"]
    create_snapshot = event["create_snapshot"] if "create_snapshot" in event else "false"

    try:
    #     if "true" == auto_creation:
    #         cloudfront_client.validate_source_cloudfront_dist(domain_name_list)

    #     # aggregate certificate if dist_aggregate is true
    #     if "dist_aggregate" in event["input"] and event["input"]["dist_aggregate"] == "true":
    #         sns_msg = acm_client.aggregate_dist(domain_name_list, task_token, task_type, job_token)
    #     else:
    #         sns_msg = acm_client.none_aggregate_dist(domain_name_list, task_token, task_type, job_token)

    #     cloudfront_dist = []
    #     for record in event["input"]["fn_acm_cb_handler_map"]:
    #         cloudfront_dist.append(NotificationInput(
    #             distributionDomainName=record["fn_cloudfront_bind"]["Payload"]["body"]["distributionDomainName"],
    #             distributionArn=record["fn_cloudfront_bind"]["Payload"]["body"]["distributionArn"],
    #             aliases=record["fn_cloudfront_bind"]["Payload"]["body"]["aliases"],
    #         ))

    #     sns_content = acm_client.get_notification_content(
    #         job_token=job_token,
    #         dcv_msg=sns_msg,
    #         cloudfront_distributions=cloudfront_dist
    #     )
    #     sns_client.publish_by_topic(topic_arn=sns_topic_arn, msg=sns_content, subject="SSL for SaaS event received")

    #     job_info_client.update_job_fields_by_dict(job_token, {
    #         "certCreateStageStatus": "SUCCESS",
    #         "certValidationStageStatus": "INPROGRESS",
    #         "cert_completed_number": cert_total_number,
    #         "dcv_validation_msg": sns_content
    #     })
    #     logger.info("Certificate creation job %s completed successfully", job_token)

        return Response(statusCode=http.HTTPStatus.OK, body="Place holder")
    except Exception as e:
        logger.error("Exception occurred, place holder")
        # job_info_client.update_job_fields_by_dict(job_token, {
        #     "certCreateStageStatus": "FAILED",
        #     "promptInfo": str(e)
        # })
        raise e
