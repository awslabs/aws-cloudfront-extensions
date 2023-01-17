import logging
import os

import boto3

region = os.environ['AWS_REGION']
Lambda_ARN = os.environ['LE_ARN']
CF_DIST_ID = os.environ['CF_DIST_ID']
CF_BEHAVIOR = os.environ['CF_BEHAVIOR']
CF_STAGE = os.environ['CF_STAGE']
cloudfront_client = boto3.client('cloudfront')
lambda_client = boto3.client('lambda', region_name=region)

log = logging.getLogger()
log.setLevel('INFO')


def get_lambda_max_version(func_arn):
    list_result = lambda_client.list_versions_by_function(
        FunctionName=func_arn)
    all_versions = list_result['Versions']
    while 'NextMarker' in list_result:
        list_result = lambda_client.list_versions_by_function(
            FunctionName=func_arn, Marker=list_result['NextMarker'])
        all_versions += list_result['Versions']

    versions_without_latest = list(filter(lambda version: version != '$LATEST', map(
        lambda version: version['Version'], all_versions)))
    versions_without_latest = list(
        map(lambda version: int(version), versions_without_latest))

    if len(versions_without_latest) > 0:
        return max(versions_without_latest)
    else:
        raise ValueError(
            'No version is created in Lambda function: ' + func_arn)


def update_lambda_config(lambda_association, para, stage, func_arn):
    if lambda_association['Quantity'] == 0:
        lambda_association = para['Lambda']
    else:
        stage_occupied = False
        for i in range(len(lambda_association['Items'])):
            if lambda_association['Items'][i]['EventType'] == stage:
                # Replace the existed Lambda with the same stage
                lambda_association['Items'][i]['LambdaFunctionARN'] = func_arn
                stage_occupied = True
                break
        if not stage_occupied:
            lambda_association['Quantity'] = lambda_association['Quantity'] + 1
            lambda_association['Items'].append(para['Lambda']['Items'][0])

    return lambda_association


def update_cff_config(cff_association, stage):
    # Remove the cff if the cff is deployed on the same viewer stage with the function
    if stage == 'viewer-request' or stage == 'viewer-response':
        if cff_association['Quantity'] != 0:
            for item in cff_association['Items']:
                if item['EventType'] == stage:
                    cff_association['Quantity'] = cff_association['Quantity'] - 1
                    cff_association['Items'].remove(item)
                    break

    return cff_association


def update_cf_config(dist_id, stage, behavior, func_arn):
    '''Associate extensions with the distribution'''
    func_arn = func_arn + ':' + str(get_lambda_max_version(func_arn))
    log.info(func_arn)
    para = {
        'CacheBehavior': behavior,
        'Lambda': {
            'Quantity': 1,
            'Items': [
                {
                    'LambdaFunctionARN': func_arn,
                    'EventType': stage,
                    'IncludeBody': False
                }
            ]
        }
    }
    
    config_resp = cloudfront_client.get_distribution_config(Id=dist_id)
    cf_config = config_resp['DistributionConfig']
    e_tag = config_resp['ETag']
    log.info(cf_config)

    # Add function config into distribution config
    if para['CacheBehavior'] == 'Default (*)':
        cf_config['DefaultCacheBehavior']['LambdaFunctionAssociations'] = update_lambda_config(
            cf_config['DefaultCacheBehavior']['LambdaFunctionAssociations'], para, stage, func_arn)
        cf_config['DefaultCacheBehavior']['FunctionAssociations'] = update_cff_config(
            cf_config['DefaultCacheBehavior']['FunctionAssociations'], stage)
    else:
        for i in range(len(cf_config['CacheBehaviors']['Items'])):
            if cf_config['CacheBehaviors']['Items'][i]['PathPattern'] == para[
                    'CacheBehavior']:
                cf_config['CacheBehaviors']['Items'][i]['LambdaFunctionAssociations'] = update_lambda_config(
                    cf_config['CacheBehaviors']['Items'][i]['LambdaFunctionAssociations'], para, stage, func_arn)
                cf_config['CacheBehaviors']['Items'][i]['FunctionAssociations'] = update_cff_config(
                    cf_config['CacheBehaviors']['Items'][i]['FunctionAssociations'], stage)
                break
    log.info(cf_config)

    update_resp = cloudfront_client.update_distribution(
        DistributionConfig=cf_config, Id=dist_id, IfMatch=e_tag)
    log.info(update_resp)


def lambda_handler(event, context):
    log.info(event)
    request_type = event['RequestType'].upper() if (
        'RequestType' in event) else ""
    log.info(request_type)

    if event['ResourceType'] == "Custom::ResizeImage":
        if 'CREATE' in request_type or 'UPDATE' in request_type:
            behavior_list = CF_BEHAVIOR.replace(
                '[', '').replace(']', '').split(',')
            for behavior in behavior_list:
                behavior = behavior.strip()
                update_cf_config(CF_DIST_ID, CF_STAGE, behavior, Lambda_ARN)
