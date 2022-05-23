import datetime
import json
import logging
import os
import time
from urllib import parse

import boto3
import shortuuid
from botocore.exceptions import ClientError

QUEUE_URL = os.environ['SQS_QUEUE_URL']
DDB_TABLE_NAME = os.environ['DDB_TABLE_NAME']
aws_region = os.environ['AWS_REGION']
INV_WAIT_TIME = int(os.environ['INV_WAIT_TIME'])
sqs = boto3.client('sqs', region_name=aws_region)
dynamodb_client = boto3.resource('dynamodb', region_name=aws_region)
cf_client = boto3.client('cloudfront')
table = dynamodb_client.Table(DDB_TABLE_NAME)

log = logging.getLogger()
log.setLevel('INFO')


def send_msg(queue_url, url, domain, pop, req_id, create_time, dist_id, inv_id):
    response = sqs.send_message(
        QueueUrl=queue_url,
        MessageBody=json.dumps(
            {
                'create_time': create_time,
                'url': url,
                'domain': domain,
                'pop': pop,
                'reqId': req_id,
                'distId': dist_id,
                'invId': inv_id
            }
        )
    )

    return response


def invalidate_cf_cache(dist_id, url):
    parsed_url_list = []
    parsed_url = parse.urlsplit(url)
    parsed_url_list.append(
        parsed_url.path + parsed_url.query + parsed_url.fragment)

    log.info(parsed_url_list)
    try:
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
    except ClientError as e:
        log.error('Create invalidation fail: ' + str(e))

        return False


def compose_error_response(message):
    return {
        "statusCode": 400,
        "body": json.dumps({
            "message": message
        })
    }


def lambda_handler(event, context):
    url_list = event['url_list']
    cf_domain = event['cf_domain']
    pop_region = event['pop_region']
    create_time = event['create_time']
    dist_id = event['dist_id']
    req_id = event['req_id']
    # Indicate invalidation is failed to create
    inv_id = 'CreateInvalidationError'
    inv_mapping = {}

    if len(dist_id) > 0:
        for url in url_list:
            inv_resp = invalidate_cf_cache(dist_id, url)
            if inv_resp != False:
                inv_id = inv_resp['Invalidation']['Id']
            inv_mapping[url] = inv_id
            # To avoid exceeding create invalidation rate
            time.sleep(INV_WAIT_TIME)

    for url in url_list:
        if url in inv_mapping:
            send_msg(QUEUE_URL, url, cf_domain, pop_region,
                     req_id, create_time, dist_id, inv_id)
        else:
            # No dist id found
            send_msg(QUEUE_URL, url, cf_domain, pop_region,
                     req_id, create_time, dist_id, None)

    return {
        "statusCode": 200,
        "body": "Messages sent to SQS"
    }
