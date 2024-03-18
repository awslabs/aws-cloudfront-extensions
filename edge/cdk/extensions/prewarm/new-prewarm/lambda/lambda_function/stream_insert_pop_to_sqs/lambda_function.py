import json
import boto3
import os
import uuid

sqs_client = boto3.client('sqs')

def lambda_handler(event, context):

    req_item = event['Records'][0]['dynamodb']['NewImage']

    print(req_item)

    req_id = req_item['req_id']['S']
    pop_string_list = req_item['pops']['L']
    messages = []

    for pop in pop_string_list:
        item = {
            'req_id': req_id,
            'pop': pop['S']
        }
        message = {
            'Id': uuid.uuid4().hex,
            'MessageBody': json.dumps(item)
        }
        messages.append(message)
        if len(messages) == 10:
            sqs_client.send_message_batch(
                QueueUrl=os.environ['POP_SQS_URL'],
                Entries=messages
            )
            messages = []
    
    if len(messages) > 0:
        sqs_client.send_message_batch(
                QueueUrl=os.environ['POP_SQS_URL'],
                Entries=messages
            )

    return {
        'statusCode': 200,
        'body': json.dumps('Hello from Lambda!')
        }