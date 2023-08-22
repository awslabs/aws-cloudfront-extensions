import csv
import ipaddress
import base64
import json
import logging
import datetime

log = logging.getLogger()
log.setLevel("INFO")

asn_list_v4_ip = []
asn_list_v4 = []
asn_list_v6 = {}
geo_list_v4_ip = []
geo_list_v4 = []
geo_list_v6 = {}
country_code_list_id = []
country_code_list = []

log.info("Start to read file")

with open("./GeoLite2-ASN-Blocks-IPv4.csv") as csvfile_asn_v4:
    reader_asn_v4 = csv.reader(csvfile_asn_v4, delimiter=",")
    for row in reader_asn_v4:
        asn_list_v4_ip.append(row[0])
        asn_list_v4.append(row[2])

with open("./GeoLite2-ASN-Blocks-IPv6.csv") as csvfile_asn_v6:
    reader_asn_v6 = csv.reader(csvfile_asn_v6, delimiter=",")
    for row in reader_asn_v6:
        asn_list_v6[row[0]] = row[2]

with open("./GeoLite2-Country-Blocks-IPv4.csv") as csvfile_geo_v4:
    reader_geo_v4 = csv.reader(csvfile_geo_v4, delimiter=",")
    for row in reader_geo_v4:
        geo_list_v4_ip.append(row[0])
        geo_list_v4.append(row[1])

with open("./GeoLite2-Country-Blocks-IPv6.csv") as csvfile_geo_v6:
    reader_geo_v6 = csv.reader(csvfile_geo_v6, delimiter=",")
    for row in reader_geo_v6:
        geo_list_v6[row[0]] = row[1]

with open("./GeoLite2-Country-Locations-en.csv") as csvfile_country_code:
    reader_country_code = csv.reader(csvfile_country_code, delimiter=",")
    for row in reader_country_code:
        country_code_list_id.append(row[0])
        country_code_list.append(row[4])

log.info("End to read file")


# Signature for all Lambda functions that user must implement
def lambda_handler(firehose_records_input, context):
    log.info(
        "Received records for processing from DeliveryStream: "
        + firehose_records_input["deliveryStreamArn"]
        + ", Region: "
        + firehose_records_input["region"]
        + ", and InvocationId: "
        + firehose_records_input["invocationId"]
    )

    # Create return value.
    firehose_records_output = {"records": []}

    # Create result object.
    # Go through records and process them

    for firehose_record_input in firehose_records_input["records"]:
        # Get user payload
        log.info("record start")
        payload_bytes = base64.b64decode(firehose_record_input["data"])
        payload = "".join(map(chr, payload_bytes))

        payload_list = payload.strip().split("\t")
        cs_host = payload_list[4].strip()
        c_ip = payload_list[1].strip()
        version = validate_ip_version(c_ip)
        if version == "invalid":
            log.info("The ip address " + c_ip + " is invalid")
            continue
        isp = isp_from_ip(c_ip, version)
        country_name = country_code_from_geo_name(geo_name_from_ip(c_ip, version))
        content = payload.strip().split("\n")[0]
        payload = content + "\t" + isp + "\t" + country_name + "\n"
        log.info("New payload: " + payload)
        payload_encoded_ascii = payload.encode("ascii")
        payload_base64 = base64.b64encode(payload_encoded_ascii).decode("utf-8")
        log.info(payload_base64)

        # Create output Firehose record and add modified payload and record ID to it.
        firehose_record_output = {}
        event_timestamp = datetime.datetime.fromtimestamp(int(float(payload_list[0])))
        partition_keys = {
            "domain": cs_host,
            "year": event_timestamp.strftime("%Y"),
            "month": event_timestamp.strftime("%m"),
            "day": event_timestamp.strftime("%d"),
            "hour": event_timestamp.strftime("%H"),
            "minute": event_timestamp.strftime("%M"),
        }

        # Create output Firehose record and add modified payload and record ID to it.
        firehose_record_output = {
            "recordId": firehose_record_input["recordId"],
            "data": payload_base64,
            "result": "Ok",
            "metadata": {"partitionKeys": partition_keys},
        }
        firehose_records_output["records"].append(firehose_record_output)
        log.info("record end")

    log.info(json.dumps(firehose_records_output))

    # At the end return processed records
    return firehose_records_output


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
        if version == "IPv4":
            val = ipaddress.IPv4Address(ip)
            index = bin_search(asn_list_v4_ip, val)
            return asn_list_v4[index]
        elif version == "IPv6":
            for asn_key in asn_list_v6.keys():
                if ipaddress.IPv6Address(ip) in ipaddress.IPv6Network(asn_key):
                    return asn_list_v6[asn_key]
    except Exception as e:
        log.info("Error: " + str(ip))
        log.info(e)

    return "NotFound"


def geo_name_from_ip(ip, version):
    try:
        if version == "IPv4":
            val = ipaddress.IPv4Address(ip)
            index = bin_search(geo_list_v4_ip, val)
            return geo_list_v4[index]
        elif version == "IPv6":
            for geo_key in geo_list_v6.keys():
                if ipaddress.IPv6Address(ip) in ipaddress.IPv6Network(geo_key):
                    return geo_list_v6[geo_key]
    except Exception as e:
        log.info("Error: " + str(ip))
        log.info(e)

    return "NotFound"


def country_code_from_geo_name(name):
    index = bin_search_country(country_code_list_id, name)

    return country_code_list[index]


def validate_ip_version(address):
    try:
        ip = ipaddress.ip_address(address)

        if isinstance(ip, ipaddress.IPv4Address):
            return "IPv4"
        elif isinstance(ip, ipaddress.IPv6Address):
            return "IPv6"
    except ValueError:
        return "invalid"

    return "invalid"
