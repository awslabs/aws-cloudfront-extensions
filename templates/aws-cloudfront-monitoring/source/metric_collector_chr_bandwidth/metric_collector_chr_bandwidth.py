import json
import logging
from datetime import datetime
from datetime import timedelta
import boto3
from lib.metric_helper import get_athena_query_result
from lib.metric_helper import gen_detailed_by_interval

ATHENA_QUERY_OUTPUT = "<s3 path>"
athena_client = boto3.client('athena')
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
DB_NAME = "<db name>"
TABLE_NAME = "<table name>"

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
    event_datetime = datetime.strptime(event_time, "%Y-%m-%dT%H:%M:%SZ")
    start_datetime = event_datetime - timedelta(minutes=20)

    start_time = start_datetime.strftime("%Y-%m-%d %H:%M:%S")
    end_time = event_datetime.strftime("%Y-%m-%d %H:%M:%S")
    domain = "<domain>"
    metric = "chrBandWith"

    try:
        gen_data = {}
        gen_data = gen_detailed_by_interval(metric, start_time, end_time,
                                            domain, athena_client, DB_NAME,
                                            TABLE_NAME, ATHENA_QUERY_OUTPUT)

        for queryItem in gen_data['Detail']:
            log.info(json.dumps(queryItem))
            log.info(queryItem['QueryId'])
            log.info(queryItem['Time'])
            item_query_result = get_athena_query_result(
                athena_client, queryItem['QueryId'])

            item_query_value = 0
            if item_query_result['ResultSet']['Rows'][1]['Data'][0].get(
                    'VarCharValue') != None:
                item_query_value = item_query_result['ResultSet']['Rows'][1][
                    'Data'][0]['VarCharValue']

            table_item = {
                'metricId': metric + '-' + domain,
                'timestamp': queryItem['Time'],
                'metricData': item_query_value
            }
            table = dynamodb.Table("CloudFrontMetrics")
            ddb_response = table.put_item(Item=table_item)
            log.info(json.dumps(table_item))
            log.info(str(ddb_response))

    except Exception as error:
        log.error(str(error))

    log.info('[lambda_handler] End')
    return response
