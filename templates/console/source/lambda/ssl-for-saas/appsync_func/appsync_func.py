import logging
from time import sleep
import uuid
import boto3
import os
import json
import re
from datetime import datetime

from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.event_handler import AppSyncResolver

LAMBDA_TASK_ROOT = os.environ.get('LAMBDA_TASK_ROOT')

# add execution path
os.environ['PATH'] = os.environ['PATH'] + ':' + os.environ['LAMBDA_TASK_ROOT']

tracer = Tracer(service="ssl_for_saas_appsync_resolver")
logger = Logger(service="ssl_for_saas_appsync_resolver")

app = AppSyncResolver()

@app.resolver(type_name="Mutation", field_name="certCreate")
def certCreate(input):
    logger.info(input)
    data = {'createdAt': datetime.now().strftime('%Y-%m-%dT%H:%M:%SZ'),
            'status': "creating",
            'updatedAt': datetime.now().strftime('%Y-%m-%dT%H:%M:%SZ')}
    return data

@app.resolver(type_name="Mutation", field_name="certImport")
def certImport(input):
    logger.info(input)
    data = {'createdAt': datetime.now().strftime('%Y-%m-%dT%H:%M:%SZ'),
            'status': "creating",
            'updatedAt': datetime.now().strftime('%Y-%m-%dT%H:%M:%SZ')}
    return data

@logger.inject_lambda_context(correlation_id_path=correlation_paths.APPSYNC_RESOLVER)
@tracer.capture_lambda_handler
def lambda_handler(event, context):
    return app.resolve(event, context)