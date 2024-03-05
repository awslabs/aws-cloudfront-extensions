import gzip
import csv
import ipaddress
import logging
import os
import re
from datetime import datetime
from os import environ
from sqlite3 import Timestamp

import boto3

DELETE_LOG = os.environ['DELETE_LOG']
DOMAIN_S3_BUCKET = os.environ['DOMAIN_S3']
SEP = '\x01'

log = logging.getLogger()
log.setLevel('INFO')

asn_list_v4_ip = []
asn_list_v4 = []
asn_list_v6 = {}
geo_list_v4_ip = []
geo_list_v4 = []
geo_list_v6 = {}
country_code_list_id = []
country_code_list = []

log.info("Start to read file")

with open('./GeoLite2-ASN-Blocks-IPv4.csv') as csvfile_asn_v4:
    reader_asn_v4 = csv.reader(csvfile_asn_v4, delimiter=',')
    for row in reader_asn_v4:
        asn_list_v4_ip.append(row[0])
        asn_list_v4.append(row[2])

with open('./GeoLite2-ASN-Blocks-IPv6.csv') as csvfile_asn_v6:
    reader_asn_v6 = csv.reader(csvfile_asn_v6, delimiter=',')
    for row in reader_asn_v6:
        asn_list_v6[row[0]] = row[2]

with open('./GeoLite2-Country-Blocks-IPv4.csv') as csvfile_geo_v4:
    reader_geo_v4 = csv.reader(csvfile_geo_v4, delimiter=',')
    for row in reader_geo_v4:
        geo_list_v4_ip.append(row[0])
        geo_list_v4.append(row[1])

with open('./GeoLite2-Country-Blocks-IPv6.csv') as csvfile_geo_v6:
    reader_geo_v6 = csv.reader(csvfile_geo_v6, delimiter=',')
    for row in reader_geo_v6:
        geo_list_v6[row[0]] = row[1]

with open('./GeoLite2-Country-Locations-en.csv') as csvfile_country_code:
    reader_country_code = csv.reader(csvfile_country_code, delimiter=',')
    for row in reader_country_code:
        country_code_list_id.append(row[0])
        country_code_list.append(row[4])

log.info("End to read file")


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
                # 'athena_results/' not in key
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
                    updated_content_domain = ''
                    
                    for row_item in rows:
                        if row_item.startswith('#Version:'):
                            updated_content += row_item + '\n'
                            # Can be deleted
                            # updated_content_domain += row_item + '\n'
                        elif row_item.startswith('#Fields:'):
                            updated_content += '#Fields:\ttimestamp\tsc-bytes\tc-ip\tcs-host\tcs-uri-stem\tsc-status\tcs-bytes\ttime-taken\tx-edge-response-result-type\tx-edge-detailed-result-type\tc-country\n'
                            # Can be deleted
                            # title_list = ["time_local", "remote_addr", "server_ip", "host", "url", "req_args", "status", "bytes_send", "body_bytes_sent", "range", "request_time", "user_agent", "scheme", "referer", "hit", "x_log_id"]
                            # title_temp = SEP.join(title_list)
                            # updated_content_domain += (title_temp + '\n')
                        else:
                            fields = row_item.split('\t')
                            if len(fields) > 1:
                                timestamp_logging = fields[0].strip().replace("-", "/") + " " + fields[1].strip()
                                timestamp = str(int(datetime.timestamp(datetime.strptime(fields[0].strip() + fields[1].strip(), "%Y-%m-%d%H:%M:%S"))))
                                c_ip = fields[4]
                                version = validate_ip_version(c_ip)
                                if version == "invalid":
                                    log.info("The ip address " + c_ip + " is invalid")
                                    continue
                                country_name = country_code_from_geo_name(geo_name_from_ip(c_ip, version))
                                
                                range_start = str(fields[31])
                                range_end = str(fields[32])
                                if range_start == "-":
                                    range_start = ""
                                if range_end == "-":
                                    range_end = ""
                                start_end_range = f"{range_start}-{range_end}"

                                edge_result_type = fields[13]
                                cache_status = 0 # Hit: 1, Miss:0
                                if edge_result_type in ["Hit", "RefreshHit"]:
                                    cache_status = 1

                                # cs-host is refered to x-host-header
                                updated_content += timestamp + '\t' + fields[3] + '\t' + fields[4] + '\t' + fields[15] + '\t' + fields[7] + '\t' + fields[8] + '\t' + fields[17] + '\t' + fields[18] + '\t' + fields[22] + '\t' + fields[28] + '\t' + country_name + '\n'
                                field_list = [ timestamp_logging, c_ip, fields[2], fields[15], fields[7], str(fields[11]), fields[8], fields[3], str(fields[30]), start_end_range, fields[18], str(fields[10]), str(fields[16]), str(fields[9]), str(cache_status), fields[14]]
                                field_temp = SEP.join(field_list)
                                updated_content_domain += (field_temp + '\n')
                    
                    compressed_content = gzip.compress(updated_content.encode())
                    compressed_content_domain = gzip.compress(updated_content_domain.encode())
                    s3.put_object(Body=compressed_content, Bucket=bucket, Key=dest)
                    # For logging API
                    s3.put_object(Body=compressed_content_domain, Bucket=DOMAIN_S3_BUCKET, Key=dest)
    
                    log.info(
                        "\n[partition_s3_logs lambda_handler] Update file %s to destination %s" % (source_path, dest_path))
                    
                    if DELETE_LOG.lower() == 'true':
                        s3.delete_object(Bucket=bucket, Key=key)
                        log.info("\n[partition_s3_logs lambda_handler] Removed file %s" % source_path)
                    
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


def bin_search(data_list, val):
    low = 0
    high = len(data_list) - 1
    while low <= high:
        mid = (low + high) // 2
        if val in ipaddress.IPv4Network(data_list[mid]):
            return mid
        elif ipaddress.IPv4Network(data_list[mid])[0] > val:
            high = mid - 1
        else:
            low = mid + 1
    return -1


def bin_search_country(data_list, val):
    low = 0
    high = len(data_list) - 1
    while low <= high:
        mid = (low + high) // 2
        if data_list[mid] == val:
            return mid
        elif data_list[mid] > val:
            high = mid - 1
        else:
            low = mid + 1
    return -1


def isp_from_ip(ip, version):
    try:
        if version == 'IPv4':
            val = ipaddress.IPv4Address(ip)
            index = bin_search(asn_list_v4_ip, val)
            return asn_list_v4[index]
        elif version == 'IPv6':
            for asn_key in asn_list_v6.keys():
                if ipaddress.IPv6Address(ip) in ipaddress.IPv6Network(asn_key):
                    return asn_list_v6[asn_key]
    except Exception as e:
        log.info("Error: " + str(ip))
        log.info(e)

    return 'NotFound'


def geo_name_from_ip(ip, version):
    try:
        if version == 'IPv4':
            val = ipaddress.IPv4Address(ip)
            index = bin_search(geo_list_v4_ip, val)
            return geo_list_v4[index]
        elif version == 'IPv6':
            for geo_key in geo_list_v6.keys():
                if ipaddress.IPv6Address(ip) in ipaddress.IPv6Network(geo_key):
                    return geo_list_v6[geo_key]
    except Exception as e:
        log.info("Error: " + str(ip))
        log.info(e)

    return 'NotFound'


def country_code_from_geo_name(name):
    if name == 'NotFound':
        return name
    
    index = bin_search_country(country_code_list_id, name)

    return country_code_list[index]


def validate_ip_version(address):
    try:
        ip = ipaddress.ip_address(address)

        if isinstance(ip, ipaddress.IPv4Address):
            return 'IPv4'
        elif isinstance(ip, ipaddress.IPv6Address):
            return 'IPv6'
    except ValueError:
        return 'invalid'

    return 'invalid'

