import json
import logging
import os
from datetime import datetime
from decimal import Decimal

import boto3
from boto3.dynamodb.conditions import Key

athena_client = boto3.client("athena")
# Minute
M_INTERVAL = int(os.environ["INTERVAL"])
METRIC_DICT = [
    "request",
    "requestOrigin",
    "statusCode",
    "statusCodeLatency",
    "statusCodeOrigin",
    "statusCodeOriginLatency",
    "chr",
    "chrBandWidth",
    "bandwidth",
    "bandwidthOrigin",
    "latencyRatio",
    "topNUrlRequests",
    "topNUrlSize",
    "downstreamTraffic",
    "edgeType",
    "edgeTypeLatency",
]
METRIC_SUM = [
    "request",
    "requestOrigin",
    "bandwidth",
    "bandwidthOrigin",
    "downstreamTraffic",
]

METRIC_PERCENT = ["edgeType"]

COUNTRY_ALL = "all"

log = logging.getLogger()
log.setLevel("INFO")


def query_metric_ddb(start_time, end_time, metric, domain, country):
    """Query from Dynamodb table with country filter"""
    TABLE_NAME = os.environ["DDB_TABLE_NAME"]
    dynamodb = boto3.resource("dynamodb", region_name=os.environ["REGION_NAME"])

    detailed_data = []
    table = dynamodb.Table(TABLE_NAME)
    response = table.query(
        KeyConditionExpression=Key("metricId").eq(metric + "-" + domain)
        & Key("timestamp").between(int(start_time), int(end_time))
    )
    log.info("[query_metric_ddb] The query result is")
    log.info(str(response))

    if country == COUNTRY_ALL:
        for query_item in response["Items"]:
            if query_item["timestamp"] != str(int(start_time)):
                detailed_data_item = {}
                detailed_data_item["Time"] = datetime.fromtimestamp(
                    int(query_item["timestamp"])
                ).strftime("%Y-%m-%d %H:%M:%S")

                # Get metric data for all countries
                # TODO:
                if metric in METRIC_SUM:
                    sum_value = 0
                    for country_item in query_item["metricData"]:
                        sum_value = sum_value + int(
                            query_item["metricData"][country_item]
                        )
                    detailed_data_item["Value"] = str(sum_value)
                elif metric == "statusCode" or metric == "statusCodeOrigin":
                    m_dict = []
                    for country_item in query_item["metricData"]:
                        for sc in query_item["metricData"][country_item]:
                            found = False
                            for m in m_dict:
                                if sc["StatusCode"] == m["StatusCode"]:
                                    m["Count"] = str(int(m["Count"]) + int(sc["Count"]))
                                    found = True
                                    break
                            if not found:
                                m_dict.append(sc)
                    detailed_data_item["Value"] = m_dict
                elif (
                    metric == "statusCodeLatency" or metric == "statusCodeOriginLatency"
                ):
                    m_dict = []
                    for country_item in query_item["metricData"]:
                        for sc in query_item["metricData"][country_item]:
                            found = False
                            for m in m_dict:
                                if sc["StatusCode"] == m["StatusCode"]:
                                    m["Latency"] = Decimal(
                                        (
                                            int(m["Count"]) * float(m["Latency"])
                                            + int(sc["Count"]) * float(sc["Latency"])
                                        )
                                        / (int(m["Count"]) + int(sc["Count"]))
                                    ).quantize(Decimal("0.000"))
                                    found = True
                                    break
                            if not found:
                                m_dict.append(sc)
                    detailed_data_item["Value"] = m_dict
                elif metric == "edgeType":
                    m_dict = []
                    for country_item in query_item["metricData"]:
                        for sc in query_item["metricData"][country_item]:
                            found = False
                            for m in m_dict:
                                if sc["EdgeType"] == m["EdgeType"]:
                                    m["Count"] = str(int(m["Count"]) + int(sc["Count"]))
                                    found = True
                                    break
                            if not found:
                                m_dict.append(sc)
                    detailed_data_item["Value"] = m_dict
                elif metric == "edgeTypeLatency":
                    m_dict = []
                    for country_item in query_item["metricData"]:
                        for sc in query_item["metricData"][country_item]:
                            found = False
                            for m in m_dict:
                                if sc["EdgeType"] == m["EdgeType"]:
                                    m["Latency"] = Decimal(
                                        (
                                            int(m["Count"]) * float(m["Latency"])
                                            + int(sc["Count"]) * float(sc["Latency"])
                                        )
                                        / (int(m["Count"]) + int(sc["Count"]))
                                    ).quantize(Decimal("0.000"))
                                    found = True
                                    break
                            if not found:
                                m_dict.append(sc)
                    detailed_data_item["Value"] = m_dict
                elif metric == "latencyRatio":
                    latency_value = 0
                    latency_count = 0
                    for country_item in query_item["metricData"]:
                        for sc in query_item["metricData"][country_item]:
                            if latency_count == 0 and latency_value == 0:
                                latency_count = int(sc["Count"])
                                latency_value = sc["Latency"]
                            else:
                                latency_value = Decimal(
                                    (
                                        int(latency_count) * float(latency_value)
                                        + int(sc["Count"]) * float(sc["Latency"])
                                    )
                                    / (int(latency_count) + int(sc["Count"]))
                                ).quantize(Decimal("0.00"))
                    detailed_data_item["Value"] = latency_value
                elif metric == "chr" or metric == "chrBandWidth":
                    chr_metric = 0
                    chr_count = 0
                    for country_item in query_item["metricData"]:
                        for sc in query_item["metricData"][country_item]:
                            if chr_count == 0 and chr_metric == 0:
                                chr_count = int(sc["Count"])
                                chr_metric = sc["Metric"]
                            else:
                                chr_metric = Decimal(
                                    (
                                        int(chr_count) * float(chr_metric)
                                        + int(sc["Count"]) * float(sc["Metric"])
                                    )
                                    / (int(chr_count) + int(sc["Count"]))
                                ).quantize(Decimal("0.00"))
                    detailed_data_item["Value"] = chr_metric
                else:
                    detailed_data_item["Value"] = query_item["metricData"]

                detailed_data.append(detailed_data_item)
    else:
        for query_item in response["Items"]:
            if query_item["timestamp"] != str(int(start_time)):
                detailed_data_item = {}
                detailed_data_item["Time"] = datetime.fromtimestamp(
                    int(query_item["timestamp"])
                ).strftime("%Y-%m-%d %H:%M:%S")
                if metric == "topNUrlRequests" or metric == "topNUrlSize":
                    #TODO:implement
                    detailed_data_item["Value"] = query_item["metricData"]
                else:
                    if country not in query_item["metricData"]:
                        raise Exception(
                            f"The country value {country} is not valid, please specify a valid country"
                        )
                    # Only get the metric data for the specified country
                    if metric == "chr" or metric == "chrBandWidth":
                        detailed_data_item["Value"] = query_item["metricData"][country][0]["Metric"]
                    elif metric == "latencyRatio":
                        detailed_data_item["Value"] = query_item["metricData"][country][0]["Latency"]
                    else:
                        detailed_data_item["Value"] = query_item["metricData"][country]
                detailed_data.append(detailed_data_item)

    return detailed_data


def get_real_metric(metric_item):
    """Get real metric name"""
    if metric_item == "statusCodeLatency":
        metric_item = "statusCode"
    if metric_item == "statusCodeOriginLatency":
        metric_item = "statusCodeOrigin"
    if metric_item == "edgeTypeLatency":
        metric_item = "edgeType"

    return metric_item


def get_metric_data(start_time, end_time, metric, domain, country):
    """Generate detailed data according to query id"""
    cdn_data = []
    cdn_data_item = {}
    gen_data = {}
    detailed_data = []

    if metric == "all":
        for metric_item in METRIC_DICT:
            ori_metric = metric_item
            metric_item = get_real_metric(metric_item)
            detailed_data = []
            cdn_data_item = {}
            log.info(
                "[get_metric_data] Start to get query result from ddb table - "
                + metric_item
            )
            detailed_data = query_metric_ddb(
                start_time, end_time, metric_item, domain, country
            )
            cdn_data_item["Metric"] = ori_metric
            cdn_data_item["DetailData"] = detailed_data
            cdn_data.append(cdn_data_item)
    else:
        ori_metric = metric
        metric = get_real_metric(metric)
        log.info("[get_metric_data] Start to get query result from ddb table")
        detailed_data = query_metric_ddb(start_time, end_time, metric, domain, country)
        cdn_data_item["Metric"] = ori_metric
        cdn_data_item["DetailData"] = detailed_data
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

    start_time = event["queryStringParameters"]["StartTime"]
    end_time = event["queryStringParameters"]["EndTime"]
    domain = event["queryStringParameters"]["Domain"]
    metric = event["queryStringParameters"]["Metric"]

    # Default value
    interval = M_INTERVAL
    country = COUNTRY_ALL

    # if "Interval" in event["queryStringParameters"]:
    #     interval = event["queryStringParameters"]["Interval"]

    if "Country" in event["queryStringParameters"]:
        country = event["queryStringParameters"]["Country"]

    try:
        resp_body = {}
        resp_body_response = {}
        resp_body_data = []
        data_item = {}

        cdn_data = get_metric_data(
            format_date_time(start_time),
            format_date_time(end_time),
            metric,
            domain,
            country,
        )
        data_item["CdnData"] = cdn_data
        resp_body_data.append(data_item)

        resp_body_response["Data"] = resp_body_data
        log.info("[lambda_handler] RequestId: " + context.aws_request_id)
        resp_body_response["RequestId"] = context.aws_request_id
        resp_body_response["Interval"] = str(interval) + "min"
        resp_body_response["Country"] = country

        resp_body["Response"] = resp_body_response
        response["body"] = json.dumps(resp_body, cls=DecimalEncoder)
        response["statusCode"] = 200

        log.info("[lambda_handler] " + json.dumps(response))
    except Exception as error:
        log.error(str(error))

    log.info("[lambda_handler] End")
    return response


class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return str(obj)
        return json.JSONEncoder.default(self, obj)
