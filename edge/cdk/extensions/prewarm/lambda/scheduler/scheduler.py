import datetime
import json
import logging
import os

import boto3

QUEUE_URL = os.environ['SQS_QUEUE_URL']
DDB_TABLE_NAME = os.environ['DDB_TABLE_NAME']
ALL_POP = ['ATL56-C1', 'DFW55-C3', 'SEA19-C3']
aws_region = os.environ['AWS_REGION']
sqs = boto3.client('sqs', region_name=aws_region)
dynamodb_client = boto3.resource('dynamodb', region_name=aws_region)
table = dynamodb_client.Table(DDB_TABLE_NAME)

log = logging.getLogger()
log.setLevel('INFO')


def send_msg(queue_url, url, domain, pop, req_id, create_time):
    response = sqs.send_message(
        QueueUrl=queue_url,
        MessageBody=json.dumps(
            {
                'create_time': create_time,
                'url': url,
                'domain': domain,
                'pop': pop,
                'reqId': req_id
            }
        )
    )

    return response


def write_in_ddb(req_id, url_list):
    table_item = {
        "urlList": url_list,
        "reqId": req_id,
        "url": 'metadata'
    }
    ddb_response = table.put_item(Item=table_item)
    log.info(table_item)
    log.info(ddb_response)


def return_error_response(message):
    return {
        "statusCode": 400,
        "body": json.dumps({
            "message": message
        })
    }


def lambda_handler(event, context):
    req_id = context.aws_request_id
    event_body = json.loads(event['body'])
    if 'body' not in event_body or \
        'url_list' not in event_body or \
        'cf_domain_mapping' not in event_body or \
            'region' not in event_body:
        return_error_response(
            'Please specify body, url_list, cf_domain_mapping and region in the request body')

    url_list = event_body['url_list']
    if len(url_list) == 0:
        return_error_response('Please specify at least 1 url in url_list')

    cf_domain = event_body['cf_domain']
    pop_region = event_body['region']
    current_time = datetime.datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")

    if type(pop_region) == str and pop_region.lower() == 'all':
        pop_region = ALL_POP
    elif len(pop_region) == 0:
        return_error_response(
            'Please specify at least 1 PoP node in region or use all to prewarm in all PoP nodes')

    for url in url_list:
        write_in_ddb(req_id, url_list)
        send_msg(QUEUE_URL, url, cf_domain, pop_region, req_id, current_time)

    return {
        "statusCode": 200,
        "body": json.dumps({
            "reqId": req_id
        })
    }
