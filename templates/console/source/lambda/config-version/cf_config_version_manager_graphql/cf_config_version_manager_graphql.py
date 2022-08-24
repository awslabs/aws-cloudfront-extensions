import json
import logging
import subprocess
import os
from datetime import datetime

import boto3
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.event_handler import AppSyncResolver
from boto3.dynamodb.conditions import Key

tracer = Tracer(service="config_version_resolver")
logger = Logger(service="config_version_resolver")

app = AppSyncResolver()

# TODO: for local debug, will remove before release
# S3_BUCKET = "cloudfrontconfigversions-cloudfrontconfigversions-60jwdz7zg1zi"
# DDB_VERSION_TABLE_NAME = 'CloudFrontConfigVersionStack-CloudFrontConfigVersionTable6E23F7F5-1K696OOFD0GK6'
# DDB_LATESTVERSION_TABLE_NAME = 'CloudFrontConfigVersionStack-CloudFrontConfigLatestVersionTable44770AF8-1OS79LINC6BHC'

S3_BUCKET = os.environ['S3_BUCKET']
DDB_VERSION_TABLE_NAME = os.environ['DDB_VERSION_TABLE_NAME']
DDB_LATESTVERSION_TABLE_NAME = os.environ['DDB_LATESTVERSION_TABLE_NAME']
DDB_SNAPSHOT_TABLE_NAME = os.environ['DDB_SNAPSHOT_TABLE_NAME']

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


@app.resolver(type_name="Query", field_name="diffCloudfrontConfigSnapshot")
def manager_snapshot_diff(distribution_id: str = "", snapshot1: str = "", snapshot2: str = ""):
    dist_id = distribution_id
    if dist_id == "" or snapshot1 == "" or snapshot2 == "":
        raise Exception("Snapshot name can not be empty")

    # first get the version id from snapshot id
    ddb_client = boto3.resource('dynamodb')
    ddb_snapshot_table = ddb_client.Table(DDB_SNAPSHOT_TABLE_NAME)

    response = ddb_snapshot_table.get_item(
        Key={
            "distributionId": distribution_id,
            "snapShotName": snapshot1
        })
    snapshot_resp = response['Item']
    if not snapshot_resp:
        raise Exception(f"Failed to get the snapshot with distribution id:{distribution_id}, snapshot_name:{snapshot1}")

    src_version_1 = snapshot_resp['versionId']

    response = ddb_snapshot_table.get_item(
        Key={
            "distributionId": distribution_id,
            "snapShotName": snapshot2
        })
    snapshot_resp = response['Item']
    if not snapshot_resp:
        raise Exception(f"Failed to get the snapshot with distribution id:{distribution_id}, snapshot_name:{snapshot2}")

    src_version_2 = snapshot_resp['versionId']

    version_1 = src_version_1
    version_2 = src_version_2

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
    local_config_file_name_version1 = '/tmp/' + dist_id + "_" + str(version_1) + ".json"
    local_config_file_name_version2 = '/tmp/' + dist_id + "_" + str(version_2) + ".json"
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
def manager_version_apply_config(src_distribution_id: str = "", target_distribution_ids: [str] = [], version: str = ""):
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

    with open(local_config_file_name_version) as config_file:
        dictData = json.load(config_file)
        for distribution_id in target_dist_ids:
            # first get the current ETAG for target distribution
            prev_config = cf_client.get_distribution_config(
                Id=distribution_id
            )
            etag = prev_config['ETag']
            target_dist_caller_reference = prev_config['DistributionConfig']['CallerReference']

            dictData['CallerReference'] = target_dist_caller_reference

            if dictData == prev_config['DistributionConfig']:
                logger.info("the two configuration is same, no need to create a new version")
            else:
                logger.info("the two configuration is different")
                logger.info("prev config is " + str(prev_config) + ", current config is " + str(dictData))
                response = cf_client.update_distribution(
                    DistributionConfig=dictData,
                    Id=distribution_id,
                    IfMatch=etag
                )
                logger.info('target distributions been updated')


@app.resolver(type_name="Mutation", field_name="applySnapshot")
def manager_snapshot_apply_config(src_distribution_id: str = "", target_distribution_ids: [str] = [],
                                 snapshot_name: str = ""):
    source_dist_id = src_distribution_id
    src_snapshot = snapshot_name
    if source_dist_id == "":
        raise Exception("source distribution id can not be empty")
    if src_snapshot == "":
        raise Exception("source snapshot name can not be empty")

    # first get the version from snapshot ddb table
    ddb_client = boto3.resource('dynamodb')
    ddb_snapshot_table = ddb_client.Table(DDB_SNAPSHOT_TABLE_NAME)
    response = ddb_snapshot_table.get_item(
        Key={
            "distributionId": source_dist_id,
            "snapShotName": snapshot_name
        })
    snapshot_resp = response['Item']
    if not snapshot_resp:
        raise Exception(
            f"Failed to get the snapshot with distribution id:{source_dist_id}, snapshot_name:{snapshot_name}")

    src_version = snapshot_resp['versionId']
    logger.info(f"source version is {src_version}")

    target_dist_ids = target_distribution_ids

    # get specific cloudfront distributions version info
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
    local_config_file_name_version = '/tmp/' + source_dist_id + "_" + str(src_version) + ".json"
    s3_client.download_file(s3_bucket, s3_key1, local_config_file_name_version)

    # call boto to apply the config to target distribution
    cf_client = boto3.client('cloudfront')
    ddb_latest_table = ddb_client.Table(DDB_LATESTVERSION_TABLE_NAME)

    with open(local_config_file_name_version) as config_file:
        dictData = json.load(config_file)
        for distribution_id in target_dist_ids:
            # first get the current ETAG for target distribution
            prev_config = cf_client.get_distribution_config(
                Id=distribution_id
            )
            etag = prev_config['ETag']
            target_dist_caller_reference = prev_config['DistributionConfig']['CallerReference']

            dictData['CallerReference'] = target_dist_caller_reference

            if dictData == prev_config['DistributionConfig']:
                logger.info("the two configuration is same, no need to create a new version")
            else:
                logger.info("the two configuration is different")
                logger.info("prev config is " + str(prev_config) + ", current config is " + str(dictData))
                response = cf_client.update_distribution(
                    DistributionConfig=dictData,
                    Id=distribution_id,
                    IfMatch=etag
                )
                # Update the snapshot name to DDB_LATESTVERSION_TABLE_NAME
                response = ddb_latest_table.update_item(
                    Key={
                        'distributionId': distribution_id,
                    },
                    UpdateExpression="set snapshot_name=:r",
                    ExpressionAttributeValues={
                        ':r': src_snapshot
                    },
                    ReturnValues="UPDATED_NEW"
                )

                logger.info('target distributions been updated')

    return {
        'statusCode': 200,
        'body': 'succeed apply snapshot to target distributions'
    }


@app.resolver(type_name="Query", field_name="updateConfigTag")
def manager_version_config_tag_update(distribution_id: str = "", note: str = "", version: str = ""):
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


@app.resolver(type_name="Query", field_name="updateConfigSnapshotTag")
def manager_snapshot_config_tag_update(distribution_id: str = "", note: str = "", snapshot_name: str = ""):
    dist_id = distribution_id
    snapShotName = snapshot_name
    dist_note = note
    # get specific cloudfront distributions version info
    ddb_client = boto3.resource('dynamodb')
    ddb_table = ddb_client.Table(DDB_SNAPSHOT_TABLE_NAME)

    response = ddb_table.get_item(
        Key={
            "distributionId": dist_id,
            "snapShotName": snapShotName
        })
    data = response['Item']

    data['note'] = dist_note

    response = ddb_table.update_item(
        Key={
            "distributionId": dist_id,
            "snapShotName": snapShotName
        },
        UpdateExpression="set note = :r",
        ExpressionAttributeValues={':r': dist_note},
        ReturnValues="UPDATED_NEW"
    )
    return response


@app.resolver(type_name="Query", field_name="listDistribution")
def manager_version_config_cf_list():
    # first get distribution List from current account
    cf_client = boto3.client('cloudfront', region_name='us-east-1')
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

        if 'Aliases' in dist:
            tmp_aliases = {}
            tmp_aliases['Quantity'] = dist['Aliases']['Quantity']
            itemList = []
            if 'Items' in dist['Aliases']:
                for item in dist['Aliases']['Items']:
                    itemList.append(item)
            tmp_aliases['Items'] = itemList
            tmp_dist['aliases'] = tmp_aliases
        else:
            tmp_aliases = {}
            tmp_aliases['Quantity'] = 0;
            tmp_aliases['Items'] = []
            tmp_dist['aliases'] = tmp_aliases

        logger.info(tmp_dist)
        # get latest version from ddb latest version ddb
        ddb_table = ddb_client.Table(DDB_LATESTVERSION_TABLE_NAME)
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

        # get snapshot count from snapshot ddb
        ddb_table = ddb_client.Table(DDB_SNAPSHOT_TABLE_NAME)

        ddb_data = ddb_table.query(
            KeyConditionExpression=Key('distributionId').eq(dist['Id']),
            ScanIndexForward=False
        )
        record_list = ddb_data['Items']
        logger.info(record_list)
        if len(record_list) == 0:
            tmp_dist['snapshotCount'] = 0
        else:
            tmp_dist['snapshotCount'] = len(record_list) - 1

    return result

@app.resolver(type_name="Query", field_name="getDistributionCname")
def manager_get_cf_cname_info(distribution_id: str = ""):
    # first get distribution List from current account
    cf_client = boto3.client('cloudfront')
    response = cf_client.get_distribution_config(
        Id=distribution_id
    )
    config_data = response['DistributionConfig']
    logger.info(config_data)

    if config_data['Aliases']['Quantity'] == 0:
        return []
    else:
        return config_data['Aliases']['Items']


@app.resolver(type_name="Query", field_name="getAppliedSnapshotName")
def manager_get_applied_snapshot_name(distribution_id: str = ""):
    # get specific cloudfront distributions version info
    ddb_client = boto3.resource('dynamodb')
    ddb_table = ddb_client.Table(DDB_LATESTVERSION_TABLE_NAME)

    response = ddb_table.get_item(
        Key={
            "distributionId": distribution_id,
        })
    data = response['Item']

    if 'snapshot_name' in data:
        snapshot_name = data['snapshot_name']
        return snapshot_name
    else:
        return ""


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


@app.resolver(type_name="Query", field_name="getConfigSnapshotLink")
def manager_snapshot_get_link(distribution_id: str = "", snapshot_name: str = ""):
    # first get the version from snapshot ddb table
    ddb_client = boto3.resource('dynamodb')
    ddb_snapshot_table = ddb_client.Table(DDB_SNAPSHOT_TABLE_NAME)
    response = ddb_snapshot_table.get_item(
        Key={
            "distributionId": distribution_id,
            "snapShotName": snapshot_name
        })
    snapshot_resp = response['Item']
    if not snapshot_resp:
        raise Exception(
            f"Failed to get the snapshot with distribution id:{distribution_id}, snapshot_name:{snapshot_name}")

    src_version = snapshot_resp['versionId']

    # get specific cloudfront distributions version info
    ddb_client = boto3.resource('dynamodb')
    ddb_table = ddb_client.Table(DDB_VERSION_TABLE_NAME)

    response = ddb_table.get_item(
        Key={
            "distributionId": distribution_id,
            "versionId": int(src_version)
        })
    data = response['Item']
    if not data:
        raise Exception(f"Failed to get the version with distribution id:{distribution_id}, version_id:{src_version}")

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


@app.resolver(type_name="Query", field_name="getConfigSnapshotContent")
def manager_snapshot_get_content(distribution_id: str = "", snapshot_name: str = ""):
    # first get the version from snapshot ddb table
    ddb_client = boto3.resource('dynamodb')
    ddb_snapshot_table = ddb_client.Table(DDB_SNAPSHOT_TABLE_NAME)
    response = ddb_snapshot_table.get_item(
        Key={
            "distributionId": distribution_id,
            "snapShotName": snapshot_name
        })
    if not 'Item' in response:
        raise Exception(
            f"Failed to get the snapshot with distribution id:{distribution_id}, snapshot_name:{snapshot_name}")

    src_version = response['Item']['versionId']

    # get specific cloudfront distributions version info
    ddb_table = ddb_client.Table(DDB_VERSION_TABLE_NAME)

    response = ddb_table.get_item(
        Key={
            "distributionId": distribution_id,
            "versionId": int(src_version)
        })
    data = response['Item']
    if not data:
        raise Exception(f"Failed to get the version with distribution id:{distribution_id}, version_id:{src_version}")

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


@app.resolver(type_name="Query", field_name="listCloudfrontSnapshots")
def manager_snapshot_get_all(distribution_id: str = ""):
    dist_id = distribution_id

    # get all the snapshot of the specific cloudfront distributions, latest version come first
    ddb_client = boto3.resource('dynamodb')
    ddb_snapshot_table = ddb_client.Table(DDB_SNAPSHOT_TABLE_NAME)

    response = ddb_snapshot_table.query(
        KeyConditionExpression=Key('distributionId').eq(dist_id),
        ScanIndexForward=False
    )
    snapshot_response = response['Items']

    # get more info from the version table of snapshot
    ddb_version_table = ddb_client.Table(DDB_VERSION_TABLE_NAME)

    result = []
    for snap_shot_record in snapshot_response:
        tmp = {'id': snap_shot_record['snapShotName'], 'distribution_id': snap_shot_record['distributionId'],
               'snapshot_name': snap_shot_record['snapShotName'], 'note': snap_shot_record['note'],
               'dateTime': snap_shot_record['dateTime']}

        # query more info from version table
        response = ddb_version_table.get_item(
            Key={
                "distributionId": dist_id,
                "versionId": snap_shot_record['versionId']
            })

        version_resp = response['Item']

        tmp['config_link'] = version_resp['config_link']
        tmp['s3_bucket'] = version_resp['s3_bucket']
        tmp['s3_key'] = version_resp['s3_key']
        result.append(tmp)

    logger.info(result)
    return result


@app.resolver(type_name="Mutation", field_name="createVersionSnapShot")
def createVersionSnapShot(distributionId: str = "", snapShotName: str = "", snapShotNote: str = ""):
    if distributionId == "":
        raise Exception("DistributionId can not be empty")
    if snapShotName == "":
        raise Exception("snapShotName can not be empty")

    # check existing ddb record to check whether same snapShotName exists
    # get specific cloudfront distributions version info
    ddb_client = boto3.resource('dynamodb')
    ddb_table = ddb_client.Table(DDB_SNAPSHOT_TABLE_NAME)

    response = ddb_table.get_item(
        Key={
            "distributionId": distributionId,
            "snapShotName": snapShotName
        })
    logger.info(response)
    if 'Item' in response:
        # No duplicate snapShotName allowed
        raise Exception("There is already snapShotName:" + snapShotName)

    # create a record in snapshot ddb table with the snapShotName
    # first get the latest versionId of updated distribution
    latest_table = ddb_client.Table(DDB_LATESTVERSION_TABLE_NAME)
    try:
        resp = latest_table.query(
            KeyConditionExpression=Key('distributionId').eq(distributionId)
        )
        log.info(resp)
    except ClientError as e:
        logging.error(e)

    record_list = resp['Items']
    if len(record_list) == 0:
        raise Exception("There is no latest version for distributionId:" + distributionId)
    latest_version = record_list[0]['versionId']
    logging.info("The latest version of distribution:" + str(distributionId) + " is " + str(latest_version))

    # insert a record to snapshot ddb table
    # save the record to config version dynamoDB
    current_time = str(datetime.now())
    response = ddb_table.put_item(
        Item={
            'distributionId': str(distributionId),
            'snapShotName': snapShotName,
            'versionId': latest_version,
            'dateTime': current_time,
            'note': snapShotNote,
        })

    return {
        'statusCode': 200,
        'body': 'succeed create new snapshot'
    }


@app.resolver(type_name="Mutation", field_name="deleteSnapshot")
def deleteSnapShot(distributionId: str = "", snapShotName: str = ""):
    if distributionId == "":
        raise Exception("DistributionId can not be empty")
    if snapShotName == "":
        raise Exception("snapShotName can not be empty")

    ddb_client = boto3.resource('dynamodb')
    ddb_table = ddb_client.Table(DDB_SNAPSHOT_TABLE_NAME)

    response = ddb_table.delete_item(
        Key={
            "distributionId": distributionId,
            "snapShotName": snapShotName
        })
    logger.info(response)
    return {
        'statusCode': 200,
        'body': 'succeed delete snapshot'
    }


@logger.inject_lambda_context(correlation_id_path=correlation_paths.APPSYNC_RESOLVER)
@tracer.capture_lambda_handler
def lambda_handler(event, context):
    return app.resolve(event, context)
