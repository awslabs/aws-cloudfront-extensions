import datetime
import json
import logging
import os

import boto3

region = os.environ['AWS_REGION']
CFF_ARN = os.environ['CFF_ARN']
CF_DIST_ID = os.environ['CF_DIST_ID']
CF_BEHAVIOR = os.environ['CF_BEHAVIOR']
CF_STAGE = os.environ['CF_STAGE']
cloudfront_client = boto3.client('cloudfront')

log = logging.getLogger()
log.setLevel('INFO')


def update_forwarded_header(new_header):
    response = cloudfront_client.create_origin_request_policy(
        OriginRequestPolicyConfig={
            'Comment': 'Forward true-client-ip header',
            'Name': 'TrueClientIp' + str(int(datetime.datetime.utcnow().timestamp())),
            'HeadersConfig': {
                'HeaderBehavior': 'whitelist',
                'Headers': {
                    'Quantity': 1,
                    'Items': [
                        new_header
                    ]
                }
            },
            'CookiesConfig': {
                'CookieBehavior': 'none'
            },
            'QueryStringsConfig': {
                'QueryStringBehavior': 'none'
            }
        }
    )

    log.info(response['OriginRequestPolicy']['Id'])
    return response['OriginRequestPolicy']['Id']


def update_lambda_config(lambda_association, stage):
    # Remove the lambda if the lambda is deployed on the same stage with the function
    if lambda_association['Quantity'] != 0:
        for lambda_item in lambda_association['Items']:
            if lambda_item['EventType'] == stage:
                lambda_association['Quantity'] = lambda_association['Quantity'] - 1
                lambda_association['Items'].remove(lambda_item)
                break

    return lambda_association


def update_cff_config(cff_association, para, stage, func_arn):
    if cff_association['Quantity'] == 0:
        cff_association = para['CFF']
    else:
        stage_occupied = False
        for i in range(len(cff_association['Items'])):
            if cff_association['Items'][i]['EventType'] == stage:
                # Replace the existed CFF with the same stage
                cff_association['Items'][i]['FunctionARN'] = func_arn
                stage_occupied = True
                break
        if not stage_occupied:
            cff_association['Quantity'] = cff_association['Quantity'] + 1
            cff_association['Items'].append(para['CFF']['Items'][0])

    return cff_association


def update_cf_config(dist_id, stage, behavior, func_arn):
    '''Associate extensions with the distribution'''
    para = {
        'CacheBehavior': behavior,
        'CFF': {
            'Quantity': 1,
            'Items': [
                {
                    'FunctionARN': func_arn,
                    'EventType': stage
                }
            ]
        }
    }

    config_resp = cloudfront_client.get_distribution_config(Id=dist_id)
    cf_config = config_resp['DistributionConfig']
    e_tag = config_resp['ETag']
    origin_request_policy_id = ''
    log.info(cf_config)

    # Add function config into distribution config
    if para['CacheBehavior'] == 'Default (*)':
        cf_config['DefaultCacheBehavior']['LambdaFunctionAssociations'] = update_lambda_config(
            cf_config['DefaultCacheBehavior']['LambdaFunctionAssociations'], stage)
        cf_config['DefaultCacheBehavior']['FunctionAssociations'] = update_cff_config(
            cf_config['DefaultCacheBehavior']['FunctionAssociations'], para, stage, func_arn)

        if 'OriginRequestPolicyId' not in cf_config['DefaultCacheBehavior'] and 'ForwardedValues' not in cf_config['DefaultCacheBehavior']:
            # Add this header to origin request header if no origin request header existed
            # The user needs to add the header manually if the distribution has an origin request header
            if len(origin_request_policy_id) == 0:
                origin_request_policy_id = update_forwarded_header(
                    'true-client-ip')
            cf_config['DefaultCacheBehavior']['OriginRequestPolicyId'] = origin_request_policy_id
    else:
        for i in range(len(cf_config['CacheBehaviors']['Items'])):
            if cf_config['CacheBehaviors']['Items'][i]['PathPattern'] == para[
                    'CacheBehavior']:
                cf_config['CacheBehaviors']['Items'][i]['LambdaFunctionAssociations'] = update_lambda_config(
                    cf_config['CacheBehaviors']['Items'][i]['LambdaFunctionAssociations'], stage)
                cf_config['CacheBehaviors']['Items'][i]['FunctionAssociations'] = update_cff_config(
                    cf_config['CacheBehaviors']['Items'][i]['FunctionAssociations'], para, stage, func_arn)
                if 'OriginRequestPolicyId' not in cf_config['CacheBehaviors']['Items'][i] and 'ForwardedValues' not in cf_config['CacheBehaviors']['Items'][i]:
                    if len(origin_request_policy_id) == 0:
                        origin_request_policy_id = update_forwarded_header(
                            'true-client-ip')
                    cf_config['CacheBehaviors']['Items'][i]['OriginRequestPolicyId'] = origin_request_policy_id
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

    if event['ResourceType'] == "Custom::TrueClientIp":
        if 'CREATE' in request_type or 'UPDATE' in request_type:
            behavior_list = CF_BEHAVIOR.replace(
                '[', '').replace(']', '').split(',')
            for behavior in behavior_list:
                behavior = behavior.strip()
                update_cf_config(CF_DIST_ID, CF_STAGE, behavior, CFF_ARN)
