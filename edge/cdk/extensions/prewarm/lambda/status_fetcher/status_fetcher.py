import datetime
import json
import logging
import os

import boto3
from boto3.dynamodb.conditions import Key

TABLE_NAME = os.environ['DDB_TABLE_NAME']
aws_region = os.environ['AWS_REGION']
SHOW_SUCC_URLS = os.environ['SHOW_SUCC_URLS']
API_TIME_OUT = 300
dynamodb = boto3.resource('dynamodb', region_name=aws_region)
log = logging.getLogger()
log.setLevel('INFO')


def pop_prefix(pop_list):
    pop_prefix = []
    for pop in pop_list:
        if pop[0:3] not in pop_prefix:
            pop_prefix.append(pop[0:3])

    return pop_prefix


def prewarm_status_from_ddb(req_id, dynamodb):
    """Query from Prewarm status Dynamodb table"""
    overall_status = 'IN_PROGRESS'
    create_time = ''
    current_time = datetime.datetime.utcnow()
    url_list = []
    success_list = []
    fail_list = []
    fail_map = {}
    suc_pop_map = {}

    table = dynamodb.Table(TABLE_NAME)

    response = table.query(
        KeyConditionExpression=Key('reqId').eq(req_id))

    if len(response['Items']) == 0:
        return {
            'message': 'No result is found, please check the requestId'
        }

    for query_item in response['Items']:
        if 'create' in query_item:
            create_time = query_item['create_time']
        else:
            create_time = datetime.datetime.now().strftime('%Y%m%dT%H%M%SZ')

        if 'urlList' in query_item:
            # metadata info
            url_list = query_item['urlList']
            continue

        if query_item['status'] == 'SUCCESS':
            success_list.append(query_item['url'])
        else:
            fail_list.append(query_item['url'])
            fail_map[query_item['url']] = query_item['failure']
            suc_pop_map[query_item['url']] = pop_prefix(query_item['success'])

    for url_key in fail_map.keys():
        is_match = True
        for fail_pop in fail_map[url_key]:
            if fail_pop[0:3] not in suc_pop_map[url_key]:
                is_match = False
                break
        if is_match and not (len(fail_map[url_key]) == 0 and len(suc_pop_map[url_key]) == 0):
            success_list.append(url_key)
            fail_list.remove(url_key)

    success_count = len(success_list)
    fail_count = len(fail_list)
    total_count = len(url_list)
    in_progress_count = total_count - success_count - fail_count

    if in_progress_count == 0:
        if fail_count == 0:
            overall_status = 'COMPLETED'
        else:
            overall_status = 'FAILED'
    else:
        create_datetime = datetime.datetime.strptime(
            create_time, "%Y%m%dT%H%M%SZ")
        duration = ((current_time - create_datetime).total_seconds())/60
        if duration > API_TIME_OUT:
            overall_status = 'TIMEOUT'

    in_progress_list = url_list
    if len(in_progress_list) > 0:
        for succ_url in success_list:
            in_progress_list.remove(succ_url)
        for fail_url in fail_list:
            in_progress_list.remove(fail_url)

    if SHOW_SUCC_URLS.lower() == 'true':
        return {
            'status': overall_status,
            'total': total_count,
            'completed': success_count + fail_count,
            'inProgress': in_progress_count,
            'failedUrl': fail_list,
            'inProgressUrl': in_progress_list,
            'successUrl': success_list
        }

    return {
        'status': overall_status,
        'total': total_count,
        'completed': success_count + fail_count,
        'inProgress': in_progress_count,
        'failedUrl': fail_list,
        'inProgressUrl': in_progress_list
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
        status_data = prewarm_status_from_ddb(req_id, dynamodb)
        response['body'] = json.dumps(status_data)
        response['statusCode'] = 200
    except Exception as error:
        response['body'] = str(error)
        response['statusCode'] = 500
        log.error(str(error))

    return response
