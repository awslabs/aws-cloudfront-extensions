import datetime
import json
import logging
import os

import boto3

QUEUE_URL = os.environ['SQS_QUEUE_URL']
DDB_TABLE_NAME = os.environ['DDB_TABLE_NAME']
APAC_NODE = ['BOM-1A', 'BOM-1B', 'BOM-1C', 'ICN-2A', 'ICN-2B',
             'ICN-2C', 'NRT-1D', 'SIN-1A', 'SIN-1B', 'SIN-1C']
AU_NODE = ['SYD-2A', 'SYD-2B', 'SYD-2C']
CA_NODE = ['YUL-1A', 'YUL-1B']
EU_NODE = ['ARN-1A', 'ARN-1B', 'ARN-1C', 'CDG-3A', 'CDG-3B', 'CDG-3C', 'DUB-1A',
           'DUB-1B', 'DUB-1C', 'FRA-1A', 'FRA-1B', 'FRA-1C', 'LHR-2A', 'LHR-2B', 'LHR-2C']
JP_NODE = ['NRT-1A', 'NRT-1C']
SA_NODE = ['GRU-1A', 'GRU-1B', 'GRU-1C']
US_NODE = ['CMH-2A', 'CMH-2B', 'CMH-2C', 'IAD-1A', 'IAD-1B', 'IAD-1C', 'IAD-1D', 'IAD-1E',
           'M-PDX-2A', 'PDX-2A', 'PDX-2B', 'PDX-2C', 'SFO-1A', 'SFO-1B', 'SFO-1C', 'T-IAD-1C', 'T-IAD-1E']
ALL_POP = APAC_NODE + AU_NODE + CA_NODE + EU_NODE + JP_NODE + SA_NODE + US_NODE
pop_map = {
    'all': ALL_POP,
    'apac': APAC_NODE,
    'au': AU_NODE,
    'ca': CA_NODE,
    'eu': EU_NODE,
    'jp': JP_NODE,
    'sa': SA_NODE,
    'us': US_NODE
}

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


def write_in_ddb(req_id, url_list, pop):
    table_item = {
        "pop": pop,
        "urlList": url_list,
        "reqId": req_id,
        "url": 'metadata'
    }
    ddb_response = table.put_item(Item=table_item)
    log.info(table_item)
    log.info(ddb_response)


def compose_error_response(message):
    return {
        "statusCode": 400,
        "body": json.dumps({
            "message": message
        })
    }


def lambda_handler(event, context):
    req_id = context.aws_request_id
    event_body = json.loads(event['body'])
    if 'url_list' not in event_body or 'cf_domain' not in event_body or 'region' not in event_body:
        return compose_error_response(
            'Please specify url_list, cf_domain and region in the request body')

    url_list = event_body['url_list']
    if len(url_list) == 0:
        return compose_error_response('Please specify at least 1 url in url_list')

    cf_domain = event_body['cf_domain']
    pop_region = event_body['region']
    current_time = datetime.datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")

    if type(pop_region) == str:
        if pop_region.lower() not in pop_map.keys():
            return compose_error_response('Invalid region, please specify a valid region or PoP list or all')
        pop_region = pop_map[pop_region.lower()]
    elif len(pop_region) == 0:
        return compose_error_response(
            'Please specify at least 1 PoP node in region or use all to prewarm in all PoP nodes')

    for url in url_list:
        write_in_ddb(req_id, url_list, pop_region)
        send_msg(QUEUE_URL, url, cf_domain, pop_region, req_id, current_time)

    return {
        "statusCode": 200,
        "body": json.dumps({
            "requestID": req_id
        })
    }
