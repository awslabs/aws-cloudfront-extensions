import datetime
import json
import logging
import os

import boto3

QUEUE_URL = os.environ['SQS_QUEUE_URL']
DDB_TABLE_NAME = os.environ['DDB_TABLE_NAME']
APAC_NODE = ['BOM51-C1', 'BOM52-C1', 'ICN51-C1', 'ICN54-C2',
             'NRT51-P2', 'NRT57-P3', 'SIN2-P1', 'SIN52-C2']
AU_NODE = ['SYD1-C1', 'SYD62-P1']
CA_NODE = ['YUL62-C2', 'YUL62-C1']
EU_NODE = ['ARN56-P1', 'ARN54-C1', 'CDG50-P1', 'CDG52-P2', 'DUB2-C1',
           'DUB56-P1', 'FRA56-P4', 'FRA60-P1', 'LHR61-P3', 'LHR50-P2']
JP_NODE = ['NRT51-P2', 'NRT57-P3']
SA_NODE = ['GRU1-C2', 'GRU3-P1']
US_NODE = ['IAD89-P1', 'IAD89-P2', 'SFO5-P2',
           'SFO5-P1', 'DFW56-P1', 'DFW56-P2']
CN_NODE = ['PVG52-E1', 'SZX51-E1', 'BJS9-E1', 'ZHY50-E1']

ALL_POP = list(set(APAC_NODE + AU_NODE + CA_NODE +
               EU_NODE + JP_NODE + SA_NODE + US_NODE))
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
cf_client = boto3.client('cloudfront')
table = dynamodb_client.Table(DDB_TABLE_NAME)

log = logging.getLogger()
log.setLevel('INFO')


def send_msg(queue_url, url, domain, pop, req_id, create_time, dist_id):
    response = sqs.send_message(
        QueueUrl=queue_url,
        MessageBody=json.dumps(
            {
                'create_time': create_time,
                'url': url,
                'domain': domain,
                'pop': pop,
                'reqId': req_id,
                'distId': dist_id
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


def find_dist_id(cf_domain):
    distributions = cf_client.list_distributions()
    try:
        distribution_id = list(filter(
            lambda d: cf_domain == d['DomainName'], distributions['DistributionList']['Items']))[0]['Id']
        log.info('Distribution id: ' + distribution_id)
    except IndexError as e:
        log.error('Fail to find distribution with domain name: ' +
                  cf_domain + ', error details: ' + str(e))
        return ''

    return distribution_id


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

    dist_id = find_dist_id(cf_domain)
    for url in url_list:
        write_in_ddb(req_id, url_list, pop_region)
        send_msg(QUEUE_URL, url, cf_domain, pop_region,
                 req_id, current_time, dist_id)

    return {
        "statusCode": 200,
        "body": json.dumps({
            "requestID": req_id
        })
    }
