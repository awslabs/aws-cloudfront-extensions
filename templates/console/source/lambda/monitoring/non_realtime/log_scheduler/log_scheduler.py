import json
import os
from datetime import datetime
import boto3

DELAY_HOUR = 2
DOMAIN_S3_BUCKET = os.environ['DOMAIN_S3_BUCKET']
QUEUE_URL = os.environ['SQS_QUEUE_URL']
aws_region = os.environ['AWS_REGION']

cf_client = boto3.client("cloudfront")
s3 = boto3.client('s3')
sqs = boto3.client('sqs', region_name=aws_region)

def get_alias_or_domain_name(distribution_id):
    response = cf_client.get_distribution(Id=distribution_id)
    aliases = response['Distribution']['DistributionConfig']['Aliases']
    aliases_qty = aliases['Quantity']
    if int(aliases_qty) > 0:
        return aliases['Items'][0]
    else:
        return response['Distribution']['DomainName']


def send_msg(queue_url, s3_prefix, domain, log_name_prefix):
    response = sqs.send_message(
        QueueUrl=queue_url,
        MessageBody=json.dumps(
            {
                's3_prefix': s3_prefix,
                'domain': domain,
                'log_name_prefix': log_name_prefix
            }
        )
    )

    return response


def compose_error_response(message):
    return {
        "statusCode": 400,
        "body": json.dumps({
            "message": message
        })
    }


def lambda_handler(event, context):
    event_time = event["time"]
    print(event_time)
    # event_datetime = datetime.strptime(
    #     event_time, "%Y-%m-%dT%H:%M:%SZ") - timedelta(minutes=60)

    now = datetime.now()
    year = str(now.year)
    month = now.strftime('%m')
    day = now.strftime('%d')
    now_hour = now.hour
    # 2 hours delay to wait for logs generated
    hour = now_hour - DELAY_HOUR
    
    if hour < 10:
        str_hour = f"0{str(hour)}"
    else:
        str_hour = str(hour)

    dest = 'year={}/month={}/day={}/hour={}/'\
        .format(year, month, day, str_hour)
    print(dest)
    # For testing
    # response = s3.list_objects_v2(Bucket=DOMAIN_S3_BUCKET, Prefix='year=2024/month=02/day=27/hour=03/', Delimiter='/')
    response = s3.list_objects_v2(Bucket=DOMAIN_S3_BUCKET, Prefix=dest, Delimiter='/')
    print(response)
    folder_names = [prefix['Prefix'] for prefix in response.get('CommonPrefixes', [])]

    for folder in folder_names:
        print(folder)
        folder_splits = folder.split("/")
        dist_id = folder_splits[-2].split("dist=")[-1]
        domain = get_alias_or_domain_name(dist_id)
        log_date = f"{year}{month}{day}{str_hour}"
        log_name_prefix = f"access_log_{domain}_{log_date}"
        print(log_name_prefix)
        resp = send_msg(QUEUE_URL, folder, domain, log_name_prefix)
        print("sqs send message:")
        print(resp)

    return {
        "statusCode": 200,
        "body": json.dumps({
            "message": "The log tasks have been sent to SQS"
        })
    }
