import boto3
import json
import os
import dns.resolver
from urllib.parse import urlparse
import datetime
import uuid

sqs_client = boto3.client('sqs')
dynamodb = boto3.resource('dynamodb')

def get_urls_from_dynamodb(req_id):
    urls = []

    table = dynamodb.Table(os.environ['REQUEST_URL_TABLE_NAME'])

    response = table.query(
        KeyConditionExpression=boto3.dynamodb.conditions.Key('req_id').eq(req_id)
    )

    items = response['Items']
    for item in items:
        urls = urls + item['urls']

    while 'LastEvaluatedKey' in response:
        response = table.query(
            KeyConditionExpression=boto3.dynamodb.conditions.Key('req_id').eq(req_id),
            ExclusiveStartKey=response['LastEvaluatedKey']
        )
        items = response['Items']
        for item in items:
            urls = urls + item['urls']

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

def update_pop_status(req_id, pop, status):
    table = dynamodb.Table(os.environ['REQUEST_POP_TABLE_NAME'])
    table.update_item(
        Key={
            'req_id': req_id,
            'pop': pop
            },
        UpdateExpression="set #status = :s, updated_at = :u",
        ExpressionAttributeNames={
            '#status': 'status'
            },
        ExpressionAttributeValues={
            ':s': status,
            ':u': str(datetime.datetime.now())
        }
    )

def insert_pop_status(req_id, pop, status, ips):
    table = dynamodb.Table(os.environ['REQUEST_POP_TABLE_NAME'])
    table.put_item(
        Item={
            'req_id': req_id,
            'pop': pop,
            'status': status,
            'ips': ips,
            'created_at': str(datetime.datetime.now())
        }
    )

def send_task_to_sqs(req_id, pop, urls, ips, cf_domain):

    messages = []

    for url in urls:
        item = {
            'req_id': req_id,
            'pop': pop,
            'url': url,
            'ips': ips,
            'cf_domain': cf_domain
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
    
    print('Task sent to SQS')
    return True

def lambda_handler(event, context):

    current_pop = event['current_pop']
    req_id = event['req_id']
    cf_domain = event['cf_domain'] # cloudfront domain like: d1sibkbhgxsytj.cloudfront.net

    result = {
        'req_id': req_id,
        'current_pop': current_pop,
        'cf_domain': cf_domain,
        'finished': False
    }

    if current_pop != '':
        # get queue length
        response = sqs_client.get_queue_attributes(
            QueueUrl=os.environ['TASK_SQS_URL'],
            AttributeNames=['ApproximateNumberOfMessages', 'ApproximateNumberOfMessagesNotVisible']
            )
        
        print(response)

        message_available = int(response['Attributes']['ApproximateNumberOfMessages'])
        message_in_flight = int(response['Attributes']['ApproximateNumberOfMessagesNotVisible'])

        if message_available + message_in_flight > 0:
            return result
        
        update_pop_status(req_id, current_pop, 'Finished')

    # Receive message from SQS

    response = sqs_client.receive_message(
        QueueUrl=os.environ['POP_SQS_URL'],
        MaxNumberOfMessages = 1,
        WaitTimeSeconds = 6
    )

    if 'Messages' in response:
        sqs_message = response['Messages'][0]
        body = json.loads(sqs_message['Body'])
        pop = body['pop']
        subdomain = cf_domain.split('.')[0]

        pop_ips = get_pop_ip(subdomain, pop)

        status = ''

        if len(pop_ips) == 0:
            status = 'Failed'
            result['current_pop'] = ''
        else:
            status = 'In-Progress'
            result['current_pop'] = pop

            urls = get_urls_from_dynamodb(req_id)
            send_task_to_sqs(req_id, pop, urls, pop_ips, cf_domain)
        
        insert_pop_status(req_id, pop, status, pop_ips)

        receipt_handle = sqs_message['ReceiptHandle']
        sqs_client.delete_message(
            QueueUrl=os.environ['POP_SQS_URL'],
            ReceiptHandle=receipt_handle
        )
    else:
        result['finished'] = True
    
    return result