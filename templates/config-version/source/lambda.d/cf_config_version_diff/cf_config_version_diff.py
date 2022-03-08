import json
import boto3
import logging
import os
from datetime import datetime

CATALOG_ID = os.environ['ACCOUNT_ID']
S3_URL = "s3://" + os.environ['S3_BUCKET']

log = logging.getLogger()
log.setLevel('INFO')

def lambda_handler(event, context):
    log.info(str(event))
    return {
        'statusCode': 200,
        'body': 'succeed'
    }