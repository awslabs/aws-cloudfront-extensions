import csv
import ipaddress
import base64
import json
import logging
import datetime

log = logging.getLogger()
log.setLevel('INFO')


# Signature for all Lambda functions that user must implement
def lambda_handler(firehose_records_input, context):
    log.info("Received records for processing from DeliveryStream: " +
             firehose_records_input['deliveryStreamArn'] + ", Region: " +
             firehose_records_input['region'] + ", and InvocationId: " +
             firehose_records_input['invocationId'])

    # Create return value.
    firehose_records_output = {'records': []}

    # Create result object.
    # Go through records and process them

    for firehose_record_input in firehose_records_input['records']:
        # Get user payload
        payload_bytes = base64.b64decode(firehose_record_input['data'])
        payload = "".join(map(chr, payload_bytes))

        payload_list = payload.strip().split('\t')
        cs_host = payload_list[7].strip()
        c_ip = payload_list[1].strip()
        version = validate_ip_version(c_ip)
        isp = isp_from_ip(c_ip, version)
        if version == "invalid":
            log.info("The ip address " + c_ip + " is invalid")
            continue
        country_name = country_code_from_geo_name(
            geo_name_from_ip(c_ip, version))
        content = payload.strip().split('\n')[0]
        payload = content + '\t' + isp + '\t' + country_name + '\n'
        log.info("New payload: " + payload)
        payload_encoded_ascii = payload.encode('ascii')
        payload_base64 = base64.b64encode(payload_encoded_ascii).decode(
            "utf-8")
        log.info(payload_base64)

        log.info("Record that was received")
        # Create output Firehose record and add modified payload and record ID to it.
        firehose_record_output = {}
        event_timestamp = datetime.datetime.fromtimestamp(
            int(float(payload_list[0])))
        partition_keys = {
            "domain": cs_host,
            "year": event_timestamp.strftime('%Y'),
            "month": event_timestamp.strftime('%m'),
            "day": event_timestamp.strftime('%d'),
            "hour": event_timestamp.strftime('%H'),
            "minute": event_timestamp.strftime('%M')
        }

        # Create output Firehose record and add modified payload and record ID to it.
        firehose_record_output = {
            'recordId': firehose_record_input['recordId'],
            'data': payload_base64,
            'result': 'Ok',
            'metadata': {
                'partitionKeys': partition_keys
            }
        }
        firehose_records_output['records'].append(firehose_record_output)

    log.info(json.dumps(firehose_records_output))

    # At the end return processed records
    return firehose_records_output


def isp_from_ip(ip, version):
    # Read from IPv4.csv or IPv6.csv according to the ip version
    with open('./GeoLite2-ASN-Blocks-' + version + '.csv') as csvfile:
        reader = csv.reader(csvfile, delimiter=',')
        for row in reader:
            if row[0] != 'network':
                try:
                    if version == 'IPv4':
                        if ipaddress.IPv4Address(ip) in ipaddress.IPv4Network(
                                row[0]):
                            return row[2]
                    elif version == 'IPv6':
                        if ipaddress.IPv6Address(ip) in ipaddress.IPv6Network(
                                row[0]):
                            return row[2]
                except:
                    log.info("Error: " + str(row))

    return 'NotFound'


def geo_name_from_ip(ip, version):
    with open('./GeoLite2-Country-Blocks-' + version + '.csv') as csvfile:
        reader = csv.reader(csvfile, delimiter=',')
        for row in reader:
            if row[0] != 'network':
                try:
                    if version == 'IPv4':
                        if ipaddress.IPv4Address(ip) in ipaddress.IPv4Network(
                                row[0]):
                            return row[1]
                    elif version == 'IPv6':
                        if ipaddress.IPv6Address(ip) in ipaddress.IPv6Network(
                                row[0]):
                            return row[1]
                except:
                    log.info("Error: " + str(row))

    return 'NotFound'


def country_code_from_geo_name(name):
    with open('./GeoLite2-Country-Locations-en.csv') as csvfile:
        reader = csv.reader(csvfile, delimiter=',')
        for row in reader:
            if row[0] != 'geoname_id':
                try:
                    if row[0] == name:
                        return row[4]
                except:
                    log.info("Error: " + str(row))

    return 'NotFound'


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
