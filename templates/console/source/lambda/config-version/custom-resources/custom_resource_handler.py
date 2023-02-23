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

def update_config_version(cf_client, distribution_id):
    # export the cloudfront config to S3 bucket and directory
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
            'dateTime': str(datetime.now()),
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
                'dateTime': str(datetime.now()),
                'note': ""
            })
        log.info("Snapshot Latest version does not exist, just create a new one")

def create_iam_role(context):
    iam = boto3.client("iam")

    assume_role_policy_document = json.dumps({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "Service": "events.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }
        ]
    })

    role_name = "cloudfrontExtensionEventBridgeRule" + context.aws_request_id
    MAX_ROLE_NAME_LENGTH = 64
    try:
        response = iam.get_role(
            RoleName = role_name[:MAX_ROLE_NAME_LENGTH]
        )
        if 'Role' in response:
            log.info('cloudfrontExtensionEventBridgeRule already exist')
            return response['Role']['Arn']
    except iam.exceptions.NoSuchEntityException:
        log.info('cloudfrontExtensionEventBridgeRule does not exist, will trying to create one')

        response = iam.create_role(
            RoleName = role_name[:MAX_ROLE_NAME_LENGTH],
            AssumeRolePolicyDocument = assume_role_policy_document
        )

        create_role_result = response['Role']
        role_name = create_role_result['RoleName']
        role_arn = create_role_result['Arn']

        runtime_region = os.environ['AWS_REGION']

        account_id = context.invoked_function_arn.split(":")[4]

        # Create a policy
        put_event_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": "events:PutEvents",
                    "Resource": 'arn:aws:events:' + runtime_region + ':' + account_id + ':event-bus/default',
                    "Effect": "Allow"
                }
            ]
        }

        policy_name = "cloudfrontExtensionEventBridgePolicy" + context.aws_request_id
        MAX_POLICY_NAME_LENGTH = 64

        response = iam.create_policy(
            PolicyName = policy_name[:MAX_POLICY_NAME_LENGTH],
            PolicyDocument = json.dumps(put_event_policy)
        )
        policy_result = response['Policy']
        policy_arn = policy_result['Arn']

        log.info(response)

        response = iam.attach_role_policy(
            RoleName = role_name,
            PolicyArn = policy_arn
        )

        return role_arn


def create_eventbridge_in_us_east_1(context):
    runtime_region = os.environ['AWS_REGION']
    if runtime_region == 'us-east-1':
        log.info("no need create eventbridge in us-east-1")
        return

    iam = boto3.resource('iam')
    account_id = context.invoked_function_arn.split(":")[4]

    # Only create the eventbridge in us-east-1
    eventclient = boto3.client('events',region_name='us-east-1')

    target_rule_name = 'eventbridge-receive-cf-event' + '-' + runtime_region

    # first check whether target rule is existing
    response = eventclient.list_rules(
        NamePrefix = target_rule_name
    )
    record_list = response['Rules']

    if len(record_list) != 0:
        log.info(record_list)
        log.info("target rule already exist, just return")
        return

    # create the target rules
    role_name = create_iam_role(context)

    evtbridgeRulePattern = '{\n  "source": ["aws.cloudfront"],\n  "detail": {\n    "eventName": ["UpdateDistribution", "CreateDistribution", "CreateDistributionWithTags"]\n  }\n}'
    response = eventclient.put_rule(
        Name = target_rule_name,
        EventPattern = evtbridgeRulePattern,
        State = 'ENABLED',
        Description = 'receive cloudfront update event'
    )

    response = eventclient.put_targets(
        Rule=target_rule_name,
        Targets=[
            {
                'Id': 'cf-update-event',
                'Arn': 'arn:aws:events:' + runtime_region + ':' + account_id + ':event-bus/default',
                'RoleArn': role_name
            }
        ]
    )
    return {
        'statusCode': 200,
        'body': json.dumps('Hello from Lambda!')
    }
def get_all_distribution_ids(cloudfront):
    # get all cloudfront distributions
    dist_list = []

    response = cloudfront.list_distributions()
    distribution_list = response['DistributionList']['Items']
    dist_list.extend(distribution_list)

    while 'NextMarker' in response['DistributionList']:
        print(response['DistributionList'])
        next_token = response['DistributionList']['NextMarker']
        response = cloudfront.list_distributions(Marker=next_token)
        dist_list.extend(response['DistributionList']['Items'])

    return dist_list


def main(event, context):
    import logging as log
    import cfnresponse
    log.getLogger().setLevel(log.INFO)

    # This needs to change if there are to be multiple resources in the same stack
    physical_id = 'CustomResourceForConfigVersion'

    try:
        log.info('Input event: %s', event)

        # Check if this is a 'Create' or 'Update'
        cf_client = boto3.client('cloudfront')
        if (event['RequestType'] == 'Create') or (event['RequestType'] == 'Update'):
            # first get distribution List from current account

            cf_dist_list = get_all_distribution_ids(cf_client)

            import_cloudfront_configs(cf_client, cf_dist_list)

        if (event['RequestType'] == 'Create'):
            create_eventbridge_in_us_east_1(context)


        message = event['ResourceProperties']['message']
        attributes = {
            'Response': 'Cloudfront configuration init completed: "%s"' % message
        }

        cfnresponse.send(event, context, cfnresponse.SUCCESS, attributes, physical_id)
    except Exception as e:
        log.exception(e)
        # cfnresponse's error message is always "see CloudWatch"
        cfnresponse.send(event, context, cfnresponse.FAILED, {}, physical_id)


def import_cloudfront_configs(cf_client, cf_dist_list):
    result = []
    ddb_client = boto3.resource('dynamodb')
    ddb_table = ddb_client.Table(DDB_LATESTVERSION_TABLE_NAME)
    for dist in cf_dist_list:
        distribution_id = dist['Id']
        # search ddb for the distribution id
        response = ddb_table.query(
            KeyConditionExpression=Key('distributionId').eq(distribution_id)
        )
        if (len(response['Items']) == 0):
            # try to insert meta data to our ddb
            update_config_version(cf_client, distribution_id)
