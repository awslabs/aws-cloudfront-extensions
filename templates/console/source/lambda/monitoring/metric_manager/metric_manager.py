import json
import logging
import os
from datetime import datetime, timedelta
from decimal import Decimal

import boto3
from boto3.dynamodb.conditions import Key

athena_client = boto3.client("athena")
# Minute
M_INTERVAL = int(os.environ.get("INTERVAL", 5))
METRIC_DICT = [
    "request",
    "requestOrigin",
    "requestLatency",
    "requestOriginLatency",
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
    "bandwidth",
    "bandwidthOrigin",
    "downstreamTraffic",
]

METRIC_PERCENT = ["edgeType"]

COUNTRY_ALL = "all"

log = logging.getLogger()
log.setLevel("INFO")

dynamodb = boto3.resource(
    "dynamodb", region_name=os.environ.get("REGION_NAME", "us-east-1")
)


def query_metric_ddb(start_time, end_time, metric, domain, country):
    """Query from Dynamodb table with country filter"""
    TABLE_NAME = os.environ["DDB_TABLE_NAME"]
    real_metric = get_real_metric(metric)

    detailed_data = []
    table = dynamodb.Table(TABLE_NAME)
    response = table.query(
        KeyConditionExpression=Key("metricId").eq(real_metric + "-" + domain)
        & Key("timestamp").between(int(start_time), int(end_time))
    )
    # log.info("[query_metric_ddb] The query result is")
    # log.info(str(response))

    if country == COUNTRY_ALL:
        for query_item in response["Items"]:
            if query_item["timestamp"] != str(int(start_time)):
                detailed_data_item = {}
                detailed_data_item["Time"] = datetime.fromtimestamp(
                    int(query_item["timestamp"])
                ).strftime("%Y-%m-%d %H:%M:%S")

                # Get metric data for all countries
                if metric in METRIC_SUM:
                    sum_value = 0
                    for country_item in query_item["metricData"]:
                        sum_value = sum_value + int(
                            query_item["metricData"][country_item]
                        )
                    detailed_data_item["Value"] = str(sum_value)
                elif metric == "request" or metric == "requestOrigin":
                    sum_value = 0
                    for country_item in query_item["metricData"]:
                        for sc in query_item["metricData"][country_item]:
                            sum_value += int(sc["Count"])
                    detailed_data_item["Value"] = str(sum_value)
                elif metric == "requestLatency" or metric == "requestOriginLatency":
                    req_time = 0
                    req_count = 0
                    for country_item in query_item["metricData"]:
                        for sc in query_item["metricData"][country_item]:
                            req_count += int(sc["Count"])
                            req_time += int(sc["Count"]) * float(sc["Latency"])
                    detailed_data_item["Value"] = Decimal(
                        req_time / req_count
                    ).quantize(Decimal("0.000"))
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
                            latency_count += int(sc["Count"])
                            latency_value += int(sc["Count"]) * float(sc["Latency"])
                    detailed_data_item["Value"] = Decimal(
                        latency_value / latency_count
                    ).quantize(Decimal("0.00"))
                elif metric == "chr" or metric == "chrBandWidth":
                    chr_metric = 0
                    chr_count = 0
                    for country_item in query_item["metricData"]:
                        for sc in query_item["metricData"][country_item]:
                            chr_count += int(sc["Count"])
                            chr_metric += int(sc["Count"]) * float(sc["Metric"])
                    detailed_data_item["Value"] = Decimal(
                        chr_metric / chr_count
                    ).quantize(Decimal("0.00"))
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
                    # TODO: support country filter
                    detailed_data_item["Value"] = query_item["metricData"]
                else:
                    if country in query_item["metricData"]:
                        # Only get the metric data for the specified country
                        if metric == "chr" or metric == "chrBandWidth":
                            detailed_data_item["Value"] = query_item["metricData"][
                                country
                            ][0]["Metric"]
                        elif (
                            metric == "latencyRatio"
                            or metric == "requestLatency"
                            or metric == "requestOriginLatency"
                        ):
                            detailed_data_item["Value"] = query_item["metricData"][
                                country
                            ][0]["Latency"]
                        elif metric == "request" or metric == "requestOrigin":
                            detailed_data_item["Value"] = query_item["metricData"][
                                country
                            ][0]["Count"]
                        else:
                            detailed_data_item["Value"] = query_item["metricData"][
                                country
                            ]

                if "Value" in detailed_data_item:
                    # Skip if no value in specific country
                    detailed_data.append(detailed_data_item)

    if metric == "topNUrlRequests":
        sum_top_value = {}
        top_detailed_data = []
        
        for top_row in detailed_data:
            for top_item in top_row["Value"]:
                if top_item["Path"] not in sum_top_value:
                    sum_top_value[top_item["Path"]] = int(top_item["Count"])
                else:
                    sum_top_value[top_item["Path"]] = int(
                        sum_top_value[top_item["Path"]]
                    ) + int(top_item["Count"])

        sum_top_value = sorted(sum_top_value.items(), key=lambda x: x[1], reverse=True)
        top_detailed_data = [
            {"Path": k, "Count": v} for k, v in sum_top_value
        ]
        detailed_data = [{"Value": top_detailed_data}]
    elif metric == "topNUrlSize":
        sum_top_value = {}
        top_detailed_data = []
        
        for top_row in detailed_data:
            for top_item in top_row["Value"]:
                if top_item["Path"] not in sum_top_value:
                    sum_top_value[top_item["Path"]] = int(top_item["Size"])
                else:
                    sum_top_value[top_item["Path"]] = int(
                        sum_top_value[top_item["Path"]]
                    ) + int(top_item["Size"])

        sum_top_value = sorted(sum_top_value.items(), key=lambda x: x[1], reverse=True)
        top_detailed_data = [
            {"Path": k, "Size": v} for k, v in sum_top_value
        ]
        detailed_data = [{"Value": top_detailed_data}]

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


def get_metric_data(start_time, end_time, metric, domain, country):
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
                + metric_item
            )
            if metric_item == 'topNUrlRequests' or metric_item == 'topNUrlSize':
                temp_start_time = datetime.fromtimestamp(start_time).replace(hour=0, minute=0, second=0)
                temp_end_time = datetime.fromtimestamp(end_time).replace(hour=0, minute=0, second=0)
                if temp_start_time == temp_end_time:
                    temp_end_time = temp_end_time + timedelta(days=1)
                detailed_data = query_metric_ddb(temp_start_time.timestamp(), temp_end_time.timestamp(), metric_item, domain, country)
            else:
                detailed_data = query_metric_ddb(start_time, end_time, metric_item, domain, country)
            cdn_data_item["Metric"] = metric_item
            cdn_data_item["DetailData"] = detailed_data
            cdn_data.append(cdn_data_item)
    else:
        log.info("[get_metric_data] Start to get query result from ddb table")
        detailed_data = query_metric_ddb(start_time, end_time, metric, domain, country)
        cdn_data_item["Metric"] = metric
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

    except Exception as error:
        log.error(str(error))

    log.info("[lambda_handler] End")
    return response


class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return str(obj)
        return json.JSONEncoder.default(self, obj)
