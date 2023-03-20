import concurrent.futures
import json
import os
import subprocess
import sys
import time
from urllib import parse
import uuid

import boto3
import requests
import shortuuid
import pydig
from urllib.parse import urlparse
from botocore.exceptions import WaiterError
from botocore.exceptions import ClientError

URL_SUFFIX = '.cloudfront.net'
cf_client = boto3.client('cloudfront')
SLEEP_TIME = 6
RETRY_COUNT = 604800


def gen_pop_url(parsed_url, pop, cf_domain_prefix):
    if 0 == len(parsed_url.query):
        return cf_domain_prefix + '.' + pop + '.cloudfront.net' + parsed_url.path + parsed_url.query + parsed_url.fragment
    else:
        return cf_domain_prefix + '.' + pop + '.cloudfront.net' + parsed_url.path + '?' + parsed_url.query + parsed_url.fragment


def replace_url(parsed_url, cf_domain):
    parsed_url = parsed_url._replace(netloc=cf_domain)

    return parsed_url


def get_cf_domain_prefix(parsed_url):
    return parsed_url.netloc.replace(URL_SUFFIX, '')


def cf_invalidation_status(cf_client, dist_id, inv_id):
    try:
        waiter = cf_client.get_waiter('invalidation_completed')
        waiter.wait(
            DistributionId=dist_id,
            Id=inv_id,
            WaiterConfig={
                'Delay': 4,
                'MaxAttempts': 120
            }
        )
        print('CloudFront invalidation completed')

        return True
    except WaiterError as we:
        print('Get invalidation status fail: ' + str(we))

        return False
    except Exception as ex:
        print('Get invalidation status fail: ' + str(ex))

        return False


def download_file(url, cf_domain):
    local_filename = shortuuid.uuid() + url.split('/')[-1]
    with requests.get(url, headers={'Accept-Encoding': 'gzip, deflate, br', 'Host': cf_domain}, stream=True,
                      timeout=5) as r:
        r.raise_for_status()
        with open(local_filename, 'wb') as f:
            for chunk in r.iter_content(chunk_size=1024):
                if chunk:
                    f.write(chunk)

    return local_filename


def download_file_with_curl(url, cf_domain, original_url):
    # download the prewarm file to /dev/null to increase prewarm speed
    print(
        f'Entering download_file_with_curl function with url: {url}, with cf_domain:{cf_domain}, with original_url:{original_url}')

    # First get the ip address of the pop server
    popList = []
    pop_domain = urlparse(url).netloc
    popList = pydig.query(pop_domain, 'A')
    print(popList)
    popAddress = popList[0]

    # Get the original url domain name
    parsed_url = urlparse(original_url)
    original_domain = parsed_url.netloc
    print(original_domain)  # 'www.example.com'```

    local_filename = '/dev/null'

    command = [
        "curl",
        "-D",
        "-",
        "-H",
        f"Host:{original_domain}",
        "--resolve",
        f"{original_domain}:443:{popAddress}",
        "-H",
        "Accept-Encoding: gzip, deflate, br",
        "-o",
        local_filename,
        original_url,
    ]

    print(command)
    try:
        result = subprocess.run(command)
    except Exception as e:
        raise Exception(f'Failed to download file with curl command:{command}, exception: {e}')

    return local_filename


def pre_warm(url, pop, cf_domain, protocol, original_url):
    try:
        print(
            f'Entering pre_warm function with url: {url}, with pop:{pop}, with protocol:{protocol}, with original_url:{original_url}')
        if protocol == 'http':
            local_file_name = download_file('http://' + url, cf_domain)
        else:
            local_file_name = download_file_with_curl('https://' + url, cf_domain, original_url)

        if os.path.exists(local_file_name):
            print(
                f'Prewarm succeeded, PoP: {pop}, Url: {url}, Downloaded file name: {local_file_name}')
            os.remove(local_file_name)

            return {
                'pop': pop,
                'statusCode': 200
            }
        else:
            print(f'Failed: PoP => {pop}, Url => {url}, Download interrupted')

            return {
                'pop': pop,
                'statusCode': -1,
                'errorMsg': f'Failed: PoP => {pop}, Url => {url}, Download interrupted'
            }
    except Exception as e:
        print(f'Failed: PoP => {pop}, Url => {url} with exception => {e}')
        print(str(e))

        return {
            'pop': pop,
            'statusCode': -1,
            'errorMsg': f'Failed: PoP => {pop}, Url => {url} with exception => {e}'
        }


def get_messages_from_queue(client, queue_url):
    response = client.receive_message(
        QueueUrl=queue_url,
        MaxNumberOfMessages=4,
        WaitTimeSeconds=3,
        VisibilityTimeout=180 * 60
    )
    if "Messages" in response:
        return response["Messages"]
    return []


def get_node_pre_set(node_list):
    rlt_set = set()
    if len(node_list) == 0:
        return rlt_set
    for i in node_list:
        rlt_set.add(i[0:3])
    return rlt_set


def prewarm_handler(queue_url, ddb_table_name, aws_region, thread_concurrency, cf_client):
    sqs = boto3.client('sqs', region_name=aws_region)
    dynamodb_client = boto3.resource('dynamodb', region_name=aws_region)
    table = dynamodb_client.Table(ddb_table_name)

    # Keep waiting new messages sent into the queue
    while True:
        queue_messages = get_messages_from_queue(sqs, queue_url)
        if len(queue_messages) > 0:
            print(str(len(queue_messages)) + ' message found')
            table_items = []
            entries = []
            for message in queue_messages:
                event_body = json.loads(message['Body'])
                receipt = message['ReceiptHandle']
                url = event_body['url']
                cf_domain = event_body['domain']
                pop_list = event_body['pop']
                req_id = event_body['reqId']
                dist_id = event_body['distId']
                create_time = event_body['create_time']
                inv_id = event_body['invId']
                success_list = []
                failure_list = []
                error_msg = []

                ddb_response = table.get_item(
                    Key={
                        'reqId': req_id,
                        'url': 'metadata',
                    }
                )
                if 'Item' in ddb_response:
                    protocol = ddb_response['Item']['protocol']
                else:
                    protocol = 'http'

                parsed_url = parse.urlsplit(url)
                # replace url according to cf_domain
                parsed_url = replace_url(parsed_url, cf_domain)
                cf_domain_prefix = get_cf_domain_prefix(parsed_url)
                invalidation_result = True

                # invalidate CloudFront cache
                if inv_id != None:
                    if inv_id == 'CreateInvalidationError':
                        invalidation_result = False
                    else:
                        invalidation_result = cf_invalidation_status(cf_client,
                            dist_id, inv_id)

                if invalidation_result:
                    with concurrent.futures.ThreadPoolExecutor(thread_concurrency) as executor:
                        futures = []
                        for pop in pop_list:
                            pop = pop.strip()
                            target_url = gen_pop_url(
                                parsed_url, pop, cf_domain_prefix)
                            futures.append(executor.submit(
                                pre_warm, target_url, pop, cf_domain, protocol, url))

                        for future in concurrent.futures.as_completed(futures):
                            print(future.result())
                            if future.result()['statusCode'] == 200:
                                success_list.append(future.result()['pop'])
                            else:
                                failure_list.append(future.result()['pop'])
                                error_msg.append(future.result()['errorMsg'])
                    success_pre_map = get_node_pre_set(success_list)
                    failure_pre_map = get_node_pre_set(failure_list)

                    if len(success_list) == len(pop_list):
                        url_status = 'SUCCESS'
                    else:
                        # 遍历失败列表 如果所有失败列表前缀在成功列表中都有 标识成功 否则失败
                        url_status = 'SUCCESS'
                        for i in failure_pre_map:
                            if i not in success_pre_map:
                                url_status = 'FAIL'
                                break
                else:
                    print('Fail to create invalidation or check invalidation status')
                    url_status = 'FAIL'

                # Delete the message from queue after it is handled
                # sqs.delete_message(
                #     QueueUrl=queue_url,
                #     ReceiptHandle=receipt
                # )
                entry = {
                    'Id': str(uuid.uuid4().int)[-22:],
                    'ReceiptHandle': receipt
                }
                entries.append(entry)

                table_item = {
                    "createTime": create_time,
                    "status": url_status,
                    "success": success_list,
                    "failure": failure_list,
                    "reqId": req_id,
                    "url": url,
                    "errorMsg": error_msg
                }
                print(table_item)
                # ddb_resp = table.put_item(Item=table_item)
                # print(ddb_resp)
                table_items.append(table_item)
            try:
                with table.batch_writer() as writer:
                    for table_item in table_items:
                        writer.put_item(Item=table_item)
                sqs.delete_message_batch(
                    QueueUrl=queue_url,
                    Entries=entries
                )
            except ClientError as err:
                print(
                    "Couldn't load data into table %s. Here's why: %s: %s", table.name,
                    err.response['Error']['Code'], err.response['Error']['Message'])
        print('No message found, wait ' + str(SLEEP_TIME) + ' seconds')
        time.sleep(SLEEP_TIME)


if __name__ == "__main__":
    queue_url = sys.argv[1]
    ddb_table_name = sys.argv[2]
    aws_region = sys.argv[3]
    thread_concurrency = int(sys.argv[4])
    print(queue_url)
    print(ddb_table_name)
    print(aws_region)
    print(str(thread_concurrency))
    prewarm_handler(queue_url, ddb_table_name, aws_region, thread_concurrency, cf_client)
