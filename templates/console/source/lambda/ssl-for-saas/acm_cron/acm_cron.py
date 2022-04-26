import logging
import uuid
import boto3
import os
import json

# certificate need to create in region us-east-1 for cloudfront to use
acm = boto3.client('acm', region_name='us-east-1')
dynamo_client = boto3.client('dynamodb')
sf_client = boto3.client('stepfunctions')

LAMBDA_TASK_ROOT = os.environ.get('LAMBDA_TASK_ROOT')

logger = logging.getLogger('boto3')
logger.setLevel(logging.INFO)

# add execution path
os.environ['PATH'] = os.environ['PATH'] + ':' + os.environ['LAMBDA_TASK_ROOT']

# query acm status for specific taskToken
def query_certificate_status(task_token):
    """_summary_

    Args:
        task_token (_type_): _description_

    Returns:
        _type_: _description_
    """    
    # list all certificates, TBD take list_certificates out of such function
    resp = acm.list_certificates()
    logger.info('certificates summary: %s', json.dumps(resp))
    # True if all certificates with specified tag(token_id) are Issued
    certStatus = 'notIssued'

    # status union
    status_union = set()
    # iterate all certificates
    for certificate in resp['CertificateSummaryList']:
        # select certificates with tag 'token_id'
        tags = acm.list_tags_for_certificate(
            CertificateArn=certificate['CertificateArn']
        )
        logger.info('certificate tags: %s', json.dumps(tags))
        # iterate all tags and check if tag 'token_id' is present
        for tag in tags['Tags']:
            # logger.info('tag value: {}, task_token: {}'.format(tag['Value'], task_token))
            if tag['Key'] == 'task_token' and tag['Value'] == task_token:
                logger.info('certificate found: %s', certificate['CertificateArn'])
                # describe certificate
                resp = acm.describe_certificate(
                    CertificateArn=certificate['CertificateArn']
                )
                # check if status is ISSUED, 'PENDING_VALIDATION'|'ISSUED'|'INACTIVE'|'EXPIRED'|'VALIDATION_TIMED_OUT'|'REVOKED'|'FAILED',
                if resp['Certificate']['Status'] == 'ISSUED':
                    certStatus = 'certIssued'
                    logger.info('certificate issued: %s', certificate['CertificateArn'])
                    break
                elif resp['Certificate']['Status'] == 'PENDING_VALIDATION':
                    certStatus = 'certNotIssued'
                    logger.info('certificate not issued: %s with status %s', certificate['CertificateArn'] , resp['Certificate']['Status'])
                elif resp['Certificate']['Status'] == 'VALIDATION_TIMED_OUT' or resp['Certificate']['Status'] == 'FAILED':
                    certStatus = 'certFailed'
                    logger.info('certificate not issued: %s with status %s', certificate['CertificateArn'] , resp['Certificate']['Status'])
    return certStatus

def _set_task_success(token, output):
    sf_client.send_task_success(
        taskToken=token,
        output=json.dumps(output)
    )

def _set_task_failure(token, error):
    sf_client = boto3.client('stepfunctions')

    sf_client.send_task_failure(
        taskToken=token,
        error=json.dumps(error)
    )

def _set_task_heartbeat(token):
    sf_client.send_task_heartbeat(
        taskToken=token
    )

def _update_acm_metadata_task_status(callbackTable, taskToken, domainName, taskStatus):
    """_summary_

    Args:
        callbackTable (_type_): _description_
        taskToken (_type_): _description_
        taskStatus (_type_): _description_
    """
    logger.info('update task (token %s, domain name %s) status to %s', taskToken, domainName, taskStatus)
    dynamo_client.update_item(
        TableName=callbackTable,
        Key={
            'taskToken': {
                'S': taskToken
            },
            'domainName': {
                'S': domainName
            }
        },
        UpdateExpression="set taskStatus = :status",
        ExpressionAttributeValues={
            ':status': {
                'S': taskStatus
            }
        }
    )

# fetch acm list that waiting for dcv
def fetch_acm_status_from_waiting_list(table_name, task_type, task_status):
    """_summary_

    Args:
        table_name (_type_): _description_
        task_type (_type_): _description_
        task_status (_type_): _description_

    Raises:
        Exception: _description_
    """    
    response = dynamo_client.scan(
        TableName=table_name,
        FilterExpression="taskStatus = :ts",
        ExpressionAttributeValues={
            # ':t': {
            #     'S': task_type
            # },
            ':ts': {
                'S': task_status
            }
        }
    )
    if response['Count'] == 0:
        logger.info('No Task found with taskStatus: %s', task_status)
        return

    # filter item into acm_dcv_dict with {taskToken1: [certUUid1, certUUid2, ...], ...}
    logger.info('dynamodb scan result with status TASK_TOKEN_TAGGED: %s', json.dumps(response))

    # an empty key value pair
    acm_dcv_dict = {}

    for item in response['Items']:
        # create list in dict
        if item['taskToken']['S'] not in acm_dcv_dict:
            acm_dcv_dict[item['taskToken']['S']] = []
        # append certUUid into list
        acm_dcv_dict[item['taskToken']['S']].append(item['domainName']['S'])

    # iterate all taskToken in acm_dcv_dict
    for task_token in acm_dcv_dict:
        resp = query_certificate_status(task_token[:128])
        # check if all certificates with specified taskToken are issued
        if resp == 'certIssued':
            # note such output will be carried into next state as input
            for domainName in acm_dcv_dict[task_token]:
                _update_acm_metadata_task_status(table_name, task_token, domainName, 'CERT_ISSUED')
            _set_task_success(item['taskToken']['S'], {'status': 'SUCCEEDED'})
            # update all certs in acm_dcv_dict, validate transient status are:
            # TASK_TOKEN_TAGGED | CERT_ISSUED | CERT_FAILED
        elif resp == 'certNotIssued':
            logger.info('one or more certificate with task token %s not issued', task_token)
            _set_task_heartbeat(item['taskToken']['S'])
        elif resp == 'certFailed':
            logger.info('one or more certificate with task token %s failed to issue', task_token)
            # iterate all certs in acm_dcv_dict, TBD delete DynamoDB item and notify with sns directly
            for domainName in acm_dcv_dict[task_token]:
                _update_acm_metadata_task_status(table_name, task_token, domainName, 'CERT_FAILED')
            _set_task_failure(item['taskToken']['S'], {'status': 'FAILED'})

def lambda_handler(event, context):
    """_summary_

    Args:
        event (_type_): _description_
        context (_type_): _description_
    """
    logger.info("Received event: " + json.dumps(event))

    # get task_token from event to create callback task
    callback_table = os.getenv('CALLBACK_TABLE')
    task_type = os.getenv('TASK_TYPE')

    fetch_acm_status_from_waiting_list(callback_table, task_type, task_status='TASK_TOKEN_TAGGED')