import json
import logging
import os
from datetime import datetime, timedelta

import boto3
from metric_helper import collect_metric_data

ATHENA_QUERY_OUTPUT = "s3://" + os.environ['S3_BUCKET'] + "/athena_results/"
athena_client = boto3.client('athena')
dynamodb = boto3.resource('dynamodb', region_name=os.environ['REGION_NAME'])
DB_NAME = os.environ['GLUE_DATABASE_NAME']
DDB_TABLE_NAME = os.environ['DDB_TABLE_NAME']
GLUE_TABLE_NAME = os.environ['GLUE_TABLE_NAME']
M_INTERVAL = int(os.environ['INTERVAL'])
IS_REALTIME = eval(os.environ["IS_REALTIME"])

log = logging.getLogger()
log.setLevel('INFO')


def lambda_handler(event, context):
    log.info('[lambda_handler] Start')
    
    response = {
        "isBase64Encoded": "false",
        "headers": {
            "Content-Type": "application/json"
        }
    }
    event_time = event["time"]
    event_datetime = datetime.strptime(
        event_time, "%Y-%m-%dT%H:%M:%SZ") - timedelta(minutes=5)
    start_datetime = event_datetime - timedelta(minutes=M_INTERVAL)

    start_time = start_datetime.strftime("%Y-%m-%d %H:%M:%S")
    end_time = event_datetime.strftime("%Y-%m-%d %H:%M:%S")
    table = dynamodb.Table(DDB_TABLE_NAME)
    metric = "bandwidthOrigin"
    collect_metric_data(metric, start_time, end_time, athena_client, DB_NAME, GLUE_TABLE_NAME, ATHENA_QUERY_OUTPUT, M_INTERVAL, table, IS_REALTIME)
    log.info('[lambda_handler] End')
    
    return response
