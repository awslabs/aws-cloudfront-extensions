import logging
import boto3
import os
import json

from job_table_utils import update_job_field

# certificate need to create in region us-east-1 for cloudfront to use
acm_client = boto3.client('acm', region_name='us-east-1')
dynamo_client = boto3.resource('dynamodb')
cf = boto3.client('cloudfront')

JOB_INFO_TABLE_NAME = os.environ.get('JOB_INFO_TABLE')
LAMBDA_TASK_ROOT = os.environ.get('LAMBDA_TASK_ROOT')

logger = logging.getLogger('boto3')
logger.setLevel(logging.INFO)

# add execution path
os.environ['PATH'] = os.environ['PATH'] + ':' + os.environ['LAMBDA_TASK_ROOT']


def lambda_handler(event, context):
    """
    :param event:
    :param context:
    """
    # logger.info("Received event: " + json.dumps(event))
    job_id = event['job_id']
    ddb_table = dynamo_client.Table(JOB_INFO_TABLE_NAME)
    resp = ddb_table.get_item(
        Key={
            'jobId': job_id,
        })

    job_info = resp['Item']
    # check whether the job is to only create SSL certificates
    job_input = json.loads(job_info['job_input'])
    request_ssl_num = job_info['cert_total_number']
    if job_input['auto_creation'] == 'false' and job_info['certValidationStageStatus'] != 'SUCCESS':
        # get the total certificate with status "Issued"
        response = acm_client.list_certificates(
            CertificateStatuses=['ISSUED']
        )

        result = []
        # filter only the certificates with jobId in job_token tag
        for acmItem in response['CertificateSummaryList']:
            resp = acm_client.list_tags_for_certificate(
                CertificateArn=acmItem['CertificateArn']
            )
            tagList = resp['Tags']
            logger.info(tagList)

            for tagItem in tagList:
                if tagItem['Key'] == 'job_token' and tagItem['Value'] == job_id:
                    result.append(acmItem['CertificateArn'])

        if request_ssl_num == len(result):
            # the validation process has completed and update the job info table of certValidationStageStatus to SUCCESS
            update_job_field(JOB_INFO_TABLE_NAME,
                             job_id,
                             'certValidationStageStatus',
                             'SUCCESS', )
            update_job_field(JOB_INFO_TABLE_NAME,
                             job_id,
                             'cert_completed_number',
                             request_ssl_num)
        else:
            update_job_field(JOB_INFO_TABLE_NAME,
                             job_id,
                             'cert_completed_number',
                             len(result))
