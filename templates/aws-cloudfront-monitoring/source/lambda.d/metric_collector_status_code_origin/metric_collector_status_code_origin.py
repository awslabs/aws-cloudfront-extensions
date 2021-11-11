import json
import logging
from datetime import datetime
from datetime import timedelta
import boto3
from metric_helper import get_athena_query_result
from metric_helper import gen_detailed_by_interval

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
    metric = "statusCodeOrigin"

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
            row_count = 0
            item_query_value = []
            result_rows = item_query_result['ResultSet']['Rows']
            for data in result_rows:
                if (data["Data"][0]["VarCharValue"] != "sc-status"):
                    row_count += 1
                    status_code_row = {}
                    status_code_row["StatusCode"] = data["Data"][0][
                        "VarCharValue"]
                    status_code_row["Count"] = data["Data"][1]["VarCharValue"]
                    item_query_value.append(status_code_row)
            if row_count != 0:
                table_item = {
                    'metricId': metric + '-' + domain,
                    'timestamp': queryItem['Time'],
                    'metricData': item_query_value
                }
                log.info(json.dumps(table_item))
                table = dynamodb.Table("CloudFrontMetrics")
                ddb_response = table.put_item(Item=table_item)
                log.info(json.dumps(table_item))
                log.info(str(ddb_response))

    except Exception as error:
        log.error(str(error))

    log.info('[lambda_handler] End')
    return response
