import json
import logging
from datetime import datetime
from datetime import timedelta
from decimal import Decimal
import boto3
from metric_helper import get_athena_query_result
from metric_helper import format_date_time
from metric_helper import assemble_query

ATHENA_QUERY_OUTPUT = "<s3 path>"
athena_client = boto3.client('athena')
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
DB_NAME = "<db name>"
TABLE_NAME = "<table name>"
INTERVAL = 5

log = logging.getLogger()
log.setLevel('INFO')

SPEED_DICT = {
    "250K": 256000,
    "500K": 512000,
    "750K": 768000,
    "1M": 1048576,
    "2M": 2097152,
    "3M": 3145728,
    "4M": 4194304
}


def schedule_athena_query(query_string):
    log.info('[schedule_athena_query] Start')
    log.info("[schedule_athena_query] Query string: " + query_string)

    response = athena_client.start_query_execution(
        QueryString=query_string,
        QueryExecutionContext={'Database': DB_NAME},
        ResultConfiguration={
            'OutputLocation': ATHENA_QUERY_OUTPUT,
            'EncryptionConfiguration': {
                'EncryptionOption': 'SSE_S3'
            }
        },
        WorkGroup="primary")

    log.info('[schedule_athena_query] End')
    return response


def assemble_speed(metric, start_time, end_time, domain):
    log.info('[assemble_query_string] Start')
    # Dynamically build query string using partition
    query_string = 'SELECT "sc-bytes"/"time-taken" as speed, "country-name", isp FROM "' + DB_NAME + '"."' + TABLE_NAME + '" WHERE '
    query_string = assemble_query(start_time, end_time, query_string)
    query_string += ' AND "cs-host" = \'' + domain + '\' AND timestamp <= ' + str(
        format_date_time(end_time)
    ) + ' AND timestamp > ' + str(
        format_date_time(start_time)
    ) + ' AND "x-edge-response-result-type" <> \'LimitExceeded\' AND "x-edge-response-result-type" <> \'CapacityExceeded\' AND "x-edge-response-result-type" <> \'Error\' AND "x-edge-response-result-type" <> \'Redirect\';'

    log.info('[assemble_query_string] End')
    return query_string


def count_by_speed(value, res):
    float_value = float(value)
    if float_value < SPEED_DICT['250K']:
        res['250K'] += 1
    elif float_value >= SPEED_DICT['250K'] and float_value < SPEED_DICT['500K']:
        res['500K'] += 1
    elif float_value >= SPEED_DICT['500K'] and float_value < SPEED_DICT['750K']:
        res['750K'] += 1
    elif float_value >= SPEED_DICT['750K'] and float_value < SPEED_DICT['1M']:
        res['1M'] += 1
    elif float_value >= SPEED_DICT['1M'] and float_value < SPEED_DICT['2M']:
        res['2M'] += 1
    elif float_value >= SPEED_DICT['2M'] and float_value < SPEED_DICT['3M']:
        res['3M'] += 1
    elif float_value >= SPEED_DICT['3M'] and float_value < SPEED_DICT['4M']:
        res['4M'] += 1
    else:
        res['Other'] += 1

    return res


# Generate detailed data according to start time, end time and interval
def gen_detailed_by_interval(metric, start_time, end_time, domain):
    interval_list = []
    start_datetime = datetime.strptime(start_time, "%Y-%m-%d %H:%M:%S")
    end_datetime = datetime.strptime(end_time, "%Y-%m-%d %H:%M:%S")
    temp_datetime = start_datetime
    detailed_data = []

    while True:
        log.info("[gen_detailed_by_interval] Setup interval list")
        interval_item = {}
        interval_item['start'] = temp_datetime.strftime("%Y-%m-%d %H:%M:%S")
        temp_datetime += timedelta(minutes=5)
        if not temp_datetime < end_datetime:
            interval_item['end'] = end_datetime.strftime("%Y-%m-%d %H:%M:%S")
            athena_qs = assemble_speed(metric, interval_item['start'],
                                       interval_item['end'], domain)
            athena_query_result = schedule_athena_query(athena_qs)
            interval_item['QueryId'] = athena_query_result['QueryExecutionId']
            interval_list.append(interval_item)
            break
        interval_item['end'] = temp_datetime.strftime("%Y-%m-%d %H:%M:%S")
        athena_qs_5m = assemble_speed(metric, interval_item['start'],
                                      interval_item['end'], domain)
        athena_query_result_5m = schedule_athena_query(athena_qs_5m)
        interval_item['QueryId'] = athena_query_result_5m['QueryExecutionId']
        interval_list.append(interval_item)

    for item in interval_list:
        log.info("[gen_detailed_by_interval] Start to get query result")
        speed_item = {}
        speed_item["domain"] = domain

        geo_info = {}
        query_result = get_athena_query_result(athena_client, item['QueryId'])
        log.info(json.dumps(query_result))
        speed_item["timestamp"] = str(int(format_date_time(item['end'])))

        for row in query_result['ResultSet']['Rows']:
            if row['Data'][0]['VarCharValue'] != "speed":
                row_speed = row['Data'][0]['VarCharValue']
                row_country = row['Data'][1]['VarCharValue']
                row_isp = row['Data'][2]['VarCharValue']

                if row_country not in speed_item:
                    isp_json = {
                        "250K": 0,
                        "500K": 0,
                        "750K": 0,
                        "1M": 0,
                        "2M": 0,
                        "3M": 0,
                        "4M": 0,
                        "Other": 0
                    }
                    country_json = {}
                    isp_json = count_by_speed(row_speed, isp_json)
                    country_json[row_isp] = isp_json
                    speed_item[row_country] = country_json
                else:
                    if row_isp not in speed_item[row_country]:
                        isp_json = {
                            "250K": 0,
                            "500K": 0,
                            "750K": 0,
                            "1M": 0,
                            "2M": 0,
                            "3M": 0,
                            "4M": 0,
                            "Other": 0
                        }
                        isp_json = count_by_speed(row_speed, isp_json)
                        speed_item[row_country][row_isp] = isp_json
                    else:
                        speed_item[row_country][row_isp] = count_by_speed(
                            row_speed, speed_item[row_country][row_isp])

        for value in speed_item:
            if value != "domain" and value != "timestamp":
                for isp_item in speed_item[value]:
                    temp = speed_item[value][isp_item]
                    total = temp["250K"] + temp["500K"] + temp["750K"] + temp[
                        "1M"] + temp["2M"] + temp["3M"] + temp["4M"] + temp[
                            "Other"]
                    speed_item[value][isp_item]["250K"] = Decimal(
                        temp["250K"] / total).quantize(Decimal('0.00'))
                    speed_item[value][isp_item]["500K"] = Decimal(
                        temp["500K"] / total).quantize(Decimal('0.00'))
                    speed_item[value][isp_item]["750K"] = Decimal(
                        temp["750K"] / total).quantize(Decimal('0.00'))
                    speed_item[value][isp_item]["1M"] = Decimal(
                        temp["1M"] / total).quantize(Decimal('0.00'))
                    speed_item[value][isp_item]["2M"] = Decimal(
                        temp["2M"] / total).quantize(Decimal('0.00'))
                    speed_item[value][isp_item]["3M"] = Decimal(
                        temp["3M"] / total).quantize(Decimal('0.00'))
                    speed_item[value][isp_item]["4M"] = Decimal(
                        temp["4M"] / total).quantize(Decimal('0.00'))
                    speed_item[value][isp_item]["Other"] = Decimal(
                        temp["Other"] / total).quantize(Decimal('0.00'))

        detailed_data.append(speed_item)

    log.info("[gen_detailed_by_interval] Generated data: ")
    log.info(str(detailed_data))

    return detailed_data


def lambda_handler(event, context):
    log.info('[lambda_handler] Start')
    log.info('[lambda_handler] Event ' + json.dumps(event))

    response = {
        "isBase64Encoded": "false",
        "headers": {
            "Content-Type": "application/json"
        }
    }

    event_time = event["time"]
    event_datetime = datetime.strptime(event_time, "%Y-%m-%dT%H:%M:%SZ")
    start_datetime = event_datetime - timedelta(minutes=20)

    start_time = start_datetime.strftime("%Y-%m-%d %H:%M:%S")
    end_time = event_datetime.strftime("%Y-%m-%d %H:%M:%S")
    domain = "<domain>"
    metric = "downloadSpeed"

    try:
        gen_data = {}
        gen_data = gen_detailed_by_interval(metric, start_time, end_time,
                                            domain)

        for data_item in gen_data:
            has_value = False
            for key in data_item:
                if key != "timestamp" and key != "domain":
                    has_value = True
                    break
            if has_value is True:
                table_item = {
                    'metricId': metric + '-' + domain,
                    'timestamp': data_item["timestamp"],
                    'metricData': data_item
                }
                table = dynamodb.Table("CloudFrontMetrics")
                ddb_response = table.put_item(Item=table_item)
                log.info(str(table_item))
                log.info(str(ddb_response))

    except Exception as error:
        log.error(str(error))

    log.info('[lambda_handler] End')
    return response
