import logging
from time import sleep
import uuid
import boto3
import os
import json
import re

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
    logger.info("Received event: " + json.dumps(event))

    return {
        'statusCode': 200,
        'body': json.dumps('appsync_func.py: lambda_handler()')
    }