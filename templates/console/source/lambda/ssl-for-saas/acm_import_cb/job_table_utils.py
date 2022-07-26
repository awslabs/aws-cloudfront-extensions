import logging
import boto3
import os
import json
import string
from boto3.dynamodb.conditions import Key

logger = logging.getLogger('boto3')
logger.setLevel(logging.INFO)


def create_job_info(ddb_table_name, job_id, job_input, cert_total_number, cloudfront_distribution_total_number,
                    cert_completed_number, cloudfront_distribution_created_number):
    ddb_client = boto3.resource('dynamodb')
    ddb_table = ddb_client.Table(ddb_table_name)
    logger.info(
        f"trying to create job record with ddb_table_name: {ddb_table_name}, job_id:{job_id}, "
        f"job_input: {job_input}, cert_total_number:{cert_total_number}, "
        f"cloudfront_distribution_total_number:{cloudfront_distribution_total_number}, "
        f"cert_completed_number:{cert_completed_number},"
        f"cloudfront_distribution_created_number:{cloudfront_distribution_created_number}")
    resp = ddb_table.put_item(
        Item={
            'jobId': job_id,
            'job_input': job_input,
            'cert_total_number': cert_total_number,
            'cloudfront_distribution_total_number': cloudfront_distribution_total_number,
            'cert_completed_number':  cert_completed_number,
            'cloudfront_distribution_created_number': cloudfront_distribution_created_number
        }
    )

def get_job_info(ddb_table_name, job_id):
    logger.info(f"get_job_info: job_id={job_id}")
    logger.info(f"get_job_info: ddb_table_name={ddb_table_name}")

    ddb_client = boto3.resource('dynamodb')
    ddb_table = ddb_client.Table(ddb_table_name)
    resp = ddb_table.query(
        KeyConditionExpression=Key('jobId').eq(job_id)
    )
    return resp


def update_job_cert_completed_number(ddb_table_name, job_id, current_number):
    ddb_client = boto3.resource('dynamodb')
    ddb_table = ddb_client.Table(ddb_table_name)
    response = ddb_table.update_item(
        Key={
            'jobId': job_id,
        },
        UpdateExpression="set cert_completed_number=:r",
        ExpressionAttributeValues={
            ':r': current_number
        },
        ReturnValues="UPDATED_NEW"
    )


def update_job_cloudfront_distribution_created_number(ddb_table_name, job_id, current_number):
    ddb_client = boto3.resource('dynamodb')
    ddb_table = ddb_client.Table(ddb_table_name)
    response = ddb_table.update_item(
        Key={
            'jobId': job_id,
        },
        UpdateExpression="set cloudfront_distribution_created_number=:r",
        ExpressionAttributeValues={
            ':r': current_number
        },
        ReturnValues="UPDATED_NEW"
    )

def update_job_field(ddb_table_name,job_id, field_name, value):
    ddb_client = boto3.resource('dynamodb')
    ddb_table = ddb_client.Table(ddb_table_name)
    response = ddb_table.update_item(
        Key={
            'jobId': job_id,
        },
        UpdateExpression=f"set {field_name}=:r",
        ExpressionAttributeValues={
            ':r': value
        },
        ReturnValues="UPDATED_NEW"
    )
