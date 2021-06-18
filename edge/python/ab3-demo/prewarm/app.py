import json
import requests
from urllib import parse
import boto3

pop_list = 'PARA_POP'
cf_mapping = 'PARA_MAPPING'
bucket_name = 'PARA_S3BUCKET'
file_key = 'PARA_S3KEY'
failed_list = []
URL_SUFFIX = '.cloudfront.net'


def get_url_from_s3():
    s3 = boto3.resource('s3')
    obj = s3.Object(bucket_name, file_key)
    body = obj.get()['Body'].read()
    url_list = body.decode().split('\n')
    return url_list


def gen_pop_url(parsed_url, pop, cf_dist_id):
    cf_edge_url = 'http://' + cf_dist_id + '.' + pop + '.cloudfront.net' + parsed_url.path + parsed_url.query

    return cf_edge_url


def replace_url(parsed_url, url_mapping):
    if parsed_url.netloc in url_mapping:
        parsed_url = parsed_url._replace(netloc=url_mapping[parsed_url.netloc])
        return parsed_url
    else:
        # if url is not in the mapping, still pre-warm it
        return parsed_url


def get_cf_dist_id(parsed_url):
    return parsed_url.netloc.replace(URL_SUFFIX, '')


def pre_warm(url, pop, cf_dist_id):
    try:
        requests.get(url=url, headers={'Host': url})
    except Exception as e:
        print(f'Failed: PoP => {pop}, Url => {url} with exception => {e}')
        failed_list.append({
            'pop': pop,
            'url': url
        })


def lambda_handler(event, context):
    url_list = get_url_from_s3()
    pop_split = pop_list.split(',')

    mapping_json = json.loads(cf_mapping)

    for pop in pop_split:
        pop = pop.strip()
        for url in url_list:
            if len(url) > 0:
                parsed_url = parse.urlsplit(url)
                # replace url according to cf_mapping
                parsed_url = replace_url(parsed_url, mapping_json)
                cf_dist_id = get_cf_dist_id(parsed_url)
                target_url = gen_pop_url(parsed_url, pop, cf_dist_id)
                pre_warm(target_url, pop, cf_dist_id)

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
