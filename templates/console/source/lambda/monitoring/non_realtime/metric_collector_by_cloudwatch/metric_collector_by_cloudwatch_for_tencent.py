import requests
import logging
import os
from datetime import datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP
import math

import boto3
from metric_helper import get_cloudfront_metric_data

dynamodb = boto3.resource("dynamodb", region_name=os.environ["REGION_NAME"])
DDB_TABLE_NAME = os.environ["DDB_TABLE_NAME"]
USE_START_TIME = os.environ["USE_START_TIME"]
M_INTERVAL = int(os.environ["INTERVAL"])
IS_REALTIME = eval(os.environ["IS_REALTIME"])

log = logging.getLogger()
log.setLevel("INFO")

# 单位 minute
PERIOD = 10
METRIC_NAME_MAPS = {'4xxerrorrate': '4xx',
                    '404errrorrate': '404',
                    '5xxerrrorrate': '5xx',
                    'bytesdownloaded': 'total_flux_out',
                    # 'bytesuploaded': METRIC_PROP_MAP_BU,
                    'cachehitrate': 'total_hy_request/total_flux_hy',
                    'requests': 'total_http_request',
                    # 'totalerrorrate': METRIC_PROP_MAP_TER,
                    # 'originlatency': METRIC_PROP_MAP_OL
                    }
METRIC_CACHE_HIT_RATE = 'CacheHitRate'
METRIC_REQUEST = 'Requests'
METRIC_BYTE_DOWNLOAD = 'BytesDownloaded'
ERROR_RATE_4XX = '4xxerrorrate'
ERROR_RATE_404 = '404errrorrate'
ERROR_RATE_5XX = '5xxerrrorrate'
POST_URL = "http://zhiyan.monitor.tencent-cloud.net:8080/access_v1.http_service/HttpCurveReportRpc"
HEADERS = {
    "Content-Type": "application/json"
}


def get_recently_metric_items_from_ddb(metric_id: str, period: timedelta):
    table = dynamodb.Table(DDB_TABLE_NAME)
    now = datetime.utcnow()
    ten_minutes_ago = now - period
    query_params = {
        'KeyConditionExpression': '#id = :id AND #timestamp >= :start_ts',
        'ExpressionAttributeNames': {'#id': 'metricId', '#timestamp': 'timestamp'},
        'ExpressionAttributeValues': {
            ':id': metric_id,
            ':start_ts': int(ten_minutes_ago.timestamp())
        }
    }
    response = table.query(**query_params)
    items = response.get('Items', [])
    log.debug(items)
    return items


def get_recently_metrics_by_batch(metric_ids: str):
    table = dynamodb.Table(DDB_TABLE_NAME)
    end_time = int(datetime.utcnow().timestamp())
    start_time = int((datetime.utcnow() - timedelta(minutes=10)).timestamp())

    response_items = []
    for metric_id in metric_ids:
        response = table.query(
            KeyConditionExpression='metricId = :m_id AND #timestamp BETWEEN :start_time AND :end_time',
            ExpressionAttributeValues={
                ':m_id': metric_id,
                ':start_time': start_time,
                ':end_time': end_time
            },
            ExpressionAttributeNames={'#timestamp': 'timestamp'}
        )
        response_items.extend(response.get('Items', []))
    log.debug(response_items)
    return response_items


def batch_update_metric_items_to_ddb(table_items):
    if not table_items or len(table_items) == 0:
        log.debug("batch_update_metric_items_to_ddb: No items to update")
        return
    log.debug(f"batch_update_metric_items_to_ddb start {len(table_items)}")
    table = dynamodb.Table(DDB_TABLE_NAME)
    for item in table_items:
        metric_id = item["metricId"]
        timestamp = item["timestamp"]
        metric_data = item["metricData"]
        update_expression = "SET metricData = :metric_data"
        expression_attribute_values = {":metric_data": metric_data}
        table.update_item(
            Key={"metricId": metric_id, "timestamp": timestamp},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_attribute_values
        )
        log.debug(f"update_metric_items_to_ddb: {item}")
    log.debug("batch_update_metric_items_to_ddb end")


def batch_input_metric_items_to_ddb(table_items):
    if not table_items or len(table_items) == 0:
        log.debug("batch_input_metric_items_to_ddb empty")
        return
    log.debug(f"batch_input_metric_items_to_ddb start {len(table_items)}")
    table = dynamodb.Table(DDB_TABLE_NAME)
    with table.batch_writer() as batch:
        for item in table_items:
            batch.put_item(Item=item)
    log.debug("batch_input_metric_items_to_ddb end")


def convert_to_decimal(data):
    if isinstance(data, float):
        return Decimal(str(data))
    elif isinstance(data, dict):
        return {key: convert_to_decimal(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [convert_to_decimal(item) for item in data]
    else:
        return data


def reset_report_value(table_items):
    metric_ids = []
    for item in table_items:
        metric_id = item["metricId"]
        metric_ids.append(metric_id)
    ddb_items = get_recently_metrics_by_batch(metric_ids)
    log.debug(f"reset_report_value start ddb_items:{ddb_items}")
    cal_value = 0
    new_table_items = []
    update_table_items = []
    for item in table_items:
        current_value = item['metricData']["currentValue"]
        if not current_value:
            log.debug(f"reset_report_value current value is 0 continue {item}")
            continue
        report_value = item['metricData']["reportValue"]
        if ddb_items:
            for exist_item in ddb_items:
                if exist_item["metricId"] != item['metricId'] or exist_item["timestamp"] != item['timestamp']:
                    continue
                if exist_item['metricData']["currentValue"] < item['metricData']["currentValue"]:
                    updated_item = exist_item.copy()
                    updated_item['metricData']["currentValue"] = convert_to_decimal(item['metricData']["currentValue"])
                    cal_value += (convert_to_decimal(item['metricData']["currentValue"]) - convert_to_decimal(exist_item['metricData']["currentValue"]))
                    update_table_items.append(updated_item)
                report_value = exist_item['metricData']["reportValue"]
        if not report_value:
            report_value = convert_to_decimal(item['metricData']["currentValue"]) + cal_value
            log.debug(f"{item['metricId']} report_value reset to {report_value} {cal_value} {item}")
            cal_value = 0
            item['metricData'] = {"currentValue": convert_to_decimal(item['metricData']["currentValue"]),
                                  "reportValue": convert_to_decimal(report_value)}
            new_table_items.append(item)
    if update_table_items:
        log.debug(f"update_table_items start : {len(update_table_items)}: {update_table_items}")
        batch_update_metric_items_to_ddb(update_table_items)
    log.debug(f"new_table_items : {new_table_items}")
    return new_table_items


def get_and_save_metrics(period, start_datetime, end_datetime):
    log.info(f"start_datetime : {start_datetime} end_datetime:{end_datetime} period:{period}")
    try:
        all_metrics = get_cloudfront_metric_data(period=period, start_time=start_datetime,
                                                 end_time=end_datetime)
        log.info("all_metrics response: {}".format(all_metrics))
        if not all_metrics:
            log.warning("no metrics found")
            return None
        table_items = []
        for metric in all_metrics:
            if 'MetricDataResults' not in metric or len(metric['MetricDataResults']) <= 0:
                continue
            for metric_data in metric['MetricDataResults']:
                if metric_data['StatusCode'] != 'Complete':
                    log.error("metric_data error: {}".format(metric_data['Messages']))
                    continue
                metric_id = f"{metric_data['Id']}_{metric_data['Label']}"
                values = metric_data['Values']
                timestamps = metric_data['Timestamps']
                if not values:
                    log.debug("metric_data values error: {}".format(values))
                    continue
                i = 0
                for value in values:
                    table_item = {
                        "metricId": metric_id,
                        "timestamp": int(timestamps[i].timestamp()),
                        "metricData": {'currentValue': value, 'reportValue': None},
                    }
                    i = i + 1
                    table_items.append(table_item)
        log.debug("table_items: {}".format(table_items))
        new_table_items = reset_report_value(table_items)
        batch_input_metric_items_to_ddb(new_table_items)
        return new_table_items
    except Exception as e:
        log.error(f"Error fetching and saving metrics: {e}")
        return None


# https://docs.qq.com/doc/DSkhFcHRIVmdaU1RC
def build_report_metric_params_for_tencent(domain_name, protocol, metric_name, report_value, event_time):
    log.debug(f"Building report item for tencent: {domain_name}, {protocol}, {event_time} {metric_name} {report_value}")
    tags = {"domain": domain_name, "my1_provider": "AWS", "isp": 'AWS', "business": "IEG", "bg": "TEG",
            "protocol_type": protocol}
    param_item = {"metric": metric_name, "value": report_value, "tags": tags}
    return param_item


def build_metrics_params_for_tencent(table_items):
    log.info(f"build_metrics_params_for_tencent: {table_items}")
    try:
        report_data = []
        domain_metric_map = {}
        for item in table_items:
            if "metricId" not in item and "timestamp" not in item or "metricData" not in item:
                log.error(f"item data error{item}")
                continue
            if (not item["metricId"] or not item["timestamp"] or not item["metricData"]
                    or not item["metricData"]["reportValue"]):
                log.error(f"item data none error{item}")
                continue
            key_info = str(item["metricId"]).split("_")
            if len(key_info) != 4:
                log.error(f"key_info data error{item}")
                continue
            protocol = key_info[1]
            metric_name = key_info[2]
            domain_name = key_info[3]
            report_value = Decimal(item["metricData"]["reportValue"])
            log.info(f"metric_name:{metric_name} report_value: {report_value}")
            cal_map_key = f'{domain_name}|{protocol}|{item["timestamp"]}|{metric_name.lower()}'
            if (metric_name == METRIC_CACHE_HIT_RATE.lower() or metric_name == ERROR_RATE_4XX.lower()
                  or metric_name == ERROR_RATE_404.lower() or metric_name == ERROR_RATE_5XX.lower()):
                domain_metric_map[cal_map_key] = report_value
                log.info(f"domain_metric_map todo calculate :{domain_metric_map} {report_value}")
                continue
            elif metric_name == METRIC_REQUEST.lower():
                domain_metric_map[cal_map_key] = report_value
                log.info(f"domain_metric_map request :{domain_metric_map} {report_value}")
                if not report_value:
                    log.info(f"domain_metric_map request not report")
                    continue
            elif metric_name == METRIC_BYTE_DOWNLOAD.lower():
                domain_metric_map[cal_map_key] = report_value
                report_value = convert_to_decimal(report_value * 8 / (60 * 1000))
                report_value = report_value.quantize(Decimal('0.00'), rounding=ROUND_HALF_UP)
                log.info(f"domain_metric_map: byte download {cal_map_key} : {report_value} {domain_metric_map[cal_map_key]}")
                if not report_value:
                    log.info(f"domain_metric_map byte download not report")
                    continue
            report_metric_name = METRIC_NAME_MAPS.get(metric_name)
            report_item = build_report_metric_params_for_tencent(domain_name, protocol,
                                                                 report_metric_name, report_value,
                                                                 item["timestamp"])
            report_data.append(report_item)
        for key, value in domain_metric_map.items():
            if key.endswith(METRIC_REQUEST.lower()):
                request_metric = domain_metric_map[key]
                key_info = key.split("|")
                domain_name = key_info[0]
                protocol = key_info[1]
                event_time = key_info[2]
                cache_hit_rate_metric_key = f'{domain_name}|{protocol}|{event_time}|{METRIC_CACHE_HIT_RATE.lower()}'
                if cache_hit_rate_metric_key in domain_metric_map and domain_metric_map[cache_hit_rate_metric_key]:
                    cache_hit_rate_metric = domain_metric_map[cache_hit_rate_metric_key]
                    requests_report_value = math.ceil((request_metric * (Decimal('100.00') - cache_hit_rate_metric)) / 100)
                    if not requests_report_value:
                        log.info(f"requests_report_value 0 {requests_report_value} , {cache_hit_rate_metric} {request_metric}")
                        continue
                    report_item = build_report_metric_params_for_tencent(domain_name, protocol,
                                                                         "total_hy_request", requests_report_value,
                                                                         event_time)
                    report_data.append(report_item)

                error_4xx_metric_key = f'{domain_name}|{protocol}|{event_time}|{ERROR_RATE_4XX.lower()}'
                if error_4xx_metric_key in domain_metric_map and domain_metric_map[error_4xx_metric_key]:
                    error_4xx_metric = domain_metric_map[error_4xx_metric_key]
                    error_4xx_report_value = math.ceil(request_metric * error_4xx_metric)
                    if not error_4xx_report_value:
                        log.info(f"error_4xx_report_value 0 {error_4xx_report_value} , {request_metric}")
                        continue
                    error_4xx_report_item = build_report_metric_params_for_tencent(domain_name, protocol,
                                                                                   METRIC_NAME_MAPS.get(
                                                                                       ERROR_RATE_4XX.lower()),
                                                                                   error_4xx_report_value, event_time)
                    report_data.append(error_4xx_report_item)

                error_404_metric_key = f'{domain_name}|{protocol}|{event_time}|{ERROR_RATE_404.lower()}'
                if error_404_metric_key in domain_metric_map and domain_metric_map[error_404_metric_key]:
                    error_404_metric = domain_metric_map[error_404_metric_key]
                    error_404_report_value = math.ceil(request_metric * error_404_metric)
                    if not error_404_report_value:
                        log.info(f"error_404_report_value 0 {error_404_report_value} , {request_metric}")
                        continue
                    error_404_report_item = build_report_metric_params_for_tencent(domain_name, protocol,
                                                                                   METRIC_NAME_MAPS.get(
                                                                                       ERROR_RATE_404.lower()),
                                                                                   error_404_report_value, event_time)
                    report_data.append(error_404_report_item)

                error_5xx_metric_key = f'{domain_name}|{protocol}|{event_time}|{ERROR_RATE_5XX.lower()}'
                if error_5xx_metric_key in domain_metric_map and domain_metric_map[error_5xx_metric_key]:
                    error_5xx_metric = domain_metric_map[error_5xx_metric_key]
                    error_5xx_report_value = math.ceil(request_metric * error_5xx_metric)
                    if not error_5xx_report_value:
                        log.info(f"error_5xx_report_value 0 {error_5xx_report_value} , {request_metric}")
                        continue
                    error_5xx_report_item = build_report_metric_params_for_tencent(domain_name, protocol,
                                                                                   METRIC_NAME_MAPS.get(
                                                                                       ERROR_RATE_5XX.lower()),
                                                                                   error_5xx_report_value, event_time)
                    report_data.append(error_5xx_report_item)

            if key.endswith(METRIC_BYTE_DOWNLOAD.lower()):
                byte_download_metric = domain_metric_map[key]
                key_info = key.split("|")
                domain_name = key_info[0]
                protocol = key_info[1]
                event_time = key_info[2]
                cache_hit_rate_metric_key = f'{domain_name}|{protocol}|{event_time}|{METRIC_CACHE_HIT_RATE.lower()}'
                if cache_hit_rate_metric_key in domain_metric_map and domain_metric_map[cache_hit_rate_metric_key]:
                    cache_hit_rate_metric = domain_metric_map[cache_hit_rate_metric_key]
                    byte_download_report_value = math.ceil((byte_download_metric * (Decimal('100.00') - cache_hit_rate_metric)) / 100)
                    log.info(f"byte_download_metric: {byte_download_metric}  byte_download_report_value: {byte_download_report_value} ")
                    byte_download_report_value = convert_to_decimal(byte_download_report_value * 8 / (60 * 1000))
                    byte_download_report_value = byte_download_report_value.quantize(Decimal('0.00'),
                                                                                     rounding=ROUND_HALF_UP)
                    log.info(f"convert to kbps byte_download_report_value:{byte_download_report_value} ")
                    if not byte_download_report_value:
                        log.info(f"byte_download_report_value 0 {byte_download_report_value} ,{cache_hit_rate_metric} {byte_download_metric}")
                        continue
                    report_item = build_report_metric_params_for_tencent(domain_name, protocol,
                                                                         "total_flux_hy", byte_download_report_value,
                                                                         event_time)
                    report_data.append(report_item)
        log.debug(f"report_data :{report_data} {str(report_data)}")
        report_count = len(report_data)
        param = {"app_mark": "1115_4108_down_waibao_7", "env": "prod", "report_cnt": report_count,
                 "report_data": str(report_data)}
        return param
    except Exception as e:
        log.error(f"build params error {e}")
        return None


def lambda_handler(event, context):
    log.info("[lambda_handler] Start")
    response = {
        "isBase64Encoded": "false",
        "headers": {
            "Content-Type": "application/json"
        }
    }
    try:
        event_time = event["time"]
        event_datetime = datetime.strptime(
            event_time, "%Y-%m-%dT%H:%M:%SZ")
        start_datetime = event_datetime - timedelta(minutes=PERIOD)
        end_datetime = event_datetime
        log.info(f"event_time {event_time}, event_datetime:{event_datetime} start_datetime:{start_datetime} end_datetime:{end_datetime}")
        new_table_items = get_and_save_metrics(M_INTERVAL * 60, start_datetime, end_datetime)
        if new_table_items:
            try:
                request_params = build_metrics_params_for_tencent(new_table_items)
                log.info("report params: {}".format(request_params))
                if request_params:
                    # log.info(request_params)
                    tencent_response = requests.post(POST_URL, json=request_params, headers=HEADERS)
                    log.info("report response: {}".format(tencent_response.text))
            except Exception as e:
                log.error(f"Error post lambda error: {e}")
        else:
            log.info("No metrics available for tencent")
        response["data"] = new_table_items
    except Exception as e:
        log.error(f"Error handling lambda event: {e}")
    log.info("[lambda_handler] End")
    return response
