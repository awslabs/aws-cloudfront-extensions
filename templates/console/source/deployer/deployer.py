import csv
import json
import os

import boto3
from boto3.dynamodb.conditions import Attr
import requests
import shortuuid
from aws_lambda_powertools import Logger, Metrics, Tracer
from aws_lambda_powertools.event_handler import AppSyncResolver
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.metrics import MetricUnit
from aws_lambda_powertools.utilities.data_classes.appsync import \
    scalar_types_utils
from boto3.dynamodb.conditions import Key

region = os.environ['AWS_REGION']
DDB_TABLE_NAME = os.environ['DDB_TABLE_NAME']
EXT_META_DATA_URL = os.environ['EXT_META_DATA_URL']

sar_client = boto3.client('serverlessrepo')
cfn_client = boto3.client('cloudformation')
cloudfront_client = boto3.client('cloudfront')
lambda_client = boto3.client('lambda')
dynamodb_client = boto3.resource('dynamodb', region_name=region)
ddb_table = dynamodb_client.Table(DDB_TABLE_NAME)

logger = Logger(service="Console")
tracer = Tracer(service="Console")
metrics = Metrics(namespace="CloudFrontExtensions", service="Console")
app = AppSyncResolver()


@app.resolver(type_name="Mutation", field_name="deployExtension")
def deploy_ext(name, parameters):
    logger.info(f"Deploy extension: {name}")
    query_item = query_ddb(name)
    template_url = query_item['templateUri']
    ext_para = query_item['cfnParameter']

    if len(ext_para) > 0:
        ext_para_json = json.loads(ext_para)
        para_stack = []
        for item_key in ext_para_json.keys():
            '''
            Parameter key value example in create_stack:
            {
                'ParameterKey': 'referAllowList',
                'ParameterValue': '*.example.com'
            }
            '''
            kv_pair = {}
            for para in parameters:
                if item_key == para['parameterKey']:
                    kv_pair['ParameterKey'] = item_key
                    kv_pair['ParameterValue'] = para['parameterValue']
                    break

            para_stack.append(kv_pair)
    else:
        para_stack = []

    stack_resp = cfn_client.create_stack(
        StackName='cfe-' + shortuuid.uuid()[:7],
        TemplateURL=template_url,
        Parameters=para_stack,
        Capabilities=['CAPABILITY_AUTO_EXPAND', 'CAPABILITY_NAMED_IAM'])

    stack_id = stack_resp['StackId']
    logger.info(json.dumps(stack_resp))

    return {"stack_id": stack_id}

# TODO: pipeline update: once SAR publish github action is triggered, update cfn


@app.resolver(type_name="Mutation", field_name="syncExtensions")
def sync_ext():
    '''Get the latest extensions to local Dynamodb table'''
    with requests.Session() as s:
        meta_req = s.get(EXT_META_DATA_URL)
        meta_content = meta_req.content.decode('utf-8-sig')
        cr = csv.reader(meta_content.splitlines(), delimiter=',')

        for row in cr:
            table_item = {
                'name': row[0],
                'templateUri': row[1],
                'type': row[2],
                'desc': row[3],
                'codeUri': row[4],
                'stage': row[5],
                'updateDate': row[6],
                'author': row[7],
                'status': row[8],
                'tag': row[9],
                'cfnParameter': row[10]
            }
            table = dynamodb_client.Table(DDB_TABLE_NAME)
            ddb_response = table.put_item(Item=table_item)
            logger.info(json.dumps(table_item))
            logger.info(str(ddb_response))

    return {"message": "The extensions have been updated"}


@app.resolver(type_name="Query", field_name="queryByName")
def query_ddb(name):
    '''Query in Dynamodb table to get the extension'''
    response = ddb_table.query(
        KeyConditionExpression=Key('name').eq(name)
    )

    logger.info(response)

    if response['Count'] != 1:
        raise Exception(
            'More than one extension is found, the extension should be unique by name')

    for query_item in response['Items']:
        logger.info(query_item)
        return query_item

    return


@app.resolver(type_name="Query", field_name="listExtensions")
def list_ext(page=1, count=50):
    '''Get the extensions in pagination, page starts from 1'''
    scan_kwargs = {
        'FilterExpression': Key('status').eq('enabled'),
        'ProjectionExpression': '#name, templateUri, #type, #desc, codeUri, stage, updateDate, author, #status, tag, cfnParameter',
        'ExpressionAttributeNames': {
            '#name': 'name',
            '#type': 'type',
            '#desc': 'desc',
            '#status': 'status',
        }
    }

    response = ddb_table.scan(**scan_kwargs)
    res_items = response['Items']

    while "LastEvaluatedKey" in response:
        response = ddb_table.scan(
            ExclusiveStartKey=response['LastEvaluatedKey'])
        res_items.extend(response["Items"])

    total = len(res_items)
    start = (page - 1) * count
    end = page * count

    logger.info(
        f'Return result from {start} to {end} in total of {total}')
    return {
        'ext': res_items[start: end],
        'total': total,
        'page': page,
        'count': count
    }


@logger.inject_lambda_context(correlation_id_path=correlation_paths.APPSYNC_RESOLVER)
def lambda_handler(event, context):
    return app.resolve(event, context)
