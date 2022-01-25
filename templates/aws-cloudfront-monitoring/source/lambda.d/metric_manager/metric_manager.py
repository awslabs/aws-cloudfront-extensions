import json
import logging
import os
from datetime import datetime
from decimal import Decimal

import boto3
from boto3.dynamodb.conditions import Key

athena_client = boto3.client('athena')

INTERVAL = 5
METRIC_DICT = [
    "request", "requestOrigin", "statusCode", "statusCodeOrigin", "chr",
    "chrBandWith", "bandwidth", "bandwidthOrigin", "downloadSpeed",
    "downloadSpeedOrigin"
]

log = logging.getLogger()
log.setLevel('INFO')


def query_metric_ddb(start_time, end_time, metric, domain):
    """Query from Dynamodb table"""
    TABLE_NAME = os.environ['DDB_TABLE_NAME']
    dynamodb = boto3.resource('dynamodb', region_name=os.environ['REGION_NAME'])

    detailed_data = []
    table = dynamodb.Table(TABLE_NAME)
    response = table.query(
        KeyConditionExpression=Key('metricId').eq(metric + '-' + domain)
                               & Key('timestamp').between(str(int(start_time)), str(int(end_time))))

    log.info("[query_metric_ddb] The query result is")
    log.info(str(response))

    for query_item in response['Items']:
        log.info(str(query_item))
        if query_item['timestamp'] != str(int(start_time)):
            detailed_data_item = {}
            detailed_data_item['Time'] = datetime.fromtimestamp(
                int(query_item['timestamp'])).strftime("%Y-%m-%d %H:%M:%S")
            detailed_data_item['Value'] = query_item['metricData']
            detailed_data.append(detailed_data_item)

    return detailed_data


def get_metric_data(start_time, end_time, metric, domain):
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
            detailed_data = query_metric_ddb(start_time, end_time, metric_item,
                                             domain)
            cdn_data_item['Metric'] = metric_item
            cdn_data_item['DetailData'] = detailed_data
            cdn_data.append(cdn_data_item)
    else:
        log.info("[get_metric_data] Start to get query result from ddb table")
        detailed_data = query_metric_ddb(start_time, end_time, metric, domain)
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
            "Content-Type": "application/json"
        }
    }

    start_time = event["queryStringParameters"]["StartTime"]
    end_time = event["queryStringParameters"]["EndTime"]
    domain = event["queryStringParameters"]["Domain"]
    metric = event["queryStringParameters"]["Metric"]

    try:
        resp_body = {}
        resp_body_response = {}
        resp_body_data = []
        data_item = {}

        cdn_data = get_metric_data(format_date_time(start_time),
                                   format_date_time(end_time), metric, domain)
        data_item['CdnData'] = cdn_data
        resp_body_data.append(data_item)

        resp_body_response['Data'] = resp_body_data
        log.info('[lambda_handler] RequestId: ' + context.aws_request_id)
        resp_body_response['RequestId'] = context.aws_request_id
        resp_body_response['Interval'] = str(INTERVAL) + "min"

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
