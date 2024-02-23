from wsgiref import headers

import requests
import logging
import os
from datetime import datetime, timedelta

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
    log.info(items)
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
    log.info(response_items)
    return response_items


def batch_input_metric_items_to_ddb(table_items):
    dynamodb.put_item(TableName=DDB_TABLE_NAME, Item=table_items)
    table = dynamodb.Table(DDB_TABLE_NAME)
    with table.batch_writer() as batch:
        for item in table_items:
            batch.put_item(Item=item)


def reset_report_value(table_items):
    metric_ids = []
    for item in table_items:
        metric_id = item["metricId"]
        metric_ids.append(metric_id)
    ddb_items = get_recently_metrics_by_batch(metric_ids)
    cal_value = 0
    for item in table_items:
        report_value = None
        for exist_item in ddb_items:
            if exist_item["metricId"] != item['metricId']:
                continue
            if exist_item['metricData']["currentValue"] < item['metricData']["currentValue"]:
                cal_value += item['metricData']["currentValue"] - exist_item['metricData']["currentValue"]
            report_value = exist_item['metricData']["reportValue"]
        if not report_value:
            report_value = item['metricData']["reportValue"] + cal_value
            cal_value = 0
        item['metricData'] = {"currentValue": item['metricData']["currentValue"], "reportValue": report_value}
    return table_items


def get_and_save_metrics(start_datetime, end_datetime):
    try:
        all_metrics = get_cloudfront_metric_data(period=M_INTERVAL * 60, start_time=start_datetime,
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
                    log.info("metric_data error: {}".format(metric_data['Messages']))
                    continue
                metric_id = metric_data['Id']
                values = metric_data['Values']
                timestamps = metric_data['Timestamps']
                if not values:
                    log.info("metric_data values error: {}".format(values))
                    continue
                i = 0
                for value in values:
                    table_item = {
                        "metricId": metric_id,
                        "timestamp": int(timestamps[i].timestamp()),
                        "metricData": {'currentValue': value, 'reportValue': value},
                    }
                    i = i + 1
                    table_items.append(table_item)
        new_table_items = reset_report_value(table_items)
        batch_input_metric_items_to_ddb(new_table_items)
        return new_table_items
    except Exception as e:
        log.error(f"Error fetching and saving metrics: {e}")
        return None


# https://docs.qq.com/doc/DSkhFcHRIVmdaU1RC
def build_report_metric_params_for_tencent(domain_name, protocol, metric_name, report_value, event_time):
    tags = {"domain": domain_name, "path": '', "my1_provider": "AWS", "isp": 'AWS', "business": "IEG", "bg": "TEG",
            "protocol_type": protocol, "event_time": event_time}
    param_item = {"metric": metric_name, "value": report_value, "tags": tags}
    return param_item


def build_report_metrics_params_for_tencent(table_items):
    try:
        report_count = 0
        report_data = []
        request_metric_map = {}
        byte_download_metric_map = {}
        cache_hit_rate_metric_map = {}
        for item in table_items:
            if "metricId" not in item and "timestamp" not in item or "metricData" not in item:
                log.info(f"item data error{item}")
                continue
            if (not item["metricId"] or not item["timestamp"] or not item["metricData"]
                    or not item["metricData"]["reportValue"]):
                log.info(f"item data none error{item}")
                continue
            key_info = str(item["metricId"]).split("|")
            if len(key_info) != 4:
                log.info(f"key_info data error{item}")
                continue
            if not item["metricData"]["reportValue"]:
                log.info(f"key_info metricData error{item}")
                continue
            domain_name = key_info[1]
            protocol = key_info[2]
            metric_name = key_info[3]
            report_value = float(item["metricData"]["reportValue"])
            cal_map_key = f'{domain_name}|{protocol}|{metric_name.lower()}|{item["timestamp"]}'
            if metric_name == METRIC_CACHE_HIT_RATE.lower():
                cache_hit_rate_metric_map[cal_map_key] = report_value
            elif metric_name == METRIC_REQUEST.lower():
                request_metric_map[cal_map_key] = report_value
            elif metric_name == METRIC_BYTE_DOWNLOAD.lower():
                byte_download_metric_map[cal_map_key] = report_value
            else:
                report_metric_name = METRIC_NAME_MAPS.get(metric_name)
                report_item = build_report_metric_params_for_tencent(domain_name, protocol,
                                                                     report_metric_name, report_value,
                                                                     item["timestamp"])
                report_data.extend(report_item)
        for key, value in cache_hit_rate_metric_map.items():
            if key in request_metric_map and request_metric_map[key]:
                request_metric = request_metric_map[key]
                cache_hit_rate_metric = cache_hit_rate_metric_map[key]
                requests_report_value = request_metric * (1 - cache_hit_rate_metric)
                key_info = key.split("|")
                domain_name = key_info[0]
                protocol = key_info[1]
                event_time = key_info[2]
                report_item = build_report_metric_params_for_tencent(domain_name, protocol,
                                                                     "total_hy_request", requests_report_value,
                                                                     event_time)
                report_data.extend(report_item)
            if key in byte_download_metric_map and byte_download_metric_map[key]:
                byte_download_metric = byte_download_metric_map[key]
                cache_hit_rate_metric = cache_hit_rate_metric_map[key]
                byte_download_report_value = byte_download_metric * (1 - cache_hit_rate_metric)
                key_info = key.split("|")
                domain_name = key_info[0]
                protocol = key_info[1]
                event_time = key_info[2]
                report_item = build_report_metric_params_for_tencent(domain_name, protocol,
                                                                     "total_flux_hy", byte_download_report_value,
                                                                     event_time)
                report_data.extend(report_item)
        param = {"app_mark": "1115_4108_down_waibao_7", "env": "prod", "report_cnt": report_count,
                 "report_data": report_data}
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
            event_time, "%Y-%m-%dT%H:%M")
        start_datetime = event_datetime - timedelta(minutes=PERIOD)
        end_datetime = event_datetime
        new_table_items = get_and_save_metrics(start_datetime, end_datetime)
        if new_table_items:
            try:
                request_params = build_report_metrics_params_for_tencent(new_table_items)
                if request_params:
                    response = requests.post(POST_URL, json=request_params, headers=HEADERS)
                    log.info(response.text)
            except Exception as e:
                log.error(f"Error post lambda error: {e}")
        response["data"] = new_table_items
    except Exception as e:
        log.error(f"Error handling lambda event: {e}")
    log.info("[lambda_handler] End")
    return response






