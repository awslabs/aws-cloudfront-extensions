import concurrent.futures
import time
import datetime
import json
import os
import logging
import logging.config
import shortuuid
import re
import subprocess
import configparser
from urllib.parse import urlsplit, urlunsplit
import sys
import threading
import boto3

thread_local = threading.local()

SLEEP_TIME = 1
WORKER_NUM = 6

def read_config(path):
    """
    Initialize the global configuration file.
    @param path Configuration file address
    @return Configuration file DICT object"
    """
    logger = logging.getLogger(__name__)
    config = configparser.ConfigParser()
    config.read(path)
    logger.debug("Configuration is parsed: %s", {section: dict(
        config[section]) for section in config.sections()})
    return config


# Global variables
config = read_config('./config.conf')

region = config.get('DEFAULT', 'region')
queue_url = config.get('DEFAULT', 'queue_url')
task_dynamodb_name = config.get('DEFAULT', 'task_dynamodb_name')

def init_logger():

    if not os.path.exists('./logs'):
        os.makedirs('./logs')
    if not os.path.exists('./logs/log.log'):
        open('./logs/log.log', 'w').close()
    # Create a logger
    logger = logging.getLogger("my_logger")
    logger.setLevel(logging.DEBUG)

    # Create a handler to write log messages to a file
    file_handler = logging.FileHandler("logs/log.log")
    file_handler.setLevel(logging.DEBUG)

    # Create a handler to output log messages to the console
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)

    # Create a formatter to define the format of log messages
    formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s")
    file_handler.setFormatter(formatter)
    console_handler.setFormatter(formatter)

    # Add the handlers to the logger
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    return logger


logger = init_logger()


def get_ip(ips, ip_index):
    if (len(ips) > ip_index):
        return ips[ip_index]
    else:
        return ips[ip_index-len(ips)]


def download_file_with_curl(url, cf_domain, ips, header, index_retry):
    result = {}
    try:
        ip = get_ip(ips, index_retry)
        parsed_url = urlsplit(url)
        parsed_url = parsed_url._replace(netloc=cf_domain)
        new_url= urlunsplit(parsed_url)
        
        local_filename = shortuuid.uuid()

        command = []
        header_command = []
        
        for header_item in header:
            header_command.extend(['-H', header_item])
        
        command = [
                'curl',
                '-D',
                '-',
                '--connect-timeout',
                '6',
                new_url,
                '--resolve',
                f'{cf_domain}:443:{ip}',
                '-o',
                local_filename
            ]
        command.extend(header_command)

        run_result = subprocess.run(command, text= True, 
                                capture_output=True, encoding='utf-8')

        cf_request_id_group = re.search(r'x-amz-cf-id:\s*(\w+)', run_result.stdout)
        cf_request_pop_group = re.search(r'x-amz-cf-pop:\s*(\w+)', run_result.stdout)

        std_error = run_result.stderr.splitlines()
        result['stderr'] = std_error[len(std_error)-1]

        if cf_request_id_group:
            result['cf_request_id'] = cf_request_id_group.group(1)
        
        if cf_request_pop_group:
            result['cf_request_pop'] = cf_request_pop_group.group(1)
        
        result['command'] = ' '.join(command)
        result['local_filename'] = local_filename

    except Exception as e:
        raise Exception(
            f'Failed to download file with curl command:{" ".join(command)}, exception: {e}')
    return result

def pre_warm(url, cf_domain, ips, header):
    index_retry = 0
    error_message = ''
    command = ''
    cf_request_id = ''
    cf_request_pop = ''
    while index_retry < 3:
        try:
            curl_result = download_file_with_curl(
                url, cf_domain, ips, header, index_retry)

            command = curl_result.get('command','no command')
            cf_request_id = curl_result.get('cf_request_id', '')
            cf_request_pop = curl_result.get('cf_request_pop', '')
            local_file_name = curl_result['local_filename']

            if os.path.exists(local_file_name):
                logger.info(f'Prewarm succeeded, Url: {url}, Downloaded file name: {local_file_name}')
                file_size = os.path.getsize(local_file_name)
                os.remove(local_file_name)
                logger.info(f'remove succeeded file name,  {local_file_name}')
                return {
                    'statusCode': 200,
                    'size': file_size,
                    'retry_count': index_retry,
                    'cf_request_id': cf_request_id,
                    'cf_request_pop': cf_request_pop,
                    'command': command
                }
            else:
                error_message = curl_result.get('stderr', '')
        except Exception as e:
            error_message = str(e)

        index_retry = index_retry + 1

    return {
        'statusCode': -1,
        'errorMsg': error_message,
        'size': 0,
        'retry_count': index_retry,
        'command': command,
        'cf_request_id': cf_request_id,
        'cf_request_pop': cf_request_pop,
    }

# task function

def task(n):
    logger.debug('tast '+str(n)+' started')

    # create SQS client
    sqs = boto3.client('sqs', region_name=region)

    dynamodb_client = boto3.resource('dynamodb', region_name=region)
    table = dynamodb_client.Table(task_dynamodb_name)

    while True:
        response = sqs.receive_message(
            QueueUrl=queue_url,
            MaxNumberOfMessages=1,
            WaitTimeSeconds=3,
            VisibilityTimeout=3600
        )
        # receive message
        # logger.debug('Received %d messages: %s', len(response), response)

        if  'Messages' in response and len(response['Messages']) > 0:
            
            sqs_message = response['Messages'][0]
            # logger.info('Task '+str(n)+' received a message: ')
            # logger.info(sqs_message['Body'])
            receipt_handle = sqs_message['ReceiptHandle']

            event_body = json.loads(sqs_message['Body'])

            url = event_body['url']
            req_id = event_body['req_id']
            pop = event_body['pop']
            ips = event_body['pop_ips']
            cf_domain = event_body['cf_subdomain']
            header = event_body['header']
            try:
                pre_warm_result = pre_warm(
                    url=url, cf_domain=cf_domain, ips=ips, header=header)
            except Exception as e:
                logger.error(f'Failed: Url => {url}, Download interrupted {str(e)}')
                pre_warm_result = {
                    'statusCode': -1,
                    'errorMsg': f'Failed: Url => {url}, {str(e)}',
                    'size': 0
                }
            if pre_warm_result['statusCode'] == -1:
                req_id = req_id+"_failure"

            try:
                table.put_item(
                    Item={
                        'req_id': req_id,
                        'url_pop': pop + "_" + url,
                        # 'url': url,
                        'result': pre_warm_result,
                        'created_time': str(datetime.datetime.now())
                    }
                )
            except Exception as e:
                logger.error(f'Failed to put in dynamodb: {str(e)}')
                sqs.change_message_visibility(
                    QueueUrl=queue_url,
                    ReceiptHandle=receipt_handle,
                    VisibilityTimeout=20  # 设置新的可见性超时
                )
                continue

            sqs.delete_message(
                QueueUrl=queue_url,
                ReceiptHandle=receipt_handle
            )
        time.sleep(SLEEP_TIME)


# Create a ThreadPoolExecutor with WORKER_NUM worker threads
with concurrent.futures.ThreadPoolExecutor(max_workers=WORKER_NUM) as executor:

    if len(sys.argv) > 1:
        try:
            WORKER_NUM = int(sys.argv[1])
        except:
            max_workers = WORKER_NUM
    else:
        max_workers = WORKER_NUM
    # Submit tasks to the executor
    results = [executor.submit(task, i) for i in range(WORKER_NUM)]

    # Retrieve results as they become available
    for future in concurrent.futures.as_completed(results):
        result = future.result()
        logger.info(result)
