import urllib.request
import concurrent.futures
import boto3
import os
from urllib import parse
import json

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TASK_TABLE_NAME'])

def get_failed_items(req_id):
    csv_items = []

    req_id = '{}_failure'.format(req_id)

    response = table.query(
        KeyConditionExpression=boto3.dynamodb.conditions.Key('req_id').eq(req_id)
    )

    items = response['Items']
    for item in items:
        csv_item = ','.join([item['url_pop'].split('_', 1)[0], item['url_pop'].split('_', 1)[1], item['result']['errorMsg'].replace(',', ' '), item['result']['command'].replace(',', ' ')])
        csv_items.append(csv_item)

    while 'LastEvaluatedKey' in response:
        response = table.query(
            KeyConditionExpression=boto3.dynamodb.conditions.Key('req_id').eq(req_id),
            ExclusiveStartKey=response['LastEvaluatedKey']
        )
        items = response['Items']
        for item in items:
            csv_item = ','.join([item['url_pop'].split('_', 1)[0], item['url_pop'].split('_', 1)[1], item['result']['errorMsg'].replace(',', ' '), item['result']['command'].replace(',', ' ')])
            csv_items.append(csv_item)

    return csv_items

def lambda_handler(event, context):
    
    record = event['Records'][0]

    req_item = record['dynamodb']['NewImage']

    print(req_item)

    req_id = req_item['req_id']['S']
    status = req_item['status']['S']
    bucket_name = req_item['url_path']['M']['bucket']['S']

    # Only process STOPPED or FINISHED event

    if status == 'STOPPED' or status == 'FINISHED':
        failed_items = get_failed_items(req_id)

        failed_items_key = '{}/failed_pop_urls.csv'.format(req_id)

        # write item to csv file
        with open('/tmp/failed_items.csv', 'w') as f:
            for item in failed_items:
                f.write(item + '\n')

        s3.upload_file('/tmp/failed_items.csv', bucket_name, failed_items_key)
