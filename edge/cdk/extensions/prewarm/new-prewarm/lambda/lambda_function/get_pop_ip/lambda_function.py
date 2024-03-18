import boto3
import json
import os
import dns.resolver
from urllib.parse import urlparse
import datetime
import uuid

request_table_name = os.environ['REQUEST_TABLE_NAME']
pop_table_name = os.environ['POP_TABLE_NAME']
dynamodb = boto3.resource('dynamodb')
request_table = dynamodb.Table(request_table_name)
pop_table = dynamodb.Table(pop_table_name)

def stop_all_job():
    body = {
        'DesiredCapacity': 0,
    }

    body_str = json.dumps(body)

    # invoke set_asg_capacity lambda with event
    lambda_client = boto3.client('lambda')

    payload = {
        'body': body_str
    }

    response = lambda_client.invoke(
        FunctionName=os.environ['SET_CAPACTIY_LAMBDA_ARN'], 
        InvocationType='Event',
        Payload=json.dumps(payload).encode('UTF-8')
    )

    print(response)

def get_urls_from_txt_in_s3(bucket_name, key):
    urls = []

    # Get txt file from S3 and save it to /tmp/
    s3 = boto3.client('s3')
    s3.download_file(bucket_name, key, '/tmp/success_urls.txt')

    # Read txt file line by line and get string array
    with open('/tmp/success_urls.txt', 'r') as f:
        urls = f.readlines()
        urls = [urls.strip() for urls in urls]
    print(len(urls))

    return urls

def get_pop_ip(cf_subdomain, pop):
    ips = []
    domain_name = '{}.{}.cloudfront.net'.format(cf_subdomain, pop)
    try:
        response = dns.resolver.query(domain_name, 'A')
        for rdata in response:
            ips.append(rdata.address)
    except dns.resolver.NoAnswer:
        return ips
    return ips

def insert_pop_to_dynamodb(req_id, pop, ip, status):
    pop_table.put_item(
        Item={
            'req_id': req_id,
            'pop': pop,
            'ip': ip,
            'status': status,
            'created_at': str(datetime.datetime.now()),
            'processed_time': ''
        }
    )
    return True

def update_request_table_status(req_id, status, success_pop=0):
    
    if status == 'FINISHED':
        # stop all instances in the prewarm ASG
        stop_all_job()

    request_table.update_item(
        Key={
            'req_id': req_id
        },
        UpdateExpression="set #status = :s, success_pop_count = :sp",
        ExpressionAttributeNames={
                    '#status': 'status'
                    },
        ExpressionAttributeValues={
            ':s': status,
            ':sp': success_pop
        },
    )
    
def lambda_handler(event, context):
    req_id = event['req_id']
    pop_items = event['pops']
    cf_domain = event['cf_domain']
    success_url_count = event['success_url_count']
    
    cf_subdomain = cf_domain.split('.')[0]
    success_pop_count = 0
    failed_pop_count = 0
    pops = []

    if success_url_count == 0:
        update_request_table_status(req_id, 'FINISHED') 
        print('no url')
        return

    for pop_item in pop_items:
        pop = pop_item['S']
        pops.append(pop)
        pop_ips = get_pop_ip(cf_subdomain, pop)
        
        if len(pop_ips) == 0:
            # cannot get the ips for this pop, move on to the next pop  
            insert_pop_to_dynamodb(req_id, pop, pop_ips, 'FAILED')
            failed_pop_count = failed_pop_count + 1
            continue

        insert_pop_to_dynamodb(req_id, pop, pop_ips, 'SUCCESS')
        
        success_pop_count = success_pop_count + 1

    # if there is no successful pops, set status to FINISHED
    if success_pop_count == 0:
        update_request_table_status(req_id, 'FINISHED', success_pop_count)
    else:
        update_request_table_status(req_id, 'INSERT_TASK', success_pop_count)

    print('Number of urls: {}'.format(success_url_count))
    print('Number of success pops: {}'.format(success_pop_count))
    print('Number of failed pops: {}'.format(failed_pop_count))


