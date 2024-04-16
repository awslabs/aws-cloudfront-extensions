import boto3
import os
import datetime
import json

table_name = os.environ['REQUEST_TABLE_NAME']
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(table_name)

def update_dynamodb_download_size(req_id, size, count):
    response = table.update_item(
        Key={
            'req_id': req_id
        },
        UpdateExpression="set download_size = download_size + :s, download_count = download_count + :c, last_update_time = :t",
        ExpressionAttributeValues={
            ':s': size,
            ':c': count,
            ':t': str(datetime.datetime.now())
        },
        ReturnValues='ALL_NEW'
    )

    # if download_count == success_pop * success_url_count, update status to FINISHED

    item = response['Attributes']
    download_count = int(item['download_count'])
    success_pop = int(item['success_pop_count'])
    success_url_count = int(item['success_url_count'])

    if download_count == success_pop * success_url_count:
        table.update_item(
            Key={
                'req_id': req_id
            },
            UpdateExpression="set #status = :s",
            ExpressionAttributeNames={
                '#status': 'status'
            },
            ExpressionAttributeValues={
                ':s': 'FINISHED'
            },
        )

        stop_all_job()

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


def lambda_handler(event, context):
    download_size_aggregation = {}
    download_count_aggregation = {}

    for record in event['Records']:

        # only deal with insert items
        if record['eventName'] != 'INSERT':
            continue
        
        req_item = record['dynamodb']['NewImage']

        #split string by _ and get the first part
        req_id = req_item['req_id']['S'].split('_')[0]

        size = int(req_item['result']['M']['size']['N'])
        
        download_count_aggregation[req_id] = download_count_aggregation.get(req_id, 0) + 1

        if size > 0:
            download_size_aggregation[req_id] = download_size_aggregation.get(req_id, 0) + size

    for key in download_count_aggregation:
        update_dynamodb_download_size(key, download_size_aggregation.get(req_id, 0), download_count_aggregation[key])