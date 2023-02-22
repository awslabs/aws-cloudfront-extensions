import concurrent.futures
import json
import os
import sys
import time
from urllib import parse

import boto3
import requests
import shortuuid
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

def download_file_new(url, filename):
    subprocess.run(["curl", "-k","-o", filename, url])

http_url = 'http://d3jfoo97ao3efx.NRT57-P3.cloudfront.net/ngm.jpg'
https_url = 'https://d3jfoo97ao3efx.NRT57-P3.cloudfront.net/ngm.jpg'

cf_domain = 'cloudfront.net'
filename = '/dev/null'
download_file_new(https_url,filename)
download_file_new(http_url,filename)

print(filename)
