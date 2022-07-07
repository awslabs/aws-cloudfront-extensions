import boto3
import os
import logging
import json
from datetime import datetime
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError

S3_BUCKET = os.environ['S3_BUCKET']
DDB_VERSION_TABLE_NAME = os.environ['DDB_VERSION_TABLE_NAME']
DDB_LATESTVERSION_TABLE_NAME = os.environ['DDB_LATESTVERSION_TABLE_NAME']
DDB_SNAPSHOT_TABLE_NAME = os.environ['DDB_SNAPSHOT_TABLE_NAME']

log = logging.getLogger()
log.setLevel('INFO')

def update_config_version(distribution_id):
    # export the cloudfront config to S3 bucket and directory
    cf_client = boto3.client('cloudfront')
    response = cf_client.get_distribution_config(
        Id=distribution_id
    )
    current_time = datetime.now().strftime('%Y-%m-%d-%H-%M-%S')
    year = str(datetime.now().year)
    month = str('%02d' % datetime.now().month)
    day = str('%02d' % datetime.now().day)
    config_name = distribution_id + "_" + current_time + ".json"
    with open("/tmp/" + config_name, "w") as outfile:
        log.info(json.dumps(response["DistributionConfig"], indent=4))
        json.dump(response["DistributionConfig"], outfile, indent=4)
    s3_client = boto3.client('s3')
    s3_path = "s3://" + S3_BUCKET + "/" + distribution_id + "/" + year + "/" + month + "/" + day + "/" + config_name
    s3_key = distribution_id + "/" + year + "/" + month + "/" + day + "/" + config_name
    try:
        response = s3_client.upload_file("/tmp/" + config_name, S3_BUCKET, s3_key)
    except ClientError as e:
        logging.error(e)
    # first get the latest versionId of updated distribution
    ddb_client = boto3.resource('dynamodb')
    ddb_table = ddb_client.Table(DDB_LATESTVERSION_TABLE_NAME)
    try:
        resp = ddb_table.query(
            KeyConditionExpression=Key('distributionId').eq(distribution_id)
        )
        log.info(resp)
    except ClientError as e:
        logging.error(e)
    record_list = resp['Items']
    if len(record_list) == 0:
        logging.info("not found any records for distribution:" + distribution_id)
        logging.info("create first record for distribution:" + distribution_id)
        ddb_table.put_item(
            Item={
                'distributionId': distribution_id,
                'versionId': 0,
                'id': 0
            })
        resp = ddb_table.query(
            KeyConditionExpression=Key('distributionId').eq(distribution_id)
        )
    if 'Items' in resp:
        ddb_record = resp['Items'][0]
        prev_version = ddb_record['versionId']
        new_version = prev_version + 1

    else:
        logging.error("failed to get the versionId")
        return {
            'statusCode': 500,
            'body': 'failed to get the distribution previous versionId'
        }
    # save the record to config version dynamoDB
    ddb_table = ddb_client.Table(DDB_VERSION_TABLE_NAME)
    response = ddb_table.put_item(
        Item={
            'distributionId': str(distribution_id),
            'versionId': new_version,
            'id': new_version,
            'dateTime': current_time,
            'note': '',
            'config_link': s3_path,
            's3_bucket': S3_BUCKET,
            's3_key': s3_key
        })
    # update the config latest_version ddb
    ddb_table = ddb_client.Table(DDB_LATESTVERSION_TABLE_NAME)
    response = ddb_table.update_item(
        Key={
            'distributionId': distribution_id,
        },
        UpdateExpression="set versionId=:r",
        ExpressionAttributeValues={
            ':r': new_version
        },
        ReturnValues="UPDATED_NEW"
    )
    # create or update the latest snapshot record in snapshot DDB
    ddb_snapshot_table = ddb_client.Table(DDB_SNAPSHOT_TABLE_NAME)
    ddb_data = ddb_snapshot_table.get_item(
        Key={
            "distributionId": distribution_id,
            "snapShotName": '_LATEST_'
        })
    if 'Item' in ddb_data:
        # Update the latest snapshot record
        # Update the snapshot version to latest version
        response = ddb_snapshot_table.update_item(
            Key={
                'distributionId': distribution_id,
                'snapShotName': '_LATEST_'
            },
            UpdateExpression="set versionId=:r",
            ExpressionAttributeValues={
                ':r': new_version,
            },
            ReturnValues="UPDATED_NEW"
        )
        log.info("Snapshot Latest version been updated")
    else:
        logging.info("not found any snapshot records for distribution:" + distribution_id)
        logging.info("create first snapshot record for distribution:" + distribution_id)
        ddb_snapshot_table.put_item(
            Item={
                'distributionId': distribution_id,
                'snapShotName': "_LATEST_",
                'versionId': new_version,
                'dateTime': current_time,
                'note': ""
            })
        log.info("Snapshot Latest version does not exist, just create a new one")

def main(event, context):
    import logging as log
    import cfnresponse
    log.getLogger().setLevel(log.INFO)

    # This needs to change if there are to be multiple resources in the same stack
    physical_id = 'CustomResourceForConfigVersion'

    try:
        log.info('Input event: %s', event)

        # Check if this is a 'Create' or 'Update'
        if (event['RequestType'] == 'Create') or (event['RequestType'] == 'Update'):
            # first get distribution List from current account

            cf_client = boto3.client('cloudfront')
            response = cf_client.list_distributions()

            result = []
            ddb_client = boto3.resource('dynamodb')
            ddb_table= ddb_client.Table(DDB_LATESTVERSION_TABLE_NAME)
            for dist in response['DistributionList']['Items']:
                distribution_id = dist['Id']
                # search ddb for the distribution id
                response = ddb_table.query(
                    KeyConditionExpression=Key('distributionId').eq(distribution_id)
                )
                if(len(response['Items']) == 0):
                    # try to insert meta data to our ddb
                    update_config_version(distribution_id)

        message = event['ResourceProperties']['message']
        attributes = {
            'Response': 'Cloudfront configuration init completed: "%s"' % message
        }

        cfnresponse.send(event, context, cfnresponse.SUCCESS, attributes, physical_id)
    except Exception as e:
        log.exception(e)
        # cfnresponse's error message is always "see CloudWatch"
        cfnresponse.send(event, context, cfnresponse.FAILED, {}, physical_id)
