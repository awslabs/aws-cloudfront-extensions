import json
import time

import requests

wait_time = 30 * 60
prewarm_count = 0
headers = {"x-api-key": "your-api-key"}
url = "https://{your-prewarm-api}.us-east-1.amazonaws.com/prod/prewarm"
body_list = [{
    "url_list": [
        "https://www.example.com/index.html"
    ],
    "cf_domain": "demo.cloudfront.net",
    "region": "all"
}, {
    "url_list": [
        "https://www.example.com/js/config.js"
    ],
    "cf_domain": "demo.cloudfront.net",
    "region": "apac"
}]


def prewarm(url, body, headers):
    body_str = json.dumps(body)
    r = requests.post(url, data=body_str, headers=headers)
    print(r.text)


for body in body_list:
    prewarm(url, body, headers)
    prewarm_count += 1
    if prewarm_count < len(body_list):
        time.sleep(wait_time)
