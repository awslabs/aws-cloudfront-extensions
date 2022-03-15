import logging
import json
import boto3
import subprocess

from aws_lambda_powertools.event_handler import APIGatewayRestResolver
from boto3.dynamodb.conditions import Key

app = APIGatewayRestResolver()

S3_BUCKET = "cloudfrontconfigversions-cloudfrontconfigversions-60jwdz7zg1zi"
DDB_VERSION_TABLE_NAME = 'CloudFrontConfigVersionStack-CloudFrontConfigVersionTable6E23F7F5-D8I07GGNBYFJ'
DDB_LATESTVERSION_TABLE_NAME = 'CloudFrontConfigVersionStack-CloudFrontConfigLatestVersionTable44770AF8-7LF5V48RKDK0'

log = logging.getLogger()
log.setLevel('INFO')


@app.get("/cf_config_manager/diff")
def manager_version_diff():
    query_strings_as_dict = app.current_event.query_string_parameters
    json_payload = app.current_event.json_body
    payload = app.current_event.body

    dist_id = app.current_event.get_query_string_value(name="distributionId", default_value="")
    version1 = app.current_event.get_query_string_value(name="version1", default_value="")
    version2 = app.current_event.get_query_string_value(name="version2", default_value="")

    # get specific cloudfront distributions version info
    ddb_client = boto3.resource('dynamodb')
    ddb_table = ddb_client.Table(DDB_VERSION_TABLE_NAME)

    response = ddb_table.get_item(
        Key={
            "distributionId": dist_id,
            "versionId": int(version1)
        })
    data = response['Item']

    s3_bucket = data['s3_bucket']
    s3_key1 = data['s3_key']

    response = ddb_table.get_item(
        Key={
            "distributionId": dist_id,
            "versionId": int(version2)
        })
    data = response['Item']
    s3_key2 = data['s3_key']

    s3_client = boto3.client('s3')
    local_config_file_name_version1 = '/tmp/' + dist_id + "_" + version1 + ".json"
    local_config_file_name_version2 = '/tmp/' + dist_id + "_" + version2 + ".json"
    s3_client.download_file(s3_bucket, s3_key1, local_config_file_name_version1)
    s3_client.download_file(s3_bucket, s3_key2, local_config_file_name_version2)

    # compare the two files
    cmd = ['git', 'diff', '--no-index', local_config_file_name_version1, local_config_file_name_version2,
           '>/tmp/diff.txt', ';', 'exit 0']

    shell_cmd = ' '.join(cmd)
    log.info(shell_cmd)

    output = subprocess.check_output(shell_cmd, shell=True)

    diff_file = open("/tmp/diff.txt", "r")

    diff_content = diff_file.read()

    diff_file.close()

    return diff_content

@app.get("/cf_config_manager/versions/config_link/<versionId>")
def manager_version_get_link(versionId):
    dist_id = app.current_event.get_query_string_value(name="distributionId", default_value="")
    # get specific cloudfront distributions version info
    ddb_client = boto3.resource('dynamodb')
    ddb_table = ddb_client.Table(DDB_VERSION_TABLE_NAME)

    response = ddb_table.get_item(
        Key={
            "distributionId": dist_id,
            "versionId": int(versionId)
        })
    data = response['Item']

    config_link = data['config_link']
    log.info("target s3 link is " + config_link)

    return {
        "config_link": config_link
    }

@app.get("/cf_config_manager/versions/config_content/<versionId>")
def manager_version_get_content(versionId):
    dist_id = app.current_event.get_query_string_value(name="distributionId", default_value="")
    # get specific cloudfront distributions version info
    ddb_client = boto3.resource('dynamodb')
    ddb_table = ddb_client.Table(DDB_VERSION_TABLE_NAME)

    response = ddb_table.get_item(
        Key={
            "distributionId": dist_id,
            "versionId": int(versionId)
        })
    data = response['Item']

    config_link = data['config_link']
    log.info("target s3 link is " + config_link)

    s3_client = boto3.client('s3')
    data = s3_client.get_object(Bucket=data['s3_bucket'], Key=data['s3_key'])
    for line in data['Body'].iter_lines():
        object = json.loads(line)

    log.info(object)

    return object

@app.get("/cf_config_manager/versions")
def manager_version_get_all():
    query_strings_as_dict = app.current_event.query_string_parameters
    json_payload = app.current_event.json_body
    payload = app.current_event.body

    dist_id = app.current_event.get_query_string_value(name="distributionId", default_value="")

    # get all the versions of the specific cloudfront distributions, latest version come first
    ddb_client = boto3.resource('dynamodb')
    ddb_table = ddb_client.Table(DDB_VERSION_TABLE_NAME)

    response = ddb_table.query(
        KeyConditionExpression=Key('distributionId').eq(dist_id),
        ScanIndexForward=False
    )
    data = response['Items']

    return data

@app.get("/cf_config_manager")
def manager():
    return {"message": "hello unknown!"}

def lambda_handler(event, context):
    return app.resolve(event, context)
