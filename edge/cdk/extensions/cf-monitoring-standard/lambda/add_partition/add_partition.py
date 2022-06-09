import json
import boto3
import logging
import os
from datetime import datetime
from datetime import timedelta

log = logging.getLogger()
log.setLevel('INFO')

def lambda_handler(event, context):

    client = boto3.client('glue')
    DB_NAME = os.environ['GLUE_DATABASE_NAME']
    TABLE_NAME = os.environ['GLUE_TABLE_NAME']
    CATALOG_ID = os.environ['ACCOUNT_ID']
    S3_URL = "s3://" + os.environ['S3_BUCKET']

    event_time = event["time"]
    event_datetime = datetime.strptime(event_time, "%Y-%m-%dT%H:%M:%SZ")
    log.info(str(event_datetime))
    event_datetime = event_datetime + timedelta(days=1)
    log.info(str(event_datetime))
    
    year = str(event_datetime.year)
    month = str('%02d' % event_datetime.month)
    day = str('%02d' % event_datetime.day)
    
    try:
        response2 = client.get_table(
            CatalogId=CATALOG_ID,
            DatabaseName=DB_NAME,
            Name=TABLE_NAME
        )
    except Exception as error:
        print("cannot fetch table as " + str(error))
        exit(1)
    # Parsing table info required to create partitions from table
    input_format = response2['Table']['StorageDescriptor']['InputFormat']
    output_format = response2['Table']['StorageDescriptor']['OutputFormat']
    table_location = response2['Table']['StorageDescriptor']['Location']
    serde_info = response2['Table']['StorageDescriptor']['SerdeInfo']
    partition_keys = response2['Table']['PartitionKeys']
    print(input_format)
    print(output_format)
    print(table_location)
    print(serde_info)
    print(partition_keys)
    
    # 00~23
    for hour in range(24): 
        create_dict = []
        log.info(str(hour))
        hour = str('%02d' % hour)
        log.info(str(hour))
            
        part_location = S3_URL + "/year={}/month={}/day={}/hour={}/".format(year, month, day, hour)

        input_json = {
            'Values': [
                year, month, day, hour
            ],
            'StorageDescriptor': {
                'Location': part_location,
                'InputFormat': input_format,
                'OutputFormat': output_format,
                'SerdeInfo': serde_info
            }
        }
         
        create_dict.append(input_json)
        
        log.info(json.dumps(create_dict))
        create_partition_response = client.batch_create_partition(
            CatalogId=CATALOG_ID,
            DatabaseName=DB_NAME,
            TableName=TABLE_NAME,
            PartitionInputList=create_dict
        )
        log.info(json.dumps(create_partition_response))
    
    return {
        'statusCode': 200,
        'body': create_partition_response
    }
