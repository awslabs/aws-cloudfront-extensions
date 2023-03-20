import datetime
import logging
import os

import boto3

region = os.environ['AWS_REGION']
CFF_ARN = os.environ['CFF_ARN']
CF_DIST_ID = os.environ['CF_DIST_ID']
CF_BEHAVIOR = os.environ['CF_BEHAVIOR']
CF_STAGE = os.environ['CF_STAGE']
cloudfront_client = boto3.client('cloudfront')
ORIGIN_HEADER = {
    'Custom::TrueClientIp': {
        'name': 'true-client-ip',
        'items': [
            'true-client-ip'
        ]
    },
    'Custom::RedirectByCountry': {
        'name': 'cloudfront-viewer-country',
        'items': [
            'cloudfront-viewer-country'
        ]
    },
    'Custom::RedirectByDevice': {
        'name': 'device-viewer',
        'items': [
            'CloudFront-Is-IOS-Viewer',
            'CloudFront-Is-Android-Viewer',
            'CloudFront-Is-Desktop-Viewer'
        ]
    }
}

log = logging.getLogger()
log.setLevel('INFO')


def update_origin_req_policy(new_header):
    response = cloudfront_client.create_origin_request_policy(
        OriginRequestPolicyConfig={
            'Comment': 'Forward ' + new_header['name'] + ' header',
            'Name': new_header['name'] + str(int(datetime.datetime.utcnow().timestamp())),
            'HeadersConfig': {
                'HeaderBehavior': 'whitelist',
                'Headers': {
                    'Quantity': len(new_header['items']),
                    'Items': new_header['items']
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


def update_func_config(cache_behavior_config, para, stage, func_arn):
    cache_behavior_config['LambdaFunctionAssociations'] = update_lambda_config(
        cache_behavior_config['LambdaFunctionAssociations'], stage)
    cache_behavior_config['FunctionAssociations'] = update_cff_config(
        cache_behavior_config['FunctionAssociations'], para, stage, func_arn)

    return cache_behavior_config


def update_cf_config(dist_id, stage, behavior, func_arn, res_type):
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
        cf_config['DefaultCacheBehavior'] = update_func_config(
            cf_config['DefaultCacheBehavior'], para, stage, func_arn)

        if 'OriginRequestPolicyId' not in cf_config['DefaultCacheBehavior'] and 'ForwardedValues' not in cf_config['DefaultCacheBehavior']:
            if res_type == 'Custom::TrueClientIp' or res_type == 'Custom::RedirectByCountry' or res_type == 'Custom::RedirectByDevice':
                # Add this header to origin request header if no origin request header existed
                # The user needs to add the header manually if the distribution has an origin request header
                if len(origin_request_policy_id) == 0:
                    origin_request_policy_id = update_origin_req_policy(
                        ORIGIN_HEADER[res_type])
                cf_config['DefaultCacheBehavior']['OriginRequestPolicyId'] = origin_request_policy_id
    else:
        for i in range(len(cf_config['CacheBehaviors']['Items'])):
            if cf_config['CacheBehaviors']['Items'][i]['PathPattern'] == para['CacheBehavior']:
                cf_config['CacheBehaviors']['Items'][i] = update_func_config(
                    cf_config['CacheBehaviors']['Items'][i], para, stage, func_arn)

                if 'OriginRequestPolicyId' not in cf_config['CacheBehaviors']['Items'][i] and 'ForwardedValues' not in cf_config['CacheBehaviors']['Items'][i]:
                    if res_type == 'Custom::TrueClientIp' or res_type == 'Custom::RedirectByCountry' or res_type == 'Custom::RedirectByDevice':
                        if len(origin_request_policy_id) == 0:
                            origin_request_policy_id = update_origin_req_policy(
                                ORIGIN_HEADER[res_type])
                        cf_config['CacheBehaviors']['Items'][i]['OriginRequestPolicyId'] = origin_request_policy_id
                break
    log.info(cf_config)

    cloudfront_client.update_distribution(
        DistributionConfig=cf_config, Id=dist_id, IfMatch=e_tag)


def lambda_handler(event, context):
    log.info(event)
    request_type = event['RequestType'].upper() if (
        'RequestType' in event) else ""

    if event['ResourceType'] == 'Custom::TrueClientIp' or \
        event['ResourceType'] == 'Custom::RedirectByCountry' or \
            event['ResourceType'] == 'Custom::RedirectByDevice':
        if 'CREATE' in request_type or 'UPDATE' in request_type:
            behavior_list = CF_BEHAVIOR.replace(
                '[', '').replace(']', '').split(',')
            for behavior in behavior_list:
                behavior = behavior.strip()
                update_cf_config(CF_DIST_ID, CF_STAGE, behavior,
                                 CFF_ARN, event['ResourceType'])
