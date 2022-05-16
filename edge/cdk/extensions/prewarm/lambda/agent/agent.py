import concurrent.futures
import datetime
import json
import logging
import os
from urllib import parse

import boto3
import requests
from botocore.exceptions import ClientError, WaiterError

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
        log.info('CloudFront invalidation completed')

        return True
    except WaiterError as we:
        log.error('Get invalidation status fail: ' + str(we))

        return False
    except Exception as ex:
        log.error('Get invalidation status fail: ' + str(ex))

        return False


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
        inv_id = event_body['invId']
        success_list = []
        failure_list = []

        parsed_url = parse.urlsplit(url)
        # replace url according to cf_domain
        parsed_url = replace_url(parsed_url, cf_domain)
        cf_domain_prefix = get_cf_domain_prefix(parsed_url)
        invalidation_result = True

        # invalidate CloudFront cache
        if inv_id != None:
            if inv_id == 'CreateInvalidationError':
                invalidation_result = False
            else:
                invalidation_result = cf_invalidation_status(dist_id, inv_id)

        if invalidation_result:
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
        else:
            # Fail to create invalidation or check invalidation status
            url_status = 'FAIL'

        table_item = {
            "createTime": create_time,
            "status": url_status,
            "success": success_list,
            "failure": failure_list,
            "reqId": req_id,
            "url": url
        }
        log.info(table_item)
        ddb_resp = table.put_item(Item=table_item)
        log.info(ddb_resp)

    return {
        "statusCode": 200,
        "body": json.dumps({
            "reqId": req_id
        })
    }
