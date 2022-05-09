import concurrent.futures
import datetime
import json
import logging
import os
from urllib import parse

import boto3
import requests
import shortuuid
from botocore.exceptions import WaiterError

URL_SUFFIX = '.cloudfront.net'
DDB_TABLE_NAME = os.environ['DDB_TABLE_NAME']
THREAD_CONCURRENCY = int(os.environ['THREAD_CONCURRENCY'])
aws_region = os.environ['AWS_REGION']
sqs = boto3.client('sqs', region_name=aws_region)
dynamodb_client = boto3.resource('dynamodb', region_name=aws_region)
cf_client = boto3.client('cloudfront')
table = dynamodb_client.Table(DDB_TABLE_NAME)

log = logging.getLogger()
log.setLevel('INFO')


def gen_pop_url(parsed_url, pop, cf_domain_prefix):
    return 'http://' + cf_domain_prefix + '.' + pop + '.cloudfront.net' + parsed_url.path + parsed_url.query + parsed_url.fragment


def replace_url(parsed_url, cf_domain):
    parsed_url = parsed_url._replace(netloc=cf_domain)

    return parsed_url


def get_cf_domain_prefix(parsed_url):
    return parsed_url.netloc.replace(URL_SUFFIX, '')


def invalidate_cf_cache(dist_id, url):
    parsed_url_list = []
    parsed_url = parse.urlsplit(url)
    parsed_url_list.append(
        parsed_url.path + parsed_url.query + parsed_url.fragment)

    log.info(parsed_url_list)
    response = cf_client.create_invalidation(
        DistributionId=dist_id,
        InvalidationBatch={
            'Paths': {
                'Quantity': len(parsed_url_list),
                'Items': parsed_url_list
            },
            'CallerReference': str(int(datetime.datetime.utcnow().timestamp())) + shortuuid.uuid()[:5]
        }
    )

    log.info(str(response))
    return response


def cf_invalidation_status(dist_id, inv_id):
    try:
        waiter = cf_client.get_waiter('invalidation_completed')
        waiter.wait(
            DistributionId=dist_id,
            Id=inv_id,
            WaiterConfig={
                'Delay': 4,
                'MaxAttempts': 120
            }
        )
    except WaiterError as e:
        log.error('Invalidation fail: ' + str(e))

    log.info('CloudFront invalidation completed')


def pre_warm(url, pop, cf_domain):
    try:
        resp = requests.get(url=url, headers={'Host': cf_domain})
        log.info(f'Prewarm started, PoP: {pop}, Url: {url}, response: {resp}')

        return {
            'pop': pop,
            'statusCode': resp.status_code
        }
    except Exception as e:
        log.info(f'Failed: PoP => {pop}, Url => {url} with exception => {e}')
        log.info(str(e))

        return {
            'pop': pop,
            'statusCode': -1
        }


def lambda_handler(event, context):
    log.info(str(event))

    for record in event['Records']:
        event_body = json.loads(record['body'])
        url = event_body['url']
        cf_domain = event_body['domain']
        pop_list = event_body['pop']
        req_id = event_body['reqId']
        dist_id = event_body['distId']
        create_time = event_body['create_time']
        success_list = []
        failure_list = []

        parsed_url = parse.urlsplit(url)
        # replace url according to cf_domain
        parsed_url = replace_url(parsed_url, cf_domain)
        cf_domain_prefix = get_cf_domain_prefix(parsed_url)

        # invalidate CloudFront cache
        if len(dist_id) > 0:
            inv_resp = invalidate_cf_cache(dist_id, url)
            cf_invalidation_status(dist_id, inv_resp['Invalidation']['Id'])

        with concurrent.futures.ThreadPoolExecutor(THREAD_CONCURRENCY) as executor:
            futures = []
            for pop in pop_list:
                pop = pop.strip()
                target_url = gen_pop_url(parsed_url, pop, cf_domain_prefix)
                futures.append(executor.submit(
                    pre_warm, target_url, pop, cf_domain))

            for future in concurrent.futures.as_completed(futures):
                log.info(future.result())
                if future.result()['statusCode'] == 200:
                    success_list.append(future.result()['pop'])
                else:
                    failure_list.append(future.result()['pop'])

        if len(success_list) == len(pop_list):
            url_status = 'SUCCESS'
        else:
            url_status = 'FAIL'

        table_item = {
            "createTime": create_time,
            "status": url_status,
            "success": success_list,
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
