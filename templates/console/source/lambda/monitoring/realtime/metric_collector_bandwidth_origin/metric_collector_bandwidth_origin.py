import json
import logging
from datetime import datetime
from datetime import timedelta
import boto3
import os
from metric_helper import get_athena_query_result, gen_detailed_by_interval, get_domain_list

ATHENA_QUERY_OUTPUT = "s3://" + os.environ['S3_BUCKET'] + "/athena_results/"
athena_client = boto3.client('athena')
dynamodb = boto3.resource('dynamodb', region_name=os.environ['REGION_NAME'])
DB_NAME = os.environ['GLUE_DATABASE_NAME']
DDB_TABLE_NAME = os.environ['DDB_TABLE_NAME']
GLUE_TABLE_NAME = os.environ['GLUE_TABLE_NAME']
M_INTERVAL = int(os.environ['INTERVAL'])

log = logging.getLogger()
log.setLevel('INFO')


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
    event_datetime = datetime.strptime(
        event_time, "%Y-%m-%dT%H:%M:%SZ") - timedelta(minutes=5)
    start_datetime = event_datetime - timedelta(minutes=M_INTERVAL)

    start_time = start_datetime.strftime("%Y-%m-%d %H:%M:%S")
    end_time = event_datetime.strftime("%Y-%m-%d %H:%M:%S")
    domain_list = get_domain_list()
    metric = "bandwidthOrigin"

    try:
        gen_data = {}
        gen_data = gen_detailed_by_interval(metric, start_time, end_time,
                                            athena_client, DB_NAME,
                                            GLUE_TABLE_NAME, ATHENA_QUERY_OUTPUT, M_INTERVAL)

        for queryItem in gen_data['Detail']:
            log.info(json.dumps(queryItem))
            log.info(queryItem['QueryId'])
            item_query_result = get_athena_query_result(
                athena_client, queryItem['QueryId'])

            temp_list = domain_list
            for i in range(1, len(item_query_result['ResultSet']['Rows'])):
                if item_query_result['ResultSet']['Rows'][i]['Data'][0].get(
                        'VarCharValue') != None:
                    item_query_value = item_query_result['ResultSet']['Rows'][i][
                        'Data'][0]['VarCharValue']
                    domain = item_query_result['ResultSet']['Rows'][i][
                        'Data'][1]['VarCharValue']

                    table_item = {
                        'metricId': metric + '-' + domain,
                        'timestamp': int(queryItem['Time']),
                        'metricData': item_query_value
                    }
                    table = dynamodb.Table(DDB_TABLE_NAME)
                    ddb_response = table.put_item(Item=table_item)
                    log.info(json.dumps(table_item))
                    log.info(str(ddb_response))

                    temp_list.remove(domain)

            for domain_item in temp_list:
                item_query_value = 0
                table_item = {
                    'metricId': metric + '-' + domain_item,
                    'timestamp': int(queryItem['Time']),
                    'metricData': item_query_value
                }
                table = dynamodb.Table(DDB_TABLE_NAME)
                ddb_response = table.put_item(Item=table_item)
                log.info(json.dumps(table_item))
                log.info(str(ddb_response))

    except Exception as error:
        log.error(str(error))

    log.info('[lambda_handler] End')
    return response
