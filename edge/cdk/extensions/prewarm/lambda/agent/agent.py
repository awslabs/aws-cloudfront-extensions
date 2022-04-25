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


def pre_warm(url, pop, cf_domain):
    try:
        resp = requests.get(url=url, headers={'Host': cf_domain})
        log.info(f'Prewarm started, PoP: {pop}, Url: {url}, response: {resp}')

        return resp.status_code
    except Exception as e:
        log.info(f'Failed: PoP => {pop}, Url => {url} with exception => {e}')

        return -1


def lambda_handler(event, context):
    log.info(str(event))

    for record in event['Records']:
        event_body = json.loads(record['body'])
        url = event_body['url']
        cf_domain = event_body['domain']
        pop_list = event_body['pop']
        req_id = event_body['reqId']
        create_time = event_body['create_time']
        success_list = []
        failure_list = []

        parsed_url = parse.urlsplit(url)
        # replace url according to cf_domain
        parsed_url = replace_url(parsed_url, cf_domain)
        cf_domain_prefix = get_cf_domain_prefix(parsed_url)

        for pop in pop_list:
            pop = pop.strip()
            target_url = gen_pop_url(parsed_url, pop, cf_domain_prefix)
            prewarm_status_code = pre_warm(target_url, pop, cf_domain)
            if prewarm_status_code == 200:
                success_list.append(pop)
            else:
                failure_list.append(pop)

        if len(success_list) == len(pop_list):
            url_status = 'SUCCESS'
        else:
            url_status = 'FAIL'

        table_item = {
            "createTime": create_time,
            "status": url_status,
            "failure": failure_list,
            "reqId": req_id,
            "url": url
        }
        table.put_item(Item=table_item)

    return {
        "statusCode": 200,
        "body": json.dumps({
            "reqId": req_id
        })
    }
