import gzip
import logging
import os
from datetime import datetime
import boto3
import zipfile

# DOMAIN_S3_BUCKET = os.environ['S3_BUCKET']
SEP = '\x01'
DELAY_HOUR = 2

log = logging.getLogger()
log.setLevel('INFO')

cf_client = boto3.client("cloudfront")

def get_alias_or_domain_name(distribution_id):
    response = cf_client.get_distribution(Id=distribution_id)
    aliases = response['Distribution']['DistributionConfig']['Aliases']
    aliases_qty = aliases['Quantity']
    if int(aliases_qty) > 0:
        return aliases['Items'][0]
    else:
        return response['Distribution']['DomainName']


def split_gz_file(s3, file_path, bucket_name, zip_file_number, max_size=100*1024*1024):
    content = ""
    with gzip.open(file_path, 'rt') as f:
        for line in f:
            content += line
            if len(content) >= max_size:                
                with open('temp_exceed.log', 'w') as f:
                    f.write(content)
                # Add the log file to the zip
                zip_file = zipfile.ZipFile(f'exceed{zip_file_number}.zip', 'w')
                zip_file.write('temp_exceed.log')
                zip_file.close()
                # Upload the zipped file to S3
                with open(f'exceed{zip_file_number}.zip', 'rb') as data:
                    s3.upload_fileobj(data, bucket_name, f'exceed_zipped_file{zip_file_number}.zip')
                content = ""
                # Start a new zip file
                zip_file_number += 1
                # Remove the temporary files
                os.remove('temp_exceed.log')

        # Handle last part
        if len(content) > 0:
            with open('temp_exceed.log', 'w') as f:
                f.write(content)
            zip_file = zipfile.ZipFile(f'exceed{zip_file_number}.zip', 'w')
            zip_file.write('temp_exceed.log')
            zip_file.close()
            # Upload the last zipped file to S3
            with open(f'exceed{zip_file_number}.zip', 'rb') as data:
                s3.upload_fileobj(data, bucket_name, f'exceed_zipped_file{zip_file_number}.zip')
            os.remove('temp_exceed.log')
            zip_file_number += 1

    return zip_file_number


def zip_and_upload_files(bucket_name, prefix, local_path, max_size=100 * 1024 * 1024):
    s3 = boto3.client('s3')    
    # Get a list of all objects in the S3 bucket with the specified prefix
    objects = s3.list_objects_v2(Bucket=bucket_name, Prefix=prefix)
    sorted_json_list = sorted(objects.get('Contents', []), key=lambda x: x['LastModified'])
    print(sorted_json_list)

    zip_file_number = 1
    combine_content = ""

    # Iterate over all gz files in the bucket
    for obj in sorted_json_list:
        if obj['Key'].endswith('.gz'):
            # Download the gz file from S3
            s3.download_file(bucket_name, obj['Key'], 'temp.gz')
            total_size = os.path.getsize('temp.gz')
            # If exceeds 100MB, then split it
            print(total_size)
            if total_size > max_size:
                print("exceeds")
                if len(combine_content) > 0:
                    print("Write left small chunk before large chunk")
                    zip_file = zipfile.ZipFile(f'local{zip_file_number}.zip', 'w')
                    with open('temp.log', 'w') as f:
                        f.write(combine_content)
                    zip_file.write('temp.log')
                    zip_file.close()
                    combine_content = ""
                    # Upload the last zipped file to S3
                    with open(f'local{zip_file_number}.zip', 'rb') as data:
                        s3.upload_fileobj(data, bucket_name, f'zipped_file{zip_file_number}.zip')
                    os.remove('temp.log')
                    zip_file_number += 1

                zip_file_number = split_gz_file(s3, 'temp.gz', bucket_name, zip_file_number, max_size)
                print(zip_file_number)
                os.remove('temp.gz')
            else:
                print("not exceed")
                # Combine small gz to one zip file
                with gzip.open('temp.gz', 'rt') as f:
                    content = f.read()
                    combine_content += content
                os.remove('temp.gz')

                if len(combine_content) > max_size:  # 100MB
                    # Write the content to a txt file
                    with open('temp.log', 'w') as f:
                        f.write(combine_content)
                    # Add the txt file to the zip
                    zip_file = zipfile.ZipFile(f'local{zip_file_number}.zip', 'w')
                    zip_file.write('temp.log')
                    zip_file.close()
                    combine_content = ""
                    # Upload the zipped file to S3
                    with open(f'local{zip_file_number}.zip', 'rb') as data:
                        s3.upload_fileobj(data, bucket_name, f'zipped_file{zip_file_number}.zip')
                    os.remove('temp.log')
                    # Start a new zip file
                    zip_file_number += 1
                    
    # Add the last file to the zip if not exceed max size
    if len(combine_content) > 0:
        with open('temp.log', 'w') as f:
            f.write(combine_content)
        zip_file.write('temp.log')
        zip_file.close()
        # Upload the last zipped file to S3
        with open(f'local{zip_file_number}.zip', 'rb') as data:
            s3.upload_fileobj(data, bucket_name, f'zipped_file{zip_file_number}.zip')
        os.remove('temp.log')
    
    # TODO: Remove the local zip files
    # for i in range(1, zip_file_number + 1):
    #     os.remove(f'local{i}.zip')
    #     os.remove(f'exceed{i}.zip')

# Call the function
# zip_and_upload_files('cloudfrontextnconsolestack--cfdomainbucketb072afab-bcxfrspexxnd', 'year=2024/month=02/day=27/hour=03/dist=E1JMMV6MX41XUX/', '.')
# combine_logs("cloudfrontextnconsolestack--cfdomainbucketb072afab-bcxfrspexxnd", "year=2024/month=02/day=27/hour=03/dist=E1JMMV6MX41XUX/", "combined_logs")

def main():
    now = datetime.now()
    year = str(now.year)
    month = now.strftime('%m')
    day = now.strftime('%d')
    now_hour = now.hour
    # 2 hour delay to wait for logs generated
    hour = now_hour - DELAY_HOUR
    
    if hour < 10:
        str_hour = f"0{str(hour)}"
    else:
        str_hour = str(hour)

    dest = 'year={}/month={}/day={}/hour={}/dist={}/'\
        .format(year, month, day, str_hour, "sdfsdkljflk")
    print(dest)

zip_and_upload_files('cloudfrontextnconsolestack--cfdomainbucketb072afab-bcxfrspexxnd', 'year=2024/month=02/day=27/hour=03/dist=E1JMMV6MX41XUX/', '.', max_size=3*1024)
main()
