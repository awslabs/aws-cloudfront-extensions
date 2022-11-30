import json
import logging
import os
from datetime import datetime
from decimal import Decimal

import boto3
from boto3.dynamodb.conditions import Key

athena_client = boto3.client('athena')
# Minute
M_INTERVAL = int(os.environ['INTERVAL'])
METRIC_DICT = [
    "request", "requestOrigin", "statusCode", "statusCodeOrigin", "chr",
    "chrBandWidth", "bandwidth", "bandwidthOrigin", "downloadSpeed",
    "downloadSpeedOrigin", "topNUrlRequests", "topNUrlSize", "downstreamTraffic",
    "latencyratio"
]
METRIC_INT_VALUE = ["request", "requestOrigin", "bandwidth", "bandwidthOrigin", "downstreamTraffic"]
METRIC_FLOAT_VALUE = ["chr", "chrBandWidth", "latencyratio"]
METRIC_TOP_URL = ["topNUrlRequests", "topNUrlSize"]

log = logging.getLogger()
log.setLevel('INFO')


def assemble_status_code(query_item, status_code_list):
    for status_code_item in query_item['metricData']:
        status_code_count = status_code_item['Count']
        status_code = status_code_item['StatusCode']
        is_appended = False
    
        for item in status_code_list:
            if item['StatusCode'] == status_code:
                item['Count'] = int(item['Count']) + int(status_code_count)
                is_appended = True
    
        if not is_appended:
            status_code_list.append({'StatusCode': status_code, 'Count': status_code_count})

    return status_code_list


def query_metric_ddb(start_time, end_time, metric, domain, interval, ori_interval):
    """Query from Dynamodb table"""
    TABLE_NAME = os.environ['DDB_TABLE_NAME']
    dynamodb = boto3.resource('dynamodb', region_name=os.environ['REGION_NAME'])

    detailed_data = []
    table = dynamodb.Table(TABLE_NAME)
    response = table.query(
        KeyConditionExpression=Key('metricId').eq(metric + '-' + domain)
                               & Key('timestamp').between(int(start_time), int(end_time)))

    log.info("[query_metric_ddb] The query result is")
    log.info(str(response))

    # Split the data into group according to interval and ori_interval, if ori_interval equals to interval, max_count will be 1
    max_group_number = int(interval) / int(ori_interval)
    group_value = 0
    group_time = 0
    count = 0
    slice_end = int(start_time) + int(interval) * 60
    group_start_time = int(start_time)
    index_count = 0

    if metric in METRIC_TOP_URL or 'downloadSpeed' in metric:
        # Top url metrics are collected daily and not affected by interval
        for query_item in response['Items']:
            if query_item['timestamp'] != str(int(start_time)):
                detailed_data_item = {}
                detailed_data_item['Time'] = datetime.fromtimestamp(
                    int(query_item['timestamp'])).strftime("%Y-%m-%d %H:%M:%S")
                detailed_data_item['Value'] = query_item['metricData']
                detailed_data.append(detailed_data_item)
    else:
        for query_item in response['Items']:
            if query_item['timestamp'] != str(int(start_time)):
                # Use the first item's timestamp as the group's timestamp
                if 0 == count:
                    group_time = datetime.fromtimestamp(
                        group_start_time).strftime("%Y-%m-%d %H:%M:%S")
                    status_code_value = []
                    group_value = 0

                if metric in METRIC_INT_VALUE:
                    group_value = group_value + int(query_item['metricData'])
                elif metric in METRIC_FLOAT_VALUE:
                    group_value = group_value + float(query_item['metricData'])
                elif 'statusCode' in metric:
                    status_code_value = assemble_status_code(query_item, status_code_value)
                else:
                    raise Exception('[query_metric_ddb] No metric supported: ' + metric)

                count = count + 1
                index_count = index_count + 1
                if index_count < len(response['Items']):
                    next_time = int(response['Items'][index_count]['timestamp'])
                else:
                    next_time = int(query_item['timestamp']) + int(ori_interval) * 60

                if next_time > slice_end or index_count == len(response['Items']):
                    # If next item's timestamp is not in this group, 
                    # it means current item is the last one in the group
                    # If the item is the last item, append the whole group
                    detailed_data_item = {}
                    detailed_data_item['Time'] = group_time
                    if 'statusCode' in metric:
                        detailed_data_item['Value'] = status_code_value
                    elif metric in METRIC_FLOAT_VALUE:
                        # Divide the number of metric data for CHR and latencyRatio
                        detailed_data_item['Value'] = Decimal(group_value / max_group_number).quantize(Decimal("0.00"))
                    else:
                        detailed_data_item['Value'] = group_value
                    detailed_data.append(detailed_data_item)
                    # Reset counter
                    count = 0
                    slice_end = slice_end + int(interval) * 60
                    group_start_time = group_start_time + int(interval) * 60 
                    

    return detailed_data


def get_metric_data(start_time, end_time, metric, domain, interval, ori_interval):
    """Generate detailed data according to query id"""
    cdn_data = []
    cdn_data_item = {}
    gen_data = {}
    detailed_data = []

    if metric == "all":
        for metric_item in METRIC_DICT:
            detailed_data = []
            cdn_data_item = {}
            log.info(
                "[get_metric_data] Start to get query result from ddb table - "
                + metric_item)
            detailed_data = query_metric_ddb(
                start_time, end_time, metric_item, domain, interval, ori_interval)
            cdn_data_item['Metric'] = metric_item
            cdn_data_item['DetailData'] = detailed_data
            cdn_data.append(cdn_data_item)
    else:
        log.info("[get_metric_data] Start to get query result from ddb table")
        detailed_data = query_metric_ddb(
            start_time, end_time, metric, domain, interval, ori_interval)
        cdn_data_item['Metric'] = metric
        cdn_data_item['DetailData'] = detailed_data
        cdn_data.append(cdn_data_item)
    
    log.info("[get_metric_data] Generated data: ")
    log.info(str(gen_data))

    return cdn_data


def format_date_time(date_string):
    """Format a date string (eg. 2021-09-07 12:00:00) to timestamp"""
    formatted_date = datetime.strptime(date_string, "%Y-%m-%d %H:%M:%S")
    formatted_timestamp = datetime.timestamp(formatted_date)
    log.info("[format_date_time] " + str(formatted_timestamp))
    return formatted_timestamp


def lambda_handler(event, context):
    log.info('[lambda_handler] Start')
    log.info('[lambda_handler] Event ' + json.dumps(event))

    response = {
        "isBase64Encoded": "false",
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
        }
    }

    start_time = event["queryStringParameters"]["StartTime"]
    end_time = event["queryStringParameters"]["EndTime"]
    domain = event["queryStringParameters"]["Domain"]
    metric = event["queryStringParameters"]["Metric"]
    interval = M_INTERVAL

    if "Interval" in event["queryStringParameters"]:
        interval = event["queryStringParameters"]["Interval"]

    try:
        resp_body = {}
        resp_body_response = {}
        resp_body_data = []
        data_item = {}

        cdn_data = get_metric_data(format_date_time(start_time),
                                   format_date_time(end_time), metric, domain, interval, M_INTERVAL)
        data_item['CdnData'] = cdn_data
        resp_body_data.append(data_item)

        resp_body_response['Data'] = resp_body_data
        log.info('[lambda_handler] RequestId: ' + context.aws_request_id)
        resp_body_response['RequestId'] = context.aws_request_id
        resp_body_response['Interval'] = str(interval) + "min"

        resp_body['Response'] = resp_body_response
        response['body'] = json.dumps(resp_body, cls=DecimalEncoder)
        response['statusCode'] = 200

        log.info("[lambda_handler] " + json.dumps(response))
    except Exception as error:
        log.error(str(error))

    log.info('[lambda_handler] End')
    return response


class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return str(obj)
        return json.JSONEncoder.default(self, obj)


