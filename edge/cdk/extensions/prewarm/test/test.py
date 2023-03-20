import concurrent.futures
import json
import os
import sys
import time
from urllib import parse

import boto3
import requests
import shortuuid
import pydig
from botocore.exceptions import WaiterError
from urllib3.exceptions import InsecureRequestWarning

import subprocess

def download_file(url, cf_domain):
    # local_filename = shortuuid.uuid() + url.split('/')[-1]
    local_filename = '/dev/null'
    # Suppress only the single warning from urllib3 needed.
    requests.packages.urllib3.disable_warnings(category=InsecureRequestWarning)

    with requests.get(url, headers={'Accept-Encoding': 'gzip, deflate, br', 'Host': cf_domain}, stream=True, timeout=5, verify=False) as r:
        r.raise_for_status()
        with open(local_filename, 'wb') as f:
            for chunk in r.iter_content(chunk_size=1024):
                if chunk:
                    f.write(chunk)

    return local_filename

def download_file_with_curl(url, local_filename, original_url, cf_domain, original_domain):
    # download the prewarm file to /dev/null to increase prewarm speed
    popList = []
    popList = pydig.query(cf_domain, 'A')
    print(popList)
    popAddress = popList[0]
    # subprocess.run(["curl","-v","-k", "-H", "\'Accept-Encoding: gzip, deflate, br\'", "-H", host_header, "-o", local_filename, url])
    # command = "curl  -D - -H \"Host:" + original_domain + " --resolve " +  original_domain + ":443:" + popAddress + " " + "\" -H \"Accept-Encoding: gzip, deflate, br\" -o " +  local_filename + " " + original_url
    # print(command)
    # subprocess.call(command, shell=True)
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
    result = subprocess.run(command)

    return local_filename

http_url = 'http://d3jfoo97ao3efx.NRT57-P3.cloudfront.net/ngm.jpg'
https_url = 'https://d3jfoo97ao3efx.NRT57-P3.cloudfront.net/ngm.jpg'
https_url_withoutPOP = 'https://d3jfoo97ao3efx.cloudfront.net/ngm.jpg'
original_url = 'https://prewarm.test.demo.solutions.aws.a2z.org.cn/ngm.jpg'
original_domain = 'prewarm.test.demo.solutions.aws.a2z.org.cn'
cf_domain = 'd3jfoo97ao3efx.cloudfront.net'

# cf_domain = 'cloudfront.net'
filename = 'test.jpg'
download_file_with_curl(https_url,filename,original_url,cf_domain, original_domain)
print("------------------")
# download_file_with_curl(https_url_withoutPOP,filename)
print("------------------")
# download_file_with_curl(http_url,filename)

print(filename)
