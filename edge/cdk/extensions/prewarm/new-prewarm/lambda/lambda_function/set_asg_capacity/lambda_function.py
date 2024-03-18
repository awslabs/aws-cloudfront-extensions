import json
import boto3
import os
import datetime

# creatge Auto Scaling  client
asg_client = boto3.client('autoscaling')
# creatge dynamodb client
dynamodb = boto3.client('dynamodb')
table_name = os.environ.get("REQUEST_TABLE_NAME")
asg_name = os.environ.get("ASG_NAME")

def lambda_handler(event, context):

    try:
        body = json.loads(event['body'])

        # log receive data
        print('Received POST data:', body)
        

        if body is None or 'DesiredCapacity' not in body:
            return retrun_data(status='failure', message=f'Auto Scaling Group {asg_name} DesiredCapacity is missing')

        desired_capacity = body['DesiredCapacity']

        if desired_capacity < 0:
            return retrun_data(status='failure', message=f'Auto Scaling Group {asg_name} DesiredCapacity is less than 0')

        elif desired_capacity > 300:
            return retrun_data(status='failure', message=f'Auto Scaling Group {asg_name} updated to DesiredCapacity is greater than 300')

        if 'force_stop' in body:
            if 'req_id' not in body:
                return retrun_data(status='failure', message=f'If you want to clean the SQS,you must input the requst_id')

            request_id = body['req_id']
            query_key_condition = {
                'KeyConditionExpression': '#req_id = :key_value',
                'ExpressionAttributeNames': {
                    '#req_id': 'req_id'
                },
                'ExpressionAttributeValues': {
                    ':key_value': {'S': request_id}
                }
            }
            # execute query
            response = dynamodb.query(
                TableName=table_name,
                **query_key_condition
            )

            if len(response['Items']) == 0:
                return retrun_data(status='failure', message=f'Request Id is invalid.')
            
            for item in response['Items']:
                print(item)
                status = item.get('status', {}).get('S')
                print(status)
                # if status is IN-PROGRESS ,we can't pure the SQS
                if status != 'IN-PROGRESS':
                    return retrun_data(status='failure', message=f'The data is currently being inserted into SQS or Job is FINISHED.')
            try:
                queue_url = os.environ.get("TASK_SQS_URL")
                sqs_client = boto3.client('sqs')
                response = sqs_client.purge_queue(
                    QueueUrl=queue_url
                )
                print(str(f'SQS {queue_url} purge success'))
            except Exception as e:
                return retrun_data(status='failure', message=str(f'SQS {queue_url} purge failed'))
            
            primary_key = {
                'req_id': {'S': request_id}
            }
            # expression_attribute_values = {':value1': {'S': 'new_value_1'}, ':value2': {'N': '123'}}
            try:
                # update Auto Scaling Desired Capacity
                set_capacity(desired_capacity)
                dynamodb.update_item(
                    TableName=table_name,
                    Key={
                        'req_id': {'S': request_id}
                    },
                    UpdateExpression="set #status = :s",
                    ExpressionAttributeNames={
                        '#status': 'status'
                    },
                    ExpressionAttributeValues={
                        ':s': {'S': 'STOPPED'}
                    },
                )
                return retrun_data(status='success', message=f'Auto Scaling Group {asg_name} updated to Desired Capacity: {desired_capacity} and clean SQS success!')
            except Exception as e:
                return retrun_data(status='failure', message=f'Auto Scaling Group {asg_name} updated to Desired Capacity failed:'+str(e))
        else:
            try:
                # update Auto Scaling Desired Capacity
                set_capacity(desired_capacity)
            except Exception as e:
                return retrun_data(status='failure', message=f'Auto Scaling Group {asg_name} updated to Desired Capacity failed:'+str(e))
            return retrun_data(status='success', message=f'Auto Scaling Group {asg_name} updated to Desired Capacity: {desired_capacity}')
    except Exception as e:
        return retrun_data(status='failure', message=f'Auto Scaling Group {asg_name} updated to Desired Capacity failed:'+str(e))


def retrun_data(status, message):
    current_time = datetime.datetime.now()

    response = {
        'statusCode': 200,
        'body': json.dumps({
            'status': status,
            'timestamp': str(current_time),
            'message': message,
        })
    }

    return response


def set_capacity(desired_capacity):
    response = asg_client.update_auto_scaling_group(
                AutoScalingGroupName=asg_name,
                DesiredCapacity=desired_capacity,
                MinSize=desired_capacity,
                MaxSize=desired_capacity
            )