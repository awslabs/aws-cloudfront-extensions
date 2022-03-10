import json
import boto3
import logging
import os
from datetime import datetime

from aws_lambda_powertools.event_handler import APIGatewayRestResolver

app = APIGatewayRestResolver()

S3_BUCKET = "cloudfrontconfigversions-cloudfrontconfigversions-60jwdz7zg1zi"
DDB_VERSION_TABLE_NAME = 'CloudFrontConfigVersionStack-CloudFrontConfigVersionTable6E23F7F5-D8I07GGNBYFJ'
DDB_LATESTVERSION_TABLE_NAME = 'CloudFrontConfigVersionStack-CloudFrontConfigLatestVersionTable44770AF8-7LF5V48RKDK0'

log = logging.getLogger()
log.setLevel('INFO')

@app.get("/cf_config_manager/versions/<versionId>")
def hello_name(versionId):
    return {"message": f"hello {versionId}!"}

@app.get("/cf_config_manager/versions")
def manager_version_get():
    return {"message": "getting all version of specific distribution!"}

@app.get("/cf_config_manager")
def manager():
    return {"message": "hello unknown!"}


def lambda_handler(event, context):
    return app.resolve(event, context)