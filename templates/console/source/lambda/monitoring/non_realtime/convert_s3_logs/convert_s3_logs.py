import gzip
import os
import boto3
import zipfile
import sys
import json
import time

SEP = '\x01'
DELAY_HOUR = 2
SLEEP_TIME = 5

cf_client = boto3.client("cloudfront")
s3 = boto3.client('s3')


def split_gz_file(s3, file_path, bucket_name, log_name_prefix, zip_file_number, max_size=100*1024*1024):
    content = ""
    with gzip.open(file_path, 'rt') as f:
        for line in f:
            content += line
            if len(content) >= max_size:                
                with open(f'{log_name_prefix}_{zip_file_number}.log', 'w') as f:
                    f.write(content)
                # Add the log file to the zip
                zip_file = zipfile.ZipFile(f'{log_name_prefix}_{zip_file_number}.zip', 'w', zipfile.ZIP_DEFLATED)
                zip_file.write(f'{log_name_prefix}_{zip_file_number}.log')
                zip_file.close()
                # Upload the zipped file to S3
                with open(f'{log_name_prefix}_{zip_file_number}.zip', 'rb') as data:
                    s3.upload_fileobj(data, bucket_name, f'{log_name_prefix}_{zip_file_number}.zip')
                content = ""
                os.remove(f'{log_name_prefix}_{zip_file_number}.log')
                # Start a new zip file
                zip_file_number += 1

        # Handle last part
        if len(content) > 0:
            with open(f'{log_name_prefix}_{zip_file_number}.log', 'w') as f:
                f.write(content)
            zip_file = zipfile.ZipFile(f'{log_name_prefix}_{zip_file_number}.zip', 'w', zipfile.ZIP_DEFLATED)
            zip_file.write(f'{log_name_prefix}_{zip_file_number}.log')
            zip_file.close()
            # Upload the last zipped file to S3
            with open(f'{log_name_prefix}_{zip_file_number}.zip', 'rb') as data:
                s3.upload_fileobj(data, bucket_name, f'{log_name_prefix}_{zip_file_number}.zip')
            os.remove(f'{log_name_prefix}_{zip_file_number}.log')
            zip_file_number += 1

    return zip_file_number


def zip_and_upload_files(bucket_name, prefix, log_name_prefix, local_path, max_size=100 * 1024 * 1024):
    # Get a list of all objects in the S3 bucket with the specified prefix
    objects = s3.list_objects_v2(Bucket=bucket_name, Prefix=prefix)
    sorted_json_list = sorted(objects.get('Contents', []), key=lambda x: x['LastModified'])
    print(sorted_json_list)

    zip_file_number = 1
    combine_content = ""

    # Iterate over all gz files in the bucket
    for obj in sorted_json_list:
        if obj['Key'].endswith('.gz'):
            s3.download_file(bucket_name, obj['Key'], 'temp.gz')
            total_size = os.path.getsize('temp.gz')
            # If exceeds max size (default 100MB), then split it
            print(total_size)
            if total_size > max_size:
                print("File exceeds max size")
                if len(combine_content) > 0:
                    print("Write left small chunk before large chunk")
                    zip_file = zipfile.ZipFile(f'{log_name_prefix}_{zip_file_number}.zip', 'w', zipfile.ZIP_DEFLATED)
                    with open(f'{log_name_prefix}_{zip_file_number}.log', 'w') as f:
                        f.write(combine_content)
                    zip_file.write(f'{log_name_prefix}_{zip_file_number}.log')
                    zip_file.close()
                    combine_content = ""
                    # Upload the last zipped file to S3
                    with open(f'{log_name_prefix}_{zip_file_number}.zip', 'rb') as data:
                        s3.upload_fileobj(data, bucket_name, f'{log_name_prefix}_{zip_file_number}.zip')
                    os.remove(f'{log_name_prefix}_{zip_file_number}.log')
                    zip_file_number += 1

                zip_file_number = split_gz_file(s3, 'temp.gz', bucket_name, log_name_prefix, zip_file_number, max_size)
                print(zip_file_number)
                os.remove('temp.gz')
            else:
                print("File not exceed max size")
                # Combine small gz to one zip file
                with gzip.open('temp.gz', 'rt') as f:
                    content = f.read()
                    combine_content += content
                os.remove('temp.gz')

                if len(combine_content) > max_size:  # 100MB
                    # Write the content to a txt file
                    with open(f'{log_name_prefix}_{zip_file_number}.log', 'w') as f:
                        f.write(combine_content)
                    # Add the txt file to the zip
                    zip_file = zipfile.ZipFile(f'{log_name_prefix}_{zip_file_number}.zip', 'w', zipfile.ZIP_DEFLATED)
                    zip_file.write(f'{log_name_prefix}_{zip_file_number}.log')
                    zip_file.close()
                    combine_content = ""
                    # Upload the zipped file to S3
                    with open(f'{log_name_prefix}_{zip_file_number}.zip', 'rb') as data:
                        s3.upload_fileobj(data, bucket_name, f'{log_name_prefix}_{zip_file_number}.zip')
                    os.remove(f'{log_name_prefix}_{zip_file_number}.log')
                    # Start a new zip file
                    zip_file_number += 1
                    
    # Add the last file to the zip if not exceed max size
    if len(combine_content) > 0:
        with open(f'{log_name_prefix}_{zip_file_number}.log', 'w') as f:
            f.write(combine_content)
        zip_file = zipfile.ZipFile(f'{log_name_prefix}_{zip_file_number}.zip', 'w', zipfile.ZIP_DEFLATED)
        zip_file.write(f'{log_name_prefix}_{zip_file_number}.log')
        zip_file.close()
        # Upload the last zipped file to S3
        with open(f'{log_name_prefix}_{zip_file_number}.zip', 'rb') as data:
            s3.upload_fileobj(data, bucket_name, f'{log_name_prefix}_{zip_file_number}.zip')
        os.remove(f'{log_name_prefix}_{zip_file_number}.log')
    
    # Remove the local zip files
    for i in range(1, zip_file_number + 1):
        if os.path.exists(f'{log_name_prefix}_{i}.zip'):
            os.remove(f'{log_name_prefix}_{i}.zip')
            print(f'{log_name_prefix}_{i}.zip removed')


def get_messages_from_queue(client, queue_url):
    response = client.receive_message(
        QueueUrl=queue_url,
        MaxNumberOfMessages=1,
        WaitTimeSeconds=3,
        VisibilityTimeout=120 * 60
    )
    if "Messages" in response:
        return response["Messages"]
    return []


if __name__ == "__main__":
    queue_url = sys.argv[1]
    aws_region = sys.argv[2]
    bucket_name = sys.argv[3]
    print(queue_url)
    print(aws_region)
    print(bucket_name)
    sqs = boto3.client('sqs', region_name=aws_region)

    while True:
        queue_messages = get_messages_from_queue(sqs, queue_url)
        print("Queued message")
        print(queue_messages)
        if len(queue_messages) > 0:
            for message in queue_messages:
                event_body = json.loads(message['Body'])
                print(f"Handle message body: {event_body}")
                s3_prefix = event_body['s3_prefix']
                domain = event_body['domain']
                log_name_prefix = event_body['log_name_prefix']
                # Customize max size here
                zip_and_upload_files(bucket_name, s3_prefix, log_name_prefix, '.')
        time.sleep(SLEEP_TIME)
