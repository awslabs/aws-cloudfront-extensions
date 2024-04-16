import json
import boto3
import os
import datetime

cloudwatch = boto3.client('cloudwatch')
dynamodb = boto3.client('dynamodb')
table_name = os.environ.get("REQUEST_TABLE_NAME")
sqs = boto3.client('sqs')
queue_url = os.environ.get("TASK_SQS_URL")


def lambda_handler(event, context):
    current_datetime = datetime.datetime.now()
    download_size = 0
    total_size = 0
    available_task_count = 0
    in_progress_task_count = 0
    status = ''
    print(event)
    
    try:
        # body = json.loads(event['body'])
        request_id = ''
        query_params = event.get('queryStringParameters')
        if query_params is not None and 'req_id' in query_params:
            request_id = query_params['req_id']
            print(f'request_id value: {request_id}')
        else:
            print('req_id is not present in query parameters')
            return retrun_data(status='failure', message=str('req_id is empty!'))

        # execute query
        response = dynamodb.get_item(
            TableName=table_name,
            Key={
                'req_id': {'S': request_id}
            }
        )

        if 'Item' in response:
            item = response['Item']
            download_size = item.get('download_size', {}).get('N', 0)
            url_size = item.get('url_size', {}).get('N', 0)
            success_pop_count = item.get('success_pop_count', {}).get('N', 0)
            success_url_count = item.get('success_url_count', {}).get('N', 0)
            download_count = item.get('download_count', {}).get('N', 0)
            created_at = item.get('created_at', {}).get('S')
            last_update_time = item.get('last_update_time', {}).get('S')
            status = item.get('status', {}).get('S')

            # log data
            # print(download_size)
            # print(url_size)
            # print('success_pop_count:'+success_pop_count)
            # print('url_size:'+url_size)
            # print(status)
            total_size = int(url_size) * int(success_pop_count)
            # print(total_size)
            total_count = int(success_pop_count) * int(success_url_count)
            # print(total_count)
        else:
            # print(str(e))
            return retrun_data(status='failure', message='The reqeust id is invalid.')
        
        # get all sqs attributes
        response = sqs.get_queue_attributes(
            QueueUrl=queue_url,
            AttributeNames=[
                'All'
            ]
        )
        attributes = response['Attributes']
        in_progress_task_count = int(
            attributes['ApproximateNumberOfMessagesNotVisible'])
        available_task_count = int(attributes['ApproximateNumberOfMessages'])

        asg_name = os.environ.get("ASG_NAME")

        metric_name = 'NetworkIn'

        end_time = datetime.datetime.now()
        start_time = end_time - datetime.timedelta(minutes=1)

        # cw_response = cloudwatch.get_metric_statistics(
        #     Namespace='AWS/EC2',
        #     MetricName=metric_name,
        #     Dimensions=[
        #         {
        #             'Name': 'AutoScalingGroupName',
        #             'Value': asg_name
        #         },
        #     ],
        #     StartTime=start_time,
        #     EndTime=end_time,
        #     Period=60,
        #     Statistics=['Sum'],
        # )

        # print(cw_response)

        body = json.dumps({
            'request_id': request_id,
            'download_size': int(download_size),
            'total_size': total_size,
            'percentage_complete': calculate_percentage(download_size, total_size),
            'available_task_count': available_task_count,
            'in_progress_task_count': in_progress_task_count,
            'download_count': int(download_count),
            'total_count': total_count,
            'created_at': created_at,
            'last_update_time': last_update_time,
            'timestamp': str(current_datetime),
            'status': status
        })

        print("body:" + body)
        print("in_progress_task_count:", in_progress_task_count)
        print("available_task_count:", available_task_count)
        return {
            'statusCode': 200,
            'body': body
        }
    except Exception as e:
        print(str(e))
        return retrun_data(status='failure', message=str(e))


def calculate_percentage(dividend, divisor):
    if divisor == 0:
        return 0

    percentage = int(dividend) / int(divisor) * 100
    percentage_int = int(percentage)
    return percentage_int


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
