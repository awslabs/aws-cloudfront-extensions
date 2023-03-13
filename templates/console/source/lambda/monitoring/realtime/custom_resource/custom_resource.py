import logging
import os
import json
import boto3
from botocore.exceptions import ClientError
from datetime import datetime, timedelta

lambda_client = boto3.client('lambda')
log = logging.getLogger()
log.setLevel('INFO')
log.setLevel('DEBUG')

def lambda_handler(event, context):
    LAMBDA_ARN = os.environ['LAMBDA_ARN']
    APPSYNC_NAME = os.environ['APPSYNC_NAME']
    DDB_TABLE_NAME = os.environ['DDB_TABLE_NAME']
    LIST_COUNTRY_ROLE_ARN = os.environ['LIST_COUNTRY_ROLE_ARN']
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
                response_update = lambda_client.update_function_configuration(
                    FunctionName=APPSYNC_NAME,
                    Role=LIST_COUNTRY_ROLE_ARN,
                    Environment={
                        'Variables': {
                            "DDB_TABLE_NAME": DDB_TABLE_NAME
                        }
                    }
                )
                log.info(str(response_update))

                response = lambda_client.invoke(
                    FunctionName=LAMBDA_ARN,
                    InvocationType='Event',
                    Payload=json.dumps(lambda_payload).encode('UTF-8')
                )
                log.info(str(response))
            except ClientError as e:
                logging.error(e)
