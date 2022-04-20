import json
import logging
import os
from urllib import parse

import boto3
import requests

URL_SUFFIX = '.cloudfront.net'
DDB_TABLE_NAME = os.environ['DDB_TABLE_NAME']
aws_region = os.environ['AWS_REGION']
sqs = boto3.client('sqs', region_name=aws_region)
dynamodb_client = boto3.resource('dynamodb', region_name=aws_region)
table = dynamodb_client.Table(DDB_TABLE_NAME)

log = logging.getLogger()
log.setLevel('INFO')


def gen_pop_url(parsed_url, pop, cf_domain_prefix):
    return 'http://' + cf_domain_prefix + '.' + pop + '.cloudfront.net' + parsed_url.path + parsed_url.query


def replace_url(parsed_url, cf_domain):
    parsed_url = parsed_url._replace(netloc=cf_domain)

    return parsed_url


def get_cf_domain_prefix(parsed_url):
    return parsed_url.netloc.replace(URL_SUFFIX, '')


def pre_warm(url, pop, req_id, origin_url, cf_domain, create_time):
    try:
        resp = requests.get(url=url, headers={'Host': cf_domain})
        if resp.status_code == 200:
            table_item = {
                "createTime": create_time,
                "status": "SUCCESS",
                "statusCode": resp.status_code,
                "reqId": req_id,
                "url": origin_url
            }
        else:
            table_item = {
                "createTime": create_time,
                "status": "FAIL",
                "statusCode": resp.status_code,
                "reqId": req_id,
                "url": origin_url
            }
    except Exception as e:
        log.info(f'Failed: PoP => {pop}, Url => {url} with exception => {e}')
        table_item = {
            "createTime": create_time,
            "status": "FAIL",
            "statusCode": -1,
            "reqId": req_id,
            "url": origin_url
        }
    finally:
        ddb_response = table.put_item(Item=table_item)
        log.info(ddb_response)


def lambda_handler(event, context):
    event_body = json.loads(event['Records'][0]['body'])
    url = event_body['url']
    cf_domain = event_body['domain']
    pop_list = event_body['pop']
    req_id = event_body['reqId']
    create_time = event_body['create_time']

    parsed_url = parse.urlsplit(url)
    # replace url according to cf_domain
    parsed_url = replace_url(parsed_url, cf_domain)
    cf_domain_prefix = get_cf_domain_prefix(parsed_url)

    for pop in pop_list:
        pop = pop.strip()
        target_url = gen_pop_url(parsed_url, pop, cf_domain_prefix)
        pre_warm(target_url, pop, req_id, url, cf_domain, create_time)

    return {
        "statusCode": 200,
        "body": json.dumps({
            "reqId": req_id
        })
    }
