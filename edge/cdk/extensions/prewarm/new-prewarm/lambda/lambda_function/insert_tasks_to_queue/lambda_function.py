import boto3
import json
import os
import datetime
import uuid
import concurrent.futures

request_table_name = os.environ['REQUEST_TABLE_NAME']
pop_table_name = os.environ['POP_TABLE_NAME']
dynamodb = boto3.resource('dynamodb')
request_table = dynamodb.Table(request_table_name)
pop_table = dynamodb.Table(pop_table_name)
sqs_client = boto3.client('sqs')
s3 = boto3.client('s3')

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

def batch_send_task_to_sqs(req_id, pop, urls, pop_ips, cf_domain, header):
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

def send_task(req_id, pop, urls, pop_ips, cf_domain, header):
    
    split_urls_array = split_array(urls, 100)

    with concurrent.futures.ThreadPoolExecutor(10) as executor:
        for urls_array in split_urls_array:
            executor.submit(batch_send_task_to_sqs, req_id, pop, urls_array, pop_ips, cf_domain, header)

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
    key = '{}/success_urls.txt'.format(req_id)

    urls = get_urls_from_txt_in_s3(bucket_name, key)

    send_task(req_id, pop, urls, pop_ips, cf_domain, header) 

    print('Number of urls: {}'.format(len(urls)))

    update_pop_status_in_dynamodb(req_id, pop, 'PROCESSED')

    # make sure to change the request table status when finished deal the last success pop
    check_status(req_id)