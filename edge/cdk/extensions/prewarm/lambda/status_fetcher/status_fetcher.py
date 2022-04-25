import json
import logging
import os

import boto3
from boto3.dynamodb.conditions import Key

TABLE_NAME = os.environ['DDB_TABLE_NAME']
aws_region = os.environ['AWS_REGION']
dynamodb = boto3.resource('dynamodb', region_name=aws_region)
log = logging.getLogger()
log.setLevel('INFO')


def prewarm_status_from_ddb(req_id):
    """Query from Prewarm status Dynamodb table"""
    detailed_data = []
    overall_status = 'IN_PROGRESS'
    has_failure = False
    url_list = []
    success_list = []
    fail_list = []

    table = dynamodb.Table(TABLE_NAME)

    response = table.query(
        KeyConditionExpression=Key('reqId').eq(req_id))

    for query_item in response['Items']:
        if 'urlList' in query_item:
            # metadata info
            url_list = query_item['urlList']
            continue

        if query_item['status'] == 'SUCCESS':
            success_list.append(query_item['url'])
        else:
            fail_list.append(query_item['url'])
            has_failure = True

    success_count = len(success_list)
    fail_count = len(fail_list)
    total_count = len(url_list)
    in_progress_count = total_count - success_count - fail_count

    if in_progress_count == 0:
        if has_failure:
            overall_status = 'FAIL'
        else:
            overall_status = 'SUCCESS'

    return {
        'status': overall_status,
        'total': total_count,
        'success': success_count,
        'fail': fail_count,
        'inProgress': in_progress_count,
        'failedUrl': fail_list
    }


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
    except Exception as error:
        response['body'] = str(error)
        response['statusCode'] = 500
        log.error(str(error))

    return response
