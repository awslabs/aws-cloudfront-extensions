import json
import boto3
import logging
import os
from datetime import datetime
from datetime import timedelta

log = logging.getLogger()
log.setLevel('INFO')

DB_NAME = os.environ['GLUE_DATABASE_NAME']
TABLE_NAME = os.environ['GLUE_TABLE_NAME']
CATALOG_ID = os.environ['ACCOUNT_ID']

client = boto3.client('glue')

def lambda_handler(event, context):

    event_time = event["time"]
    event_datetime = datetime.strptime(event_time, "%Y-%m-%dT%H:%M:%SZ")
    log.info(str(event_datetime))
    event_datetime = event_datetime - timedelta(days=1)
    log.info(str(event_datetime))
    
    year = str(event_datetime.year)
    month = str('%02d' % event_datetime.month)
    day = str('%02d' % event_datetime.day)
    
    # 00~59
    for minute in range(60):
        delete_dict = []
        minute = str('%02d' % minute)
        
        # 00~23
        for hour in range(24):
            hour = str('%02d' % hour)
        
            delete_json = {
                'Values': [
                    year, month, day, hour, minute
                ]
            }
            delete_dict.append(delete_json)
        
        log.info(json.dumps(delete_dict))
        delete_partition_response = client.batch_delete_partition(
            CatalogId=CATALOG_ID,
            DatabaseName=DB_NAME,
            TableName=TABLE_NAME,
            PartitionsToDelete=delete_dict
        )
        log.info(json.dumps(delete_partition_response))
    
    return {
        'statusCode': 200,
        'body': delete_partition_response
    }
