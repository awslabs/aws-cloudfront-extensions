import csv
import os

import boto3
import requests
import shortuuid
from aws_lambda_powertools import Logger, Metrics, Tracer
from aws_lambda_powertools.event_handler import AppSyncResolver
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.metrics import MetricUnit
from aws_lambda_powertools.utilities.data_classes.appsync import \
    scalar_types_utils
from boto3.dynamodb.conditions import Attr, Key

from common.ext_repo import sync_ext

region = os.environ['AWS_REGION']
DDB_TABLE_NAME = os.environ['DDB_TABLE_NAME']
EXT_META_DATA_URL = os.environ['EXT_META_DATA_URL']

sar_client = boto3.client('serverlessrepo')
cfn_client = boto3.client('cloudformation', region_name=region)
cloudfront_client = boto3.client('cloudfront')
dynamodb_client = boto3.resource('dynamodb', region_name=region)
ddb_table = dynamodb_client.Table(DDB_TABLE_NAME)

logger = Logger(service="Console")
app = AppSyncResolver()


@app.resolver(type_name="Mutation", field_name="deployExtension")
def deploy_ext(name, parameters):
    logger.info(f"Deploy extension: {name}")
    query_item = query_ddb(name)
    template_url = query_item['templateUri']
    para_stack = []

    if len(parameters) > 0:
        '''
        Parameter key value example in create_stack:
        {
            'ParameterKey': 'referAllowList',
            'ParameterValue': '*.example.com'
        }
        '''
        for para in parameters:
            kv_pair = {}
            kv_pair['ParameterKey'] = para['parameterKey']
            kv_pair['ParameterValue'] = para['parameterValue']
            para_stack.append(kv_pair)

    stack_resp = cfn_client.create_stack(
        StackName='cfe-' + shortuuid.uuid()[:7],
        TemplateURL=template_url,
        Parameters=para_stack,
        Capabilities=['CAPABILITY_AUTO_EXPAND', 'CAPABILITY_NAMED_IAM'])

    stack_id = stack_resp['StackId']

    return stack_id


@app.resolver(type_name="Mutation", field_name="syncExtensions")
def sync_extensions():
    '''Get the latest extensions to local Dynamodb table'''
    return sync_ext(EXT_META_DATA_URL, DDB_TABLE_NAME)

@app.resolver(type_name="Mutation", field_name="updateDomains")
def update_domains(stack_name, domains):
    
    domain_list = ','.join(domains)
    lambda_client = boto3.client('lambda')
    functions_list = lambda_client.list_functions()['Functions']
    for fcn in functions_list:
        if 'FunctionName' in fcn and fcn['FunctionName'].startswith(stack_name + '-metricsCollect'):
            conf = lambda_client.get_function_configuration(
                FunctionName=fcn['FunctionName'],
            )
            if domain_list == '0':
                return conf['Environment']['Variables']['DOMAIN_LIST']
            
            conf['Environment']['Variables']['DOMAIN_LIST'] = domain_list
            lambda_client.update_function_configuration(
                    FunctionName=fcn['FunctionName'],
                    Environment={
                        'Variables': conf['Environment']['Variables']
                    }
                )
    return domain_list

@app.resolver(type_name="Query", field_name="queryByName")
def query_ddb(name):
    '''Query in Dynamodb table to get the extension'''
    response = ddb_table.query(
        KeyConditionExpression=Key('name').eq(name)
    )

    logger.info(response)

    if response['Count'] == 0:
        raise Exception(
            'No extension is found, please sync the extensions and retry')
    if response['Count'] > 1:
        raise Exception(
            'More than one extension is found, the extension should be unique by name')

    for query_item in response['Items']:
        logger.info(query_item)
        return query_item


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
        'extension': res_items[start: end],
        'total': total
    }


@app.resolver(type_name="Query", field_name="listCloudFrontDistWithId")
def list_cf_dist_with_id(maxItems=-1, marker=''):
    '''List CloudFront distribution id in the drop-down list'''
    if maxItems == -1 and marker == '':
        response = cloudfront_client.list_distributions()
    else:
        response = cloudfront_client.list_distributions(Marker=marker,
                                                        MaxItems=str(maxItems))

    result = []
    result_item = {}
    total = len(response['DistributionList']['Items'])
    for dist in response['DistributionList']['Items']:
        result_item['id'] = dist['Id']
        result.append(result_item)

    return {
        'dist': result,
        'total': total
    }


@app.resolver(type_name="Query", field_name="behaviorById")
def get_behavior_by_id(id):
    '''Get CloudFront behavior config'''
    response = cloudfront_client.get_distribution_config(Id=id)

    result = []
    if 'DefaultCacheBehavior' in response['DistributionConfig']:
        result.append('Default (*)')

    if 'CacheBehaviors' in response['DistributionConfig'] and 'Items' in response['DistributionConfig']['CacheBehaviors']:
        for item in response['DistributionConfig']['CacheBehaviors']['Items']:
            result.append(item['PathPattern'])

    return result


@app.resolver(type_name="Query", field_name="checkSyncStatus")
def check_sync_status():
    '''Check whether it is need to sync extensions'''
    date_array = {}

    with requests.Session() as s:
        meta_req = s.get(EXT_META_DATA_URL)
        meta_content = meta_req.content.decode('utf-8-sig')
        cr = csv.reader(meta_content.splitlines(), delimiter=',')

        for row in cr:
            date_array[row[0]] = row[6]

    if len(date_array) == 0:
        raise Exception(
            'No extension is found from origin, please contact solution builder to get support')

    scan_kwargs = {
        'ProjectionExpression': '#name, updateDate',
        'ExpressionAttributeNames': {
            '#name': 'name'
        }
    }

    response = ddb_table.scan(**scan_kwargs)
    res_items = response['Items']

    while "LastEvaluatedKey" in response:
        response = ddb_table.scan(
            ExclusiveStartKey=response['LastEvaluatedKey'])
        res_items.extend(response["Items"])

    if len(res_items) != len(date_array):
        return 'true'

    for ddb_item in res_items:
        if date_array[ddb_item['name']] != ddb_item['updateDate']:
            return 'true'

    return 'false'


@logger.inject_lambda_context(correlation_id_path=correlation_paths.APPSYNC_RESOLVER)
def lambda_handler(event, context):
    return app.resolve(event, context)
