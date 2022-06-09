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
        event_time, "%Y-%m-%dT%H:%M:%SZ") - timedelta(minutes=60)
    start_datetime = event_datetime - timedelta(minutes=5)

    start_time = start_datetime.strftime("%Y-%m-%d %H:%M:%S")
    end_time = event_datetime.strftime("%Y-%m-%d %H:%M:%S")
    # domain_list = get_domain_list()
    metric = "statusCode"

    try:
        gen_data = {}
        gen_data = gen_detailed_by_interval(metric, start_time, end_time,
                                            athena_client, DB_NAME,
                                            GLUE_TABLE_NAME, ATHENA_QUERY_OUTPUT)

        for queryItem in gen_data['Detail']:
            log.info(json.dumps(queryItem))
            log.info(queryItem['QueryId'])
            item_query_result = get_athena_query_result(
                athena_client, queryItem['QueryId'])

            status_code_dict = {}
            result_rows = item_query_result['ResultSet']['Rows']
            for i in range(1, len(result_rows)):
                if result_rows[i]['Data'][0].get(
                        'VarCharValue') != None:
                    status_code_row = {}
                    status_code_row['StatusCode'] = result_rows[i]['Data'][0]['VarCharValue']
                    status_code_row['Count'] = result_rows[i]['Data'][1]['VarCharValue']
                    domain = result_rows[i]['Data'][2]['VarCharValue']

                    if domain in status_code_dict.keys():
                        status_code_dict[domain].append(status_code_row)
                    else:
                        item_query_value = []
                        item_query_value.append(status_code_row)
                        status_code_dict[domain] = item_query_value

            # Skip if no value
            if len(status_code_dict) != 0:
                for status_code_key in status_code_dict.keys():
                    table_item = {
                        'metricId': metric + '-' + status_code_key,
                        'timestamp': int(queryItem['Time']),
                        'metricData': status_code_dict[status_code_key]
                    }
                    table = dynamodb.Table(DDB_TABLE_NAME)
                    ddb_response = table.put_item(Item=table_item)
                    log.info(json.dumps(table_item))
                    log.info(str(ddb_response))

    except Exception as error:
        log.error(str(error))

    log.info('[lambda_handler] End')
    return response
