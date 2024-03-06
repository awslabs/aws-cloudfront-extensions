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
# {'www.amazon.com': 'a12345.cloudfront.net'}
cname_mapping = {}
dist_mapping = {}

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


def dist_match(distribution, url_netloc, is_cf_domain):
    result = {'dist_id': '', 'cf_domain': ''}
    dist_domain_name = distribution['DomainName']
    dist_aliases = distribution['Aliases']
    dist_id = distribution['Id']
    if is_cf_domain:
        if dist_domain_name == url_netloc:
            result['cf_domain'] = dist_domain_name
            result['dist_id'] = dist_id
            log.info('The cloudfront domain name is ' +
                     dist_domain_name)
            log.info('The cloudfront distribution id is ' + dist_id)
            return result
    elif dist_aliases['Quantity'] != 0:
        for alias in dist_aliases['Items']:
            if alias == url_netloc:
                log.info('The cloudfront domain name is ' +
                         dist_domain_name)
                log.info('The cloudfront distribution id is ' + dist_id)
                cname_mapping[url_netloc] = dist_domain_name
                dist_mapping[url_netloc] = dist_id
                result['cf_domain'] = dist_domain_name
                result['dist_id'] = dist_id
                return result

    return result


def cf_domain_from_cname(url):
    parsed_url = parse.urlsplit(url)
    url_netloc = parsed_url.netloc
    is_cf_domain = False
    result = {'dist_id': '', 'cf_domain': ''}

    # The url has been processed
    if url_netloc in cname_mapping:
        result['cf_domain'] = cname_mapping[url_netloc]
    if url_netloc in dist_mapping:
        result['dist_id'] = dist_mapping[url_netloc]

    # The domain is CloudFront domain name
    if url_netloc.endswith('cloudfront.net'):
        is_cf_domain = True
        result['cf_domain'] = url_netloc

    if len(result['dist_id']) > 0 and len(result['cf_domain']) > 0:
        return result

    # Get CloudFront domain name and dist id
    list_distributions_response = cf_client.list_distributions(
        MaxItems='200')
    list_distributions = list_distributions_response['DistributionList']
    for distribution in list_distributions['Items']:
        result = dist_match(distribution, url_netloc, is_cf_domain)
        if len(result['dist_id']) > 0 and len(result['cf_domain']) > 0:
            return result

    while list_distributions['IsTruncated'] is True:
        if list_distributions['Quantity'] != 0:
            for distribution in list_distributions['Items']:
                result = dist_match(distribution, url_netloc, is_cf_domain)
                if len(result['dist_id']) > 0 and len(result['cf_domain']) > 0:
                    return result

        next_marker = list_distributions['NextMarker']
        list_distributions_response = cf_client.list_distributions(
            Marker=next_marker, MaxItems='200')
        list_distributions = list_distributions_response[
            'DistributionList']

    raise Exception('No cloudfront domain name is found for ' + url)


def find_dist_id(cf_domain, domain_key):
    try:
        distributions = cf_client.list_distributions()
        distribution_id = list(filter(
            lambda d: cf_domain == d[domain_key], distributions['DistributionList']['Items']))[0]['Id']
        log.info('Distribution id: ' + distribution_id)
    except Exception as e:
        log.error('Fail to find distribution with domain name: ' +
                  cf_domain + ', error details: ' + str(e))
        return ''

    return distribution_id


def lambda_handler(event, context):
    url_list = event['url_list']
    url_list = list(set(url_list))
    HAS_CF_DOMAIN_PARA = False
    if event['cf_domain'] is not None:
        cf_domain = event['cf_domain']
        HAS_CF_DOMAIN_PARA = True
    pop_region = event['pop_region']
    create_time = event['create_time']
    req_id = event['req_id']
    # Indicate invalidation is failed to create
    inv_id = 'CreateInvalidationError'
    inv_mapping = {}

    if HAS_CF_DOMAIN_PARA:
        dist_id = find_dist_id(cf_domain, 'DomainName')

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
    else:
        for url in url_list:
            inv_mapping[url] = None
            cf_info = cf_domain_from_cname(url)
            dist_id = cf_info['dist_id']
            url_domain = cf_info['cf_domain']
            if len(dist_id) > 0:
                inv_resp = invalidate_cf_cache(dist_id, url)
                if inv_resp != False:
                    inv_id = inv_resp['Invalidation']['Id']
                inv_mapping[url] = inv_id
                # To avoid exceeding create invalidation rate
                time.sleep(INV_WAIT_TIME)
            # inv_id is None if no dist id found
            send_msg(QUEUE_URL, url, url_domain, pop_region,
                     req_id, create_time, dist_id, inv_mapping[url])

    return {
        "statusCode": 200,
        "body": "Messages sent to SQS"
    }
