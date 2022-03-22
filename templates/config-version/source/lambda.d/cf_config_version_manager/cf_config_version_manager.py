import json
import logging
import subprocess

import boto3
from aws_lambda_powertools.event_handler import APIGatewayRestResolver
from boto3.dynamodb.conditions import Key

app = APIGatewayRestResolver()

S3_BUCKET = "cloudfrontconfigversions-cloudfrontconfigversions-60jwdz7zg1zi"
DDB_VERSION_TABLE_NAME = 'CloudFrontConfigVersionStack-CloudFrontConfigVersionTable6E23F7F5-1K696OOFD0GK6'
DDB_LATESTVERSION_TABLE_NAME = 'CloudFrontConfigVersionStack-CloudFrontConfigLatestVersionTable44770AF8-1OS79LINC6BHC'

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


@app.get("/cf_config_manager/apply_config")
def manager_version_apply_config():
    query_strings_as_dict = app.current_event.query_string_parameters
    json_payload = app.current_event.json_body
    payload = app.current_event.body

    source_dist_id = app.current_event.get_query_string_value(name="src_distribution_id", default_value="")
    version = app.current_event.get_query_string_value(name="version", default_value="")
    target_dist_ids = query_strings_as_dict['target_distribution_ids']

    # get specific cloudfront distributions version info
    ddb_client = boto3.resource('dynamodb')
    ddb_table = ddb_client.Table(DDB_VERSION_TABLE_NAME)

    response = ddb_table.get_item(
        Key={
            "distributionId": source_dist_id,
            "versionId": int(version)
        })
    data = response['Item']

    s3_bucket = data['s3_bucket']
    s3_key1 = data['s3_key']

    s3_client = boto3.client('s3')
    local_config_file_name_version = '/tmp/' + source_dist_id + "_" + version + ".json"
    s3_client.download_file(s3_bucket, s3_key1, local_config_file_name_version)

    # call boto to apply the config to target distribution
    cf_client = boto3.client('cloudfront')

    for distribution_id in target_dist_ids:
        # first get the current ETAG for target distribution
        response = cf_client.get_distribution_config(
            Id=distribution_id
        )
        etag = response['ETag']
        target_dist_caller_reference = response['DistributionConfig']['CallerReference']

        with open(local_config_file_name_version) as config_file:
            dictData = json.load(config_file)
            dictData['CallerReference'] = target_dist_caller_reference

            response = cf_client.update_distribution(
                DistributionConfig=dictData,
                Id=distribution_id,
                IfMatch=etag
            )

    return 'target distributions been updated'


@app.post("/cf_config_manager/config_tag_update")
def manager_version_config_tag_update():
    dist_id = app.current_event.get_query_string_value(name="distribution_id", default_value="")
    version_id = app.current_event.get_query_string_value(name="version", default_value="")
    note = app.current_event.get_query_string_value(name="note", default_value="")
    # get specific cloudfront distributions version info
    ddb_client = boto3.resource('dynamodb')
    ddb_table = ddb_client.Table(DDB_VERSION_TABLE_NAME)

    response = ddb_table.get_item(
        Key={
            "distributionId": dist_id,
            "versionId": int(version_id)
        })
    data = response['Item']

    data['note'] = note

    response = ddb_table.update_item(
        Key={
            "distributionId": dist_id,
            "versionId": int(version_id)
        },
        UpdateExpression="set note = :r",
        ExpressionAttributeValues={':r': note},
        ReturnValues="UPDATED_NEW"
    )
    return response


@app.get("/cf_config_manager/cf_list")
def manager_version_config_cf_list():
    # first get distribution List from current account
    cf_client = boto3.client('cloudfront')
    response = cf_client.list_distributions()

    ddb_client = boto3.resource('dynamodb')
    ddb_table = ddb_client.Table(DDB_LATESTVERSION_TABLE_NAME)

    result = []
    for dist in response['DistributionList']['Items']:
        tmp_dist = {}
        tmp_dist['Id'] = dist['Id']
        tmp_dist['DomainName'] = dist['DomainName']
        tmp_dist['Status'] = dist['Status']
        tmp_dist['Enabled'] = dist['Enabled']

        # get latest version from ddb latest version ddb
        ddb_data = ddb_table.get_item(
            Key={
                "distributionId": dist['Id'],
            })
        data = ddb_data['Item']
        tmp_dist['versionCount'] = data['versionId']

        result.append(tmp_dist)
    return result


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
    content = json.load(data['Body'])
    result = str(json.dumps(content, indent=4))

    return result


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
