import json
import logging
import os
from datetime import datetime

import boto3
from boto3.dynamodb.conditions import Key

log = logging.getLogger()
log.setLevel('INFO')


def prewarm_status_from_ddb(req_id):
    """Query from Prewarm status Dynamodb table"""
    TABLE_NAME = os.environ['DDB_TABLE_NAME']
    aws_region = os.environ['AWS_REGION']
    dynamodb = boto3.resource('dynamodb', region_name=aws_region)
    detailed_data = []
    failed_count = 0
    overall_status = 'SUCCESS'

    table = dynamodb.Table(TABLE_NAME)
    response = table.query(
        KeyConditionExpression=Key('reqId').eq(req_id))

    for query_item in response['Items']:
        log.info(str(query_item))
        detailed_data_item = {}
        detailed_data_item['url'] = query_item['url']
        detailed_data_item['status'] = query_item['status']
        if query_item['status'] == 'FAIL':
            failed_count = failed_count + 1
            overall_status = 'FAIL'
        detailed_data.append(detailed_data_item)

    return {'status': overall_status, 'failCount': failed_count, 'details': detailed_data}


def lambda_handler(event, context):
    response = {
        "isBase64Encoded": "false",
        "headers": {
            "Content-Type": "application/json"
        }
    }

    req_id = event["queryStringParameters"]["requestID"]

    try:
        status_data = prewarm_status_from_ddb(req_id)
        response['body'] = json.dumps(status_data)
        response['statusCode'] = 200
        log.info("[lambda_handler] " + json.dumps(response))
    except Exception as error:
        response['body'] = str(error)
        response['statusCode'] = 500
        log.error(str(error))

    return response
