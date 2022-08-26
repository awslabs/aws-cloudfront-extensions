import logging
import uuid
import boto3
import os
import json
import subprocess
import re
from boto3.dynamodb.conditions import Key
from job_table_utils import create_job_info, update_job_cert_completed_number, update_job_cloudfront_distribution_created_number

# certificate need to create in region us-east-1 for cloudfront to use
acm = boto3.client('acm', region_name='us-east-1')
dynamo_client = boto3.client('dynamodb')

LAMBDA_TASK_ROOT = os.environ.get('LAMBDA_TASK_ROOT')
JOB_INFO_TABLE_NAME = os.environ.get('JOB_INFO_TABLE')
CALLBACK_TABLE = os.getenv('CALLBACK_TABLE')

logger = logging.getLogger('boto3')
logger.setLevel(logging.INFO)


def lambda_handler(event, context):
    """_summary_

    Args:
        event (_type_): _description_
        context (_type_): _description_

    Returns:
        _type_: _description_
    """
    logger.info("Received event: " + json.dumps(event, indent=2))

    # get task_token from event to create callback task
    callback_table = os.getenv('CALLBACK_TABLE')
    task_type = os.getenv('TASK_TYPE')

    # remove all dynmodb records related to the jobs
    job_token = event['input']['aws_request_id']

    ddb_client = boto3.client('dynamodb')
    ddb = boto3.resource('dynamodb')
    ddb_table = ddb.Table(CALLBACK_TABLE)
    try:
        resp = ddb_client.scan(
            TableName=CALLBACK_TABLE,
            FilterExpression='jobToken = :job_token',
            ExpressionAttributeValues={
                ':job_token': {
                    'S': job_token
                }
            },
        )
        logger.info("ddb query response: %s", json.dumps(resp))
        for item in resp['Items']:
            ddb_table.delete_item(
                Key={
                    'taskToken': item['taskToken']['S'],
                    'domainName': item['domainName']['S']
                }
            )
    except Exception as e:
        logger.error("failed to delete the failure job related items with error : %s",str(e))

    return {
        'statusCode': 200,
        'body': json.dumps('step to clean up the resources completed')
    }
