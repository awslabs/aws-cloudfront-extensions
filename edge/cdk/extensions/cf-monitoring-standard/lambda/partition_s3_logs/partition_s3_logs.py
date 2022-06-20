import logging
import gzip
import re
from os import environ
from datetime import datetime
from sqlite3 import Timestamp

import boto3

log = logging.getLogger()
log.setLevel('INFO')


def lambda_handler(event, context):
    """
    This function is triggered by S3 event to move log files
    (upon their arrival in s3) from their original location
    to a partitioned folder structure created per timestamps
    in file names, hence allowing the usage of partitioning
    within AWS Athena.

    Sample partitioned folder structure:
      year=2022/month=05/day=01/hour=23/dist=E896AYB78AOGAB

    """
    log.debug('[partition_s3_logs lambda_handler] Start')
    try:
        s3 = boto3.client('s3')
        count = 0

        # Iterate through all records in the event
        for record in event['Records']:
            # Get S3 bucket
            bucket = record['s3']['bucket']['name']

            # Get source S3 object key
            key = record['s3']['object']['key']

            # Partioned file will not be processed again
            if '/dist%3D' not in key:
                # Get file name, which should be the last one in the string
                filename = ""
                number = len(key.split('/'))
                if number >= 1:
                    number = number - 1
                filename = key.split('/')[number]
                dest = parse_cloudfront_logs(key, filename)
                if len(dest) > 0:
                    source_path = bucket + '/' + key
                    dest_path = bucket + '/' + dest
                    
                    gzip_content = gzip.decompress(s3.get_object(Bucket=bucket, Key=key)['Body'].read()).decode()
                    rows = gzip_content.split('\n')
                    updated_content = ''
                    
                    for row_item in rows:
                        log.info(row_item)
                        if row_item.startswith('#Version:'):
                            updated_content += row_item + '\n'
                        elif row_item.startswith('#Fields:'):
                            updated_content += '#Fields:\ttimestamp\tsc-bytes\tc-ip\tcs-host\tcs-uri-stem\tsc-status\tcs-bytes\ttime-taken\tx-edge-response-result-type\tx-edge-detailed-result-type\n'
                        else:
                            fields = row_item.split('\t')
                            if len(fields) > 1:       
                                timestamp = str(int(datetime.timestamp(datetime.strptime(fields[0].strip() + fields[1].strip(), "%Y-%m-%d%H:%M:%S"))))
                                updated_content += timestamp + '\t' + fields[3] + '\t' + fields[4] + '\t' + fields[6] + '\t' + fields[7] + '\t' + fields[8] + '\t' + fields[14] + '\t' + fields[17] + '\t' + fields[22] + '\t' + fields[28] + '\n'
                            
                    compressed_content = gzip.compress(updated_content.encode())
                    s3.put_object(Body=compressed_content, Bucket=bucket, Key=dest)
    
                    log.info(
                        "\n[partition_s3_logs lambda_handler] Update file %s to destination %s" % (source_path, dest_path))
    
                    s3.delete_object(Bucket=bucket, Key=key)
                    log.info(
                        "\n[partition_s3_logs lambda_handler] Removed file %s" % source_path)
    
                    count = count + 1

        log.info(
            "\n[partition_s3_logs lambda_handler] Successfully partitioned %s file(s)." % (str(count)))

    except Exception as error:
        log.error(str(error))
        raise

    log.debug('[partition_s3_logs lambda_handler] End')


def parse_cloudfront_logs(key, filename):
    log.info(key)
    log.info(filename)
    try:
        # Get year, month, day and hour
        time_stamp = re.search('(\\d{4})-(\\d{2})-(\\d{2})-(\\d{2})', key)
        year, month, day, hour = time_stamp.group(0).split('-')
        dist_id = filename.split('.')[0]
    
        # Create destination path
        dest = 'year={}/month={}/day={}/hour={}/dist={}/{}' \
               .format(year, month, day, hour, dist_id, filename)
        log.info(dest)
    
        return dest
    except AttributeError:
        return ''
    
