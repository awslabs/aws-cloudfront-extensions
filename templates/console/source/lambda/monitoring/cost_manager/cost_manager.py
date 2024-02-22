import json
import logging
import os
from datetime import datetime, timedelta
from decimal import Decimal

import boto3
from boto3.dynamodb.conditions import Key
from metric_helper import get_domain_list

# Minute
M_INTERVAL = int(os.environ.get("INTERVAL", 5))
METRIC_DICT = [
    "bandwidth",
    "bandwidthOrigin"
]

COUNTRY_ALL = "all"

log = logging.getLogger()
log.setLevel("INFO")

dynamodb = boto3.resource(
    "dynamodb", region_name=os.environ.get("REGION_NAME", "us-east-1")
)


def get_data_from_ddb(table, real_metric, domain, limit, start_time, end_time):
    response = table.query(
        KeyConditionExpression=Key("metricId").eq(real_metric + "-" + domain)
        & Key("timestamp").between(int(start_time), int(end_time)),
        Limit=limit,
    )
    tmp_response = response
    while "LastEvaluatedKey" in tmp_response:
        tmp_response = table.query(
            KeyConditionExpression=Key("metricId").eq(real_metric + "-" + domain)
            & Key("timestamp").between(int(start_time), int(end_time)),
            Limit=limit,
            ExclusiveStartKey=tmp_response["LastEvaluatedKey"],
        )
        response["Items"] += tmp_response["Items"]

    return response


def query_metric_ddb(start_time, end_time, domain, country):
    """Query from Dynamodb table with country filter"""
    TABLE_NAME = os.environ["DDB_TABLE_NAME"]
    detailed_data = {}
    table = dynamodb.Table(TABLE_NAME)
    limit = 1000
    # Get bandwidth data
    response = get_data_from_ddb(table, "bandwidth", domain, limit, start_time, end_time)
    # Get bandwidthOrigin data
    response_origin = get_data_from_ddb(table, "bandwidthOrigin", domain, limit, start_time, end_time)
    
    print("country all")
    for query_item in response["Items"]:
        if query_item["timestamp"] != str(int(start_time)):
            # Get metric data for all countries
            for country in query_item["metricData"]:
                detailed_data_item = {}
                detailed_data_item["datetime"] = datetime.fromtimestamp(
                    int(query_item["timestamp"])
                ).strftime("%Y-%m-%d %H:%M:%S")
                detailed_data_item["domain"] = domain
                detailed_data_item["path"] = ""
                detailed_data_item["from"] = ""
                detailed_data_item["country"] = country
                detailed_data_item["user_traffic"] = query_item["metricData"][country]
                detailed_data_item["upstream_traffic"] = "0"
                data_key = str(query_item["timestamp"])+"_"+country
                if data_key not in detailed_data:
                    detailed_data[data_key] = detailed_data_item

    for origin_item in response_origin["Items"]:
        if origin_item["timestamp"] != str(int(start_time)):
            for origin_country, origin_value in origin_item["metricData"].items():
                print(f"Origin country: {origin_country}, Value: {origin_value}")
                origin_key = str(origin_item["timestamp"])+"_"+origin_country
                if origin_key in detailed_data:
                    detailed_data[origin_key]["upstream_traffic"] = origin_value

    return detailed_data


def get_real_metric(metric_item):
    """Get real metric name"""
    if metric_item == "statusCodeLatency":
        return "statusCode"
    if metric_item == "statusCodeOriginLatency":
        return "statusCodeOrigin"
    if metric_item == "edgeTypeLatency":
        return "edgeType"
    if metric_item == "requestLatency":
        return "request"
    if metric_item == "requestOriginLatency":
        return "requestOrigin"

    return metric_item


def format_date_time(date_string):
    """Format a date string (eg. 2021-09-07 12:00:00) to timestamp"""
    formatted_date = datetime.strptime(date_string, "%Y-%m-%d %H:%M:%S")
    formatted_timestamp = datetime.timestamp(formatted_date)
    log.info("[format_date_time] " + str(formatted_timestamp))
    return formatted_timestamp


def lambda_handler(event, context):
    log.info("[lambda_handler] Start")
    log.info("[lambda_handler] Event " + json.dumps(event))

    response = {
        "isBase64Encoded": "false",
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
        },
    }

    date = event["queryStringParameters"]["date"]
    start_time = f"{date} 00:00:00"
    end_time = f"{date} 23:59:59"
    # Default value
    interval = M_INTERVAL
    country = COUNTRY_ALL
    if "country" in event["queryStringParameters"]:
        country = event["queryStringParameters"]["country"]

    if "domain" in event["queryStringParameters"]:
        # Only one domain to query
        domain_list = [event["queryStringParameters"]["domain"]]
    else:
        # Get all domain in current AWS account
        domain_list = get_domain_list()
    try:
        resp_body_response = {}
        resp_body_data = []
        for domain in domain_list:
            # Get metrics
            detailed_data = query_metric_ddb(
                format_date_time(start_time),
                format_date_time(end_time),
                domain, country)
            for key, value in detailed_data.items():
                resp_body_data.append(value)
        resp_body_response["data"] = resp_body_data
        log.info("[lambda_handler] RequestId: " + context.aws_request_id)
        resp_body_response["request_id"] = context.aws_request_id
        resp_body_response["interval"] = str(interval) + "min"

        response["body"] = json.dumps(resp_body_response, cls=DecimalEncoder)
        response["statusCode"] = 200

    except Exception as error:
        log.error(str(error))

    log.info("[lambda_handler] End")
    return response


class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return str(obj)
        return json.JSONEncoder.default(self, obj)
