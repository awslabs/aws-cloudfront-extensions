import json
import requests
from urllib import parse
import boto3

PARA_POP = '-C1'
PARA_CFID = ''
PARA_S3BUCKET = ''
PARA_S3KEY = ''
failed_list = []


def get_url_from_s3():
    s3 = boto3.resource('s3')
    obj = s3.Object(PARA_S3BUCKET, PARA_S3KEY)
    body = obj.get()['Body'].read()
    url_list = body.decode().split('\n')
    return url_list


def gen_pop_url(url, pop):
    parsed_url = parse.urlsplit(url)
    cf_edge_url = 'http://' + PARA_CFID + '.' + pop + '.cloudfront.net' + parsed_url.path + parsed_url.query

    return cf_edge_url


def pre_warm(url, pop):
    try:
        target_url = gen_pop_url(url, pop)
        requests.get(url=target_url, headers={'Host': target_url})
    except Exception as e:
        print(f'Failed: PoP => {pop}, Url => {url} with exception => {e}')
        failed_list.append({
            'pop': pop,
            'url': url
        })


def lambda_handler(event, context):
    url_list = get_url_from_s3()
    pop_split = PARA_POP.split(',')

    for pop in pop_split:
        pop = pop.strip()
        for url in url_list:
            if len(url) > 0:
                pre_warm(url, pop)

    if len(failed_list) == 0:
        return {
            "statusCode": 200,
            "body": json.dumps({
                "message": "All the url have been pre-warmed"
            })
        }
    else:
        return {
            "statusCode": 500,
            "body": json.dumps({
                "message": "At least one url is failed to pre-warm, check the log in CloudWatch to get more details",
                "failed_count": len(failed_list),
                "failed_url": failed_list
            })
        }
