import logging
import os
import json
import boto3
from botocore.exceptions import ClientError
from datetime import datetime, timedelta

LAMBDA_ARN = os.environ['LAMBDA_ARN']
lambda_client = boto3.client('lambda')
log = logging.getLogger()
log.setLevel('INFO')
log.setLevel('DEBUG')

def lambda_handler(event, context):
    request_type = event['RequestType'].upper() if (
        'RequestType' in event) else ""
    log.info(request_type)
    log.info(event)
    time_now = datetime.now() - timedelta(days=1)
    current_time = time_now.strftime("%Y-%m-%dT%H:%M:%SZ")

    if event['ResourceType'] == "Custom::AddPartRealtime":
        if 'CREATE' in request_type or 'UPDATE' in request_type:
            lambda_payload = {
                'time': current_time
            }
            try:
                response = lambda_client.invoke(
                    FunctionName=LAMBDA_ARN,
                    InvocationType='Event',
                    Payload=json.dumps(lambda_payload).encode('UTF-8')
                )

                log.info(str(response))
            except ClientError as e:
                logging.error(e)
