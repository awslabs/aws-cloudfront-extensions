import json
import logging
import subprocess

import boto3
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.event_handler import AppSyncResolver
from boto3.dynamodb.conditions import Key

tracer = Tracer(service="config_version_resolver")
logger = Logger(service="config_version_resolver")

app = AppSyncResolver()

S3_BUCKET = "cloudfrontconfigversions-cloudfrontconfigversions-60jwdz7zg1zi"
DDB_VERSION_TABLE_NAME = 'CloudFrontConfigVersionStack-CloudFrontConfigVersionTable6E23F7F5-1K696OOFD0GK6'
DDB_LATESTVERSION_TABLE_NAME = 'CloudFrontConfigVersionStack-CloudFrontConfigLatestVersionTable44770AF8-1OS79LINC6BHC'

log = logging.getLogger()
log.setLevel('INFO')


@app.resolver(type_name="Query", field_name="diffCloudfrontConfig")
def manager_version_diff(distribution_id: str = "", version1: str = "", version2: str = ""):
    dist_id = distribution_id
    version_1 = version1
    version_2 = version2

    # get specific cloudfront distributions version info
    ddb_client = boto3.resource('dynamodb')
    ddb_table = ddb_client.Table(DDB_VERSION_TABLE_NAME)

    response = ddb_table.get_item(
        Key={
            "distributionId": dist_id,
            "versionId": int(version_1)
        })
    data = response['Item']

    s3_bucket = data['s3_bucket']
    s3_key1 = data['s3_key']

    response = ddb_table.get_item(
        Key={
            "distributionId": dist_id,
            "versionId": int(version_2)
        })
    data = response['Item']
    s3_key2 = data['s3_key']

    s3_client = boto3.client('s3')
    local_config_file_name_version1 = '/tmp/' + dist_id + "_" + version_1 + ".json"
    local_config_file_name_version2 = '/tmp/' + dist_id + "_" + version_2 + ".json"
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


@app.resolver(type_name="Query", field_name="applyConfig")
def manager_version_apply_config(src_distribution_id: str = "", target_distribution_ids: [str] = [],version: str = ""):
    source_dist_id = src_distribution_id
    src_version = version
    target_dist_ids = target_distribution_ids

    # get specific cloudfront distributions version info
    ddb_client = boto3.resource('dynamodb')
    ddb_table = ddb_client.Table(DDB_VERSION_TABLE_NAME)

    response = ddb_table.get_item(
        Key={
            "distributionId": source_dist_id,
            "versionId": int(src_version)
        })
    data = response['Item']

    s3_bucket = data['s3_bucket']
    s3_key1 = data['s3_key']

    s3_client = boto3.client('s3')
    local_config_file_name_version = '/tmp/' + source_dist_id + "_" + src_version + ".json"
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


@app.resolver(type_name="Query", field_name="updateConfigTag")
def manager_version_config_tag_update(distribution_id: str="", note: str = "", version: str = ""):
    dist_id = distribution_id
    version_id = version
    dist_note = note
    # get specific cloudfront distributions version info
    ddb_client = boto3.resource('dynamodb')
    ddb_table = ddb_client.Table(DDB_VERSION_TABLE_NAME)

    response = ddb_table.get_item(
        Key={
            "distributionId": dist_id,
            "versionId": int(version_id)
        })
    data = response['Item']

    data['note'] = dist_note

    response = ddb_table.update_item(
        Key={
            "distributionId": dist_id,
            "versionId": int(version_id)
        },
        UpdateExpression="set note = :r",
        ExpressionAttributeValues={':r': dist_note},
        ReturnValues="UPDATED_NEW"
    )
    return response


@app.resolver(type_name="Query", field_name="listDistribution")
def manager_version_config_cf_list():
    # first get distribution List from current account
    cf_client = boto3.client('cloudfront')
    response = cf_client.list_distributions()

    ddb_client = boto3.resource('dynamodb')
    ddb_table = ddb_client.Table(DDB_LATESTVERSION_TABLE_NAME)

    result = []
    for dist in response['DistributionList']['Items']:

        tmp_dist = {}
        tmp_dist['id'] = dist['Id']
        tmp_dist['domainName'] = dist['DomainName']
        tmp_dist['status'] = dist['Status']
        tmp_dist['enabled'] = dist['Enabled']

        logger.info(tmp_dist)
        # get latest version from ddb latest version ddb
        ddb_data = ddb_table.get_item(
            Key={
                "distributionId": dist['Id'],
            })
        logger.info(f"ddb data for dist is {ddb_data}")
        if 'Item' in ddb_data:
            data = ddb_data['Item']
            tmp_dist['versionCount'] = data['versionId']
            result.append(tmp_dist)
        else:
            logger.info(f"no ddb record for {tmp_dist}")
    return result


@app.resolver(type_name="Query", field_name="getConfigLink")
def manager_version_get_link(distribution_id: str = "", versionId: str = ""):
    # get specific cloudfront distributions version info
    ddb_client = boto3.resource('dynamodb')
    ddb_table = ddb_client.Table(DDB_VERSION_TABLE_NAME)

    response = ddb_table.get_item(
        Key={
            "distributionId": distribution_id,
            "versionId": int(versionId)
        })
    data = response['Item']

    config_link = data['config_link']
    log.info("target s3 link is " + config_link)

    return {
        "config_link": config_link
    }


@app.resolver(type_name="Query", field_name="getConfigContent")
def manager_version_get_content(distribution_id: str = "", versionId: str = ""):
    # get specific cloudfront distributions version info
    ddb_client = boto3.resource('dynamodb')
    ddb_table = ddb_client.Table(DDB_VERSION_TABLE_NAME)

    response = ddb_table.get_item(
        Key={
            "distributionId": distribution_id,
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


@app.resolver(type_name="Query", field_name="listCloudfrontVersions")
def manager_version_get_all(distribution_id: str = ""):
    dist_id = distribution_id

    # get all the versions of the specific cloudfront distributions, latest version come first
    ddb_client = boto3.resource('dynamodb')
    ddb_table = ddb_client.Table(DDB_VERSION_TABLE_NAME)

    response = ddb_table.query(
        KeyConditionExpression=Key('distributionId').eq(dist_id),
        ScanIndexForward=False
    )
    data = response['Items']

    return data

@logger.inject_lambda_context(correlation_id_path=correlation_paths.APPSYNC_RESOLVER)
@tracer.capture_lambda_handler
def lambda_handler(event, context):
    return app.resolve(event, context)
