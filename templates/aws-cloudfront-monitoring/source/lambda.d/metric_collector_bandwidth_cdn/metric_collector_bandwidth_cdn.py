import json
import logging
from datetime import datetime
from datetime import timedelta
import boto3
import os
from metric_helper import get_athena_query_result
from metric_helper import gen_detailed_by_interval

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
    event_datetime = datetime.strptime(event_time, "%Y-%m-%dT%H:%M:%SZ")
    start_datetime = event_datetime - timedelta(minutes=20)

    start_time = start_datetime.strftime("%Y-%m-%d %H:%M:%S")
    end_time = event_datetime.strftime("%Y-%m-%d %H:%M:%S")

    domain_list_env = os.getenv('DOMAIN_LIST')
    domain_list = [] 
    if domain_list_env == "ALL":
        cf_client = boto3.client('cloudfront')
        list_distributions_response = cf_client.list_distributions()
        list_distributions = list_distributions_response['DistributionList']

        if list_distributions['Quantity'] != 0:
            for distribution in list_distributions['Items']:
                dist_domain_name = distribution['DomainName']
                domain_list.append(dist_domain_name)
    else:
        domain_list = os.getenv('DOMAIN_LIST').split(",")
    metric = "bandwidth"

    for domain in domain_list:
        domain = domain.strip()
        try:
            gen_data = {}
            gen_data = gen_detailed_by_interval(metric, start_time, end_time,
                                                domain, athena_client, DB_NAME,
                                                GLUE_TABLE_NAME, ATHENA_QUERY_OUTPUT)

            for queryItem in gen_data['Detail']:
                log.info(json.dumps(queryItem))
                log.info(queryItem['QueryId'])
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
                table = dynamodb.Table(DDB_TABLE_NAME)
                ddb_response = table.put_item(Item=table_item)
                log.info(json.dumps(table_item))
                log.info(str(ddb_response))

        except Exception as error:
            log.error(str(error))

    log.info('[lambda_handler] End')
    return response
