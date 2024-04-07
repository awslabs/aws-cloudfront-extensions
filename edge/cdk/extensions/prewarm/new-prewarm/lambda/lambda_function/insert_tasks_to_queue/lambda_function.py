import boto3
import json
import os
import datetime
import uuid
import concurrent.futures
from urllib import parse
from botocore.exceptions import ClientError
import shortuuid
import time

request_table_name = os.environ['REQUEST_TABLE_NAME']
pop_table_name = os.environ['POP_TABLE_NAME']
dynamodb = boto3.resource('dynamodb')
request_table = dynamodb.Table(request_table_name)
pop_table = dynamodb.Table(pop_table_name)
sqs_client = boto3.client('sqs')
s3 = boto3.client('s3')

INV_WAIT_TIME = 1
cf_client = boto3.client('cloudfront')
cname_mapping = {}
dist_mapping = {}


def invalidate_cf_cache(dist_id, url):
    parsed_url_list = []
    parsed_url = parse.urlsplit(url)
    parsed_url_list.append(
        parsed_url.path + parsed_url.query + parsed_url.fragment)

    print(parsed_url_list)
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
        print(str(response))

        return response
    except ClientError as e:
        print('Create invalidation fail: ' + str(e))
        return False


def dist_match(distribution, url_netloc, is_cf_domain):
    result = {'dist_id': '', 'cf_domain': ''}
    dist_domain_name = distribution['DomainName']
    dist_aliases = distribution['Aliases']
    dist_id = distribution['Id']
    if is_cf_domain:
        if dist_domain_name == url_netloc:
            result['cf_domain'] = dist_domain_name
            result['dist_id'] = dist_id
            print('The cloudfront domain name is ' +
                     dist_domain_name)
            print('The cloudfront distribution id is ' + dist_id)
            return result
    elif dist_aliases['Quantity'] != 0:
        for alias in dist_aliases['Items']:
            if alias == url_netloc:
                print('The cloudfront domain name is ' +
                         dist_domain_name)
                print('The cloudfront distribution id is ' + dist_id)
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
        print('Distribution id: ' + distribution_id)
    except Exception as e:
        print('Fail to find distribution with domain name: ' +
                  cf_domain + ', error details: ' + str(e))
        return ''

    return distribution_id


def get_request_item(req_id):
    response = request_table.get_item(
        Key={
            'req_id': req_id
        }
    )
    return response['Item']

def get_pop_ip_list(pop_items):
    pop_ips = []
    for pop_item in pop_items:
        pop = pop_item['S']
        pop_ips.append(pop)
    return pop_ips

def get_urls_from_txt_in_s3(bucket_name, key):
    urls = []
    # Get txt file from S3 and save it to /tmp/
    s3.download_file(bucket_name, key, '/tmp/success_urls.txt')

    # Read txt file line by line and get string array
    with open('/tmp/success_urls.txt', 'r') as f:
        urls = f.readlines()
        urls = [urls.strip() for urls in urls]
    print(len(urls))

    return urls

def split_array(arr, chunk_size):
    return [arr[i:i+chunk_size] for i in range(0, len(arr), chunk_size)]

def insert_pop_to_dynamodb(req_id, pop, ip, status):
    pop_table.put_item(
        Item={
            'req_id': req_id,
            'pop': pop,
            'ip': ip,
            'status': status,
            'created_at': str(datetime.datetime.now())
        }
    )
    return True

def update_pop_status_in_dynamodb(req_id, pop, status):
    pop_table.update_item(
        Key={
            'req_id': req_id,
            'pop': pop
        },
        UpdateExpression="set processed_time = :processed_time",
        ExpressionAttributeValues={
            ':processed_time': str(datetime.datetime.now()),
        }
    )
    return True

def batch_send_task_to_sqs(req_id, pop, urls, pop_ips, cf_domain, header, need_invalidate):
    invalidate_result = True
    if need_invalidate:
        invalidate_result = batch_invalidate_and_send_sqs(urls, cf_domain)
    if not invalidate_result:
        print("Batch invalidate and sending finish without no invalidations")
        return False

    messages = []
    for url in urls:
        item = {
            'req_id': req_id,
            'pop': pop,
            'url': url,
            'pop_ips': pop_ips,
            'cf_subdomain': cf_domain,
            'header': header
        }
        message = {
            'Id': uuid.uuid4().hex,
            'MessageBody': json.dumps(item)
        }
        messages.append(message)
        if len(messages) == 10:
            sqs_client.send_message_batch(
                QueueUrl=os.environ['TASK_SQS_URL'],
                Entries=messages
            )
            messages = []
    
    if len(messages) > 0:
        sqs_client.send_message_batch(
            QueueUrl=os.environ['TASK_SQS_URL'],
            Entries=messages
        )

    return True


def batch_invalidate_and_send_sqs(urls, cf_domain):
    try:
        HAS_CF_DOMAIN_PARA = False
        if cf_domain is not None:
            HAS_CF_DOMAIN_PARA = True
        inv_id = 'CreateInvalidationError'
        inv_mapping = {}

        if HAS_CF_DOMAIN_PARA:
            dist_id = find_dist_id(cf_domain, 'DomainName')
            if len(dist_id) > 0:
                for url in urls:
                    inv_resp = invalidate_cf_cache(dist_id, url)
                    if inv_resp != False:
                        inv_id = inv_resp['Invalidation']['Id']
                    inv_mapping[url] = inv_id
                    # To avoid exceeding create invalidation rate
                    time.sleep(INV_WAIT_TIME)
        else:
            for url in urls:
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
        print(f'valid finished :{inv_mapping}')
        return True
    except Exception as e:
        print('valid finished error')
        return False


def send_task(req_id, pop, urls, pop_ips, cf_domain, header, need_invalidate):
    
    split_urls_array = split_array(urls, 100)

    with concurrent.futures.ThreadPoolExecutor(10) as executor:
        for urls_array in split_urls_array:
            executor.submit(batch_send_task_to_sqs, req_id, pop, urls_array, pop_ips, cf_domain, header, need_invalidate)

    return True

def check_status(req_id):
    # query count of pop items that status = success and processed_time = '' in dynamodb
    response = pop_table.query(
        Select = 'COUNT',
        KeyConditionExpression='req_id = :req_id',
        FilterExpression='#status = :status and #processed_time = :processed_time',
        ExpressionAttributeNames={
            '#status': 'status',
            '#processed_time': 'processed_time'
        },
        ExpressionAttributeValues={
            ':req_id': req_id,
            ':status': 'SUCCESS',
            ':processed_time': ''
        },
    )

    count = response['Count']
    print(response)
    print('count: {}'.format(count))

    if count == 0:
        # meaning this is the last pop
        request_table.update_item(
            Key={
                'req_id': req_id
            },
            UpdateExpression="set #status = :status",
            ExpressionAttributeNames={
                '#status': 'status',
            },
            ExpressionAttributeValues={
                ':status': 'IN-PROGRESS'
            }
        )
        return True  

    


def lambda_handler(event, context):

    record = event['Records'][0]

    # Only process INSERT event
    if record['eventName'] != 'INSERT':
        return
    
    pop_item = record['dynamodb']['NewImage']

    status = pop_item['status']['S']

    # Only process SUCCESS pop
    if status != 'SUCCESS':
        return

    req_id = pop_item['req_id']['S']
    pop = pop_item['pop']['S']
    pop_ips = get_pop_ip_list(pop_item['ip']['L'])

    request_item = get_request_item(req_id)
    print(request_item)

    cf_domain = request_item['cf_domain']
    header = request_item['header']
    bucket_name = request_item['url_path']['bucket']
    need_invalidate = request_item['need_invalidate'] if 'need_invalidate' in request_item and request_item['need_invalidate'] else False

    key = '{}/success_urls.txt'.format(req_id)

    urls = get_urls_from_txt_in_s3(bucket_name, key)

    send_task(req_id, pop, urls, pop_ips, cf_domain, header, need_invalidate)

    print('Number of urls: {}'.format(len(urls)))

    update_pop_status_in_dynamodb(req_id, pop, 'PROCESSED')

    # make sure to change the request table status when finished deal the last success pop
    check_status(req_id)