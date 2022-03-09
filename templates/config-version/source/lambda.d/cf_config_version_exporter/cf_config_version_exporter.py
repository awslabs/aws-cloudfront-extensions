import json
import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError
import logging
import os
from datetime import datetime

# CATALOG_ID = os.environ['ACCOUNT_ID']
# S3_BUCKET = os.environ['S3_BUCKET']
S3_BUCKET = "cloudfrontconfigversions-cloudfrontconfigversions-60jwdz7zg1zi"
DDB_VERSION_TABLE_NAME = 'CloudFrontConfigVersionStack-CloudFrontConfigVersionTable6E23F7F5-D8I07GGNBYFJ'
DDB_LATESTVERSION_TABLE_NAME = 'CloudFrontConfigVersionStack-CloudFrontConfigLatestVersionTable44770AF8-7LF5V48RKDK0'


log = logging.getLogger()
log.setLevel('INFO')

def lambda_handler(event, context):
    #extract the distribution id from the input
    requestParameters = event["detail"]["requestParameters"]
    distributionId = requestParameters["id"]
    log.info(requestParameters["id"])

    #export the cloudfront config to S3 bucket and directory
    cf_client = boto3.client('cloudfront')
    response = cf_client.get_distribution_config(
        Id=distributionId
    )
    currentTime = datetime.now().strftime('%Y-%m-%d-%H-%M-%S')
    year = str(datetime.now().year)
    month = str('%02d' % datetime.now().month)
    day = str('%02d' % datetime.now().day)

    configName = distributionId+"_"+currentTime+".json"
    with open( configName, "w") as outfile:
        log.info(json.dumps(response["DistributionConfig"], indent = 4))
        json.dump(response["DistributionConfig"],outfile)

    s3_client = boto3.client('s3')
    s3_path = "s3://" + S3_BUCKET + "/" + distributionId+"/" +year + "/" + month + "/" + day + "/" +configName
    s3_key  = distributionId+"/" +year + "/" + month + "/" + day + "/" +configName
    try:
        response = s3_client.upload_file(configName, S3_BUCKET, s3_key)
    except ClientError as e:
        logging.error(e)

    #first get the latest versionId of updated distribution
    ddb_client = boto3.resource('dynamodb')
    ddb_table = ddb_client.Table(DDB_LATESTVERSION_TABLE_NAME)
    try:
        resp = ddb_table.query(
            KeyConditionExpression=Key('distributionId').eq(distributionId)
        )
        log.info(resp)
    except ClientError as e:
        logging.error(e)

    recordList = resp['Items']
    if len(recordList) == 0 :
        logging.info("not found any records for distribution:" + distributionId)
        logging.info("create first record for distribution:" + distributionId)
        ddb_table.put_item(
            Item = {
                    'distributionId': distributionId,
                    'versionId': 0
                   })
        resp = ddb_table.query(
                    KeyConditionExpression=Key('distributionId').eq(distributionId)
                )

    if 'Items' in resp:
        ddb_record = resp['Items'][0]
        currentVersion = ddb_record['versionId']
        newVersion = currentVersion + 1
    else:
        logging.error("failed to get the versionId")
        return {
            'statusCode': 500,
            'body': 'failed to get the distribution previous versionId'
        }

    #save the record to config version dynamoDB
    ddb_table = ddb_client.Table(DDB_VERSION_TABLE_NAME)
    response = ddb_table.put_item(
        Item={
                 'distributionId': str(distributionId),
                 'versionId': newVersion,
                 'dateTime' : currentTime,
                 'note' : 'auto_save',
                 'config_link' : s3_path
              })

    #update the config latest version ddb
    ddb_table = ddb_client.Table(DDB_LATESTVERSION_TABLE_NAME)
    response = ddb_table.update_item(
            Key={
                'distributionId': distributionId,
            },
            UpdateExpression="set versionId=:r",
            ExpressionAttributeValues={
                ':r': newVersion
            },
            ReturnValues="UPDATED_NEW"
        )

    return {
        'statusCode': 200,
        'body': 'succeed'
    }
