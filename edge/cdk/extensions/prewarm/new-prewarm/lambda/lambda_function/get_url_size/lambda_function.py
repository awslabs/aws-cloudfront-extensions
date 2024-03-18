import urllib.request
import concurrent.futures
import boto3
import os
from urllib import parse
import json

table_name = os.environ['REQUEST_TABLE_NAME']
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(table_name)
lambda_client = boto3.client('lambda')

def get_cf_url(cf_domain, original_url):
    parsed_url = parse.urlsplit(original_url)
    parsed_url = parsed_url._replace(netloc=cf_domain)
    return parse.urlunsplit(parsed_url)

def send_head_request(cf_domain, original_url):

    url = get_cf_url(cf_domain, original_url)

    result = {
        'original_url': original_url,
        'url': url,
        'status_code': 0,
        'size': 0,
    }

    try:
        req = urllib.request.Request(url, method='HEAD')
        with urllib.request.urlopen(req) as response:
            headers = response.info()
            
            end_bytes = int(headers.get('Content-Length', 0))

            result['size'] = end_bytes
            
            return result
            
            # return headers
    except urllib.error.HTTPError as errh:
        print("HTTP Error:", errh)
        result['status_code'] = -1
        return result
    except urllib.error.URLError as erru:
        print("URL Error:", erru)
        result['status_code'] = -1
        return result
    except Exception as err:
        print("Something went wrong:", err)
        result['status_code'] = -1
        return result

def lambda_handler(event, context):
    
    record = event['Records'][0]

    # Only process INSERT event
    if record['eventName'] != 'INSERT':
        return

    success_url = []
    failed_url = []
    small_url = []
    total_bytes = 0
    original_urls = []

    req_item = record['dynamodb']['NewImage']

    print(req_item)

    req_id = req_item['req_id']['S']
    bucket_name = req_item['url_path']['M']['bucket']['S']
    key = req_item['url_path']['M']['key']['S']
    cf_domain = req_item['cf_domain']['S']
    pops = req_item['pops']['L']
    
    # Get txt file from S3 and save it to /tmp/
    s3 = boto3.client('s3')
    s3.download_file(bucket_name, key, '/tmp/original_urls.txt')

    # Read txt file line by line and get string array
    with open('/tmp/original_urls.txt', 'r') as f:
        original_urls = f.readlines()
        original_urls = [original_url.strip() for original_url in original_urls]
    print(len(original_urls))

    # Create a ThreadPoolExecutor with maximum 2 worker threads
    with concurrent.futures.ThreadPoolExecutor(max_workers=50) as executor:
        # Submit tasks to the executor
        results = [executor.submit(send_head_request, cf_domain, original_url) for original_url in original_urls]
        
        # Retrieve results as they become available
        for future in concurrent.futures.as_completed(results):
            result = future.result()

            if result['status_code'] == -1:
                failed_url.append(result['original_url'])
            else:
                if result['size'] < 1073741824:
                    # smaller than 1GB
                    small_url.append(result['original_url'])
                else:   
                    success_url.append(result['original_url'])
                total_bytes = total_bytes + result['size']

    success_url.extend(small_url)

    # write success urls in a txt file and upload to s3
    success_key = '{}/success_urls.txt'.format(req_id)
    with open('/tmp/success_urls.txt', 'w') as f:
        f.write('\n'.join(success_url))
    s3_client = boto3.client('s3')
    s3_client.upload_file('/tmp/success_urls.txt', bucket_name, Key=success_key)

    # write failed urls in a txt file and upload to s3
    failed_key = '{}/failed_urls.txt'.format(req_id)
    with open('/tmp/failed_urls.txt', 'w') as f:
        f.write('\n'.join(failed_url))
    s3_client.upload_file('/tmp/failed_urls.txt', bucket_name, Key=failed_key)

    # write total size to dynamodb
    response = table.update_item(
                Key={'req_id': req_id},
                UpdateExpression='SET #status = :s, url_size = :val, success_url_count = :suc, failed_url_count = :fail',
                ExpressionAttributeNames={
                    '#status': 'status'
                    },
                ExpressionAttributeValues={
                    ':s': 'CHECK_POP',
                    ':val': total_bytes,
                    ':suc': len(success_url),
                    ':fail': len(failed_url),
                    }
            )
    print(response)

    # invoke lambda function

    payload = {
        'req_id': req_id,
        'pops': pops,
        'cf_domain': cf_domain,
        'success_url_count': len(success_url)
    }

    lambda_client.invoke(
        FunctionName=os.environ['TASK_LAMBDA_ARN'], 
        InvocationType='Event',
        Payload=json.dumps(payload).encode('UTF-8')
        )
    
    
    return total_bytes