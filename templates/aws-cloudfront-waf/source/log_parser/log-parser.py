######################################################################################################################
#  Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           #
#                                                                                                                    #
#  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    #
#  with the License. A copy of the License is located at                                                             #
#                                                                                                                    #
#      http://www.apache.org/licenses/LICENSE-2.0                                                                    #
#                                                                                                                    #
#  or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES #
#  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    #
#  and limitations under the License.                                                                                #
######################################################################################################################

import boto3
import csv
import gzip
import json
import logging
import datetime
import os
from os import environ, remove
from urllib.parse import unquote_plus
from urllib.parse import urlparse
import requests
from lib.solution_metrics import send_metrics
from build_athena_queries import build_athena_query_for_app_access_logs

logging.getLogger().debug('Loading function')

api_call_num_retries = 5
max_descriptors_per_ip_set_update = 500
delay_between_updates = 2

# CloudFront Access Logs
# http://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/AccessLogs.html#BasicDistributionFileFormat
LINE_FORMAT_CLOUD_FRONT = {
    'delimiter': '\t',
    'date': 0,
    'time': 1,
    'source_ip': 4,
    'uri': 7,
    'code': 8
}
# ALB Access Logs
# http://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-access-logs.html
LINE_FORMAT_ALB = {
    'delimiter': ' ',
    'timestamp': 1,
    'source_ip': 3,
    'code': 9,  # GitHub issue #44. Changed from elb_status_code to target_status_code.
    'uri': 13
}

config = {}



def execute_athena_query(log, event):
    log.debug('[execute_athena_query] Start')

    athena_client = boto3.client('athena')
    s3_output = "s3://%s/athena_results/" % event['accessLogBucket']
    database_name = event['glueAccessLogsDatabase']

    # Dynamically build query string using partition
    # for CloudFront or ALB logs
    query_string = build_athena_query_for_app_access_logs(
        log,
        event['glueAccessLogsDatabase'],
        event['glueAppAccessLogsTable'],
        datetime.datetime.utcnow(),
        int(environ['WAF_BLOCK_PERIOD']),
        int(environ['ERROR_THRESHOLD'])
    )

    response = athena_client.start_query_execution(
        QueryString=query_string,
        QueryExecutionContext={'Database': database_name},
        ResultConfiguration={
            'OutputLocation': s3_output,
            'EncryptionConfiguration': {
                'EncryptionOption': 'SSE_S3'
            }
        },
        WorkGroup=event['athenaWorkGroup']
    )

    log.info("[execute_athena_query] Query Execution Response: {}".format(response))
    log.info('[execute_athena_query] End')


def process_athena_result(log, bucket_name, key_name, ip_set_type):
    log.debug('[process_athena_result] Start')

    try:
        # --------------------------------------------------------------------------------------------------------------
        log.info("[process_athena_result] \tDownload file from S3")
        # --------------------------------------------------------------------------------------------------------------
        local_file_path = '/tmp/' + key_name.split('/')[-1]
        s3 = boto3.client('s3')
        s3.download_file(bucket_name, key_name, local_file_path)

        # --------------------------------------------------------------------------------------------------------------
        log.info("[process_athena_result] \tRead file content")
        # --------------------------------------------------------------------------------------------------------------
        outstanding_requesters = {
            'general': {},
            'uriList': {}
        }
        utc_now_timestamp_str = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S %Z%z")
        with open(local_file_path, 'r') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                # max_counter_per_min is set as 1 just to reuse lambda log parser data structure
                # and reuse update_ip_set.
                outstanding_requesters['general'][row['client_ip']] = {
                    "max_counter_per_min": row['max_counter_per_min'],
                    "updated_at": utc_now_timestamp_str
                }
        remove(local_file_path)

    except Exception:
        log.error("[process_athena_result] \tError to read input file")

    log.debug('[process_athena_result] End')



# ======================================================================================================================
# Lambda Entry Point
# ======================================================================================================================
def lambda_handler(event, context):
    log = logging.getLogger()
    log.info('[lambda_handler] Start')

    result = {}
    try:
        log.setLevel('INFO')
        log.info(event)

        execute_athena_query(log, event)
        result['message'] = "[lambda_handler] Athena scheduler event processed."
        log.info(result['message'])

    except Exception as error:
        log.error(str(error))

    log.info('[lambda_handler] End')
    return result




