import json
import boto3
import os
import datetime
import csv
from botocore.exceptions import ClientError

cloudwatch = boto3.client('cloudwatch')
dynamodb = boto3.client('dynamodb')
request_table_name = os.environ.get("REQUEST_TABLE_NAME")
pop_table_name = os.environ.get("REQUEST_POP_TABLE_NAME")
sqs = boto3.client('sqs')
queue_url = os.environ.get("TASK_SQS_URL")

s3 = boto3.client('s3')


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
            TableName=request_table_name,
            **query_key_condition
        )

        if len(response['Items']) == 0:
            return retrun_data(status='failure', message=f'Request Id is invalid.')

        for request_item in response['Items']:
            print(request_item)
            status = request_item.get('status', {}).get('S')
            # log data
            print(status)
            if status not in ["FINISHED", "STOPPED"]:
                return retrun_data(status='failure', message=f'Job status is {status},we can the get the summary when the job is "FINISHED" or "STOPPED.')

            created_at = request_item.get('created_at', {}).get('S')
            last_update_time = request_item.get('last_update_time', {}).get('S')

            filter_expression = "#pop_status = :status_value and req_id = :request_id_value"

            expression_attribute_values = {
                ':status_value': {'S': 'FAILED'},
                ':request_id_value': {'S': request_id}
            }

            expression_attribute_names = {
                "#pop_status": "status"
            }

            pop_fail_results = []

            response = dynamodb.query(
                TableName=pop_table_name,
                KeyConditionExpression='req_id = :request_id_value',
                FilterExpression='#pop_status = :status',
                ExpressionAttributeNames={"#pop_status": "status"},
                ExpressionAttributeValues={
                    ':status': {'S': 'FAILED'},
                    ':request_id_value': {'S': request_id}
                }
            )
            
            items = response.get('Items', [])
            for item in items:
                pop_name = item.get('pop', {}).get('S')
                pop_fail_results.append(pop_name)
                # pop_fail_results.append(pop_name)

            # response = dynamodb.scan(
            #     TableName=pop_table_name,
            #     FilterExpression=filter_expression,
            #     ExpressionAttributeNames=expression_attribute_names,
            #     ExpressionAttributeValues=expression_attribute_values
            #     # ExclusiveStartKey={last_evaluated_key}
            # )
            # items = response.get('Items', [])
            # for item in items:
            #     pop_name = item.get('pop', {}).get('S')
            #     pop_fail_results.append(pop_name)

            while 'LastEvaluatedKey' in response:
                # response = dynamodb.scan(
                #     TableName=pop_table_name,
                #     FilterExpression=filter_expression,
                #     ExpressionAttributeNames=expression_attribute_names,
                #     ExpressionAttributeValues=expression_attribute_values,
                #     ExclusiveStartKey=response['LastEvaluatedKey']
                # )
                response = dynamodb.query(
                    TableName=pop_table_name,
                    KeyConditionExpression='req_id = :request_id_value',
                    FilterExpression='#pop_status = :status',
                    ExpressionAttributeNames={"#pop_status": "status"},
                    ExpressionAttributeValues={
                        ':status': {'S': 'FAILED'},
                        ':request_id_value': {'S': request_id}
                    },
                    ExclusiveStartKey=response['LastEvaluatedKey']
                )
                items = response.get('Items', [])
                for item in items:
                    pop_name = item.get('pop', {}).get('S')
                    pop_fail_results.append(pop_name)
            print(f'pop_fail_results ----{pop_fail_results}')

            # reqd s3 failed_urls.txt
            failed_urls_results = []
            bucket_name = request_item['url_path']['M']['bucket']['S']
            s3_key = request_item['url_path']['M']['key']['S'].replace(
                'original_urls.txt', 'failed_urls.txt')
            response = s3.get_object(Bucket=bucket_name, Key=s3_key)
            content = response['Body'].read().decode('utf-8')

            data_array = content.split('\n')
            for item in data_array:
                failed_urls_results.append(item)

            # read failed_pop_urls.csv
            s3_csv_key = request_item['url_path']['M']['key']['S'].replace(
                'original_urls.txt', 'failed_pop_urls.csv')
            print(s3_csv_key)

            # the file is so large, can't write all of them to a response, provide url instead
            report_url = ''
            try:
                response = s3.generate_presigned_url('get_object', Params={
                    'Bucket': bucket_name,
                    'Key': s3_csv_key
                    }, ExpiresIn=600
                )
                report_url = response
            except ClientError as e:
                print(e)

            # response = s3.get_object(Bucket=bucket_name, Key=s3_csv_key)
            # content = response['Body'].read().decode('utf-8')

            # failed_pop_urls_results = []
            # csv_data = csv.reader(content.splitlines())
            # for row in csv_data:
            #     if len(row) >= 2:
            #         combined = f"{row[0]}_{row[1]}"
            #         failed_pop_urls_results.append(combined)

        body = json.dumps({
            'request_id': request_id,
            'failure_pops': pop_fail_results,
            'failure_urls': failed_urls_results,
            'failure_pop_urls_report': report_url,
            'timestamp': str(current_datetime),
            'created_at': created_at,
            'last_update_time': last_update_time,
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
