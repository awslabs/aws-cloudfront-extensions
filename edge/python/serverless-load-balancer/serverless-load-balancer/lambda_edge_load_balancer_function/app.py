from urllib.parse import parse_qs
import random
from string import Template
import json
import boto3
from botocore.exceptions import ClientError
import logging

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

ssm_client = boto3.client('ssm', region_name='us-east-1')
target_param = ssm_client.get_parameter(
    Name='target_param',
    WithDecryption=True
)
param_value = json.loads(target_param["Parameter"]["Value"])
table_name = param_value["asg_table"]
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
table = dynamodb.Table(table_name)

load_balancer_metric = param_value["load_balancer_metric"]
logger.info("table_name-------------------%s" % table_name)
logger.info("load_balancer_metric---------%s" % load_balancer_metric)


def lambda_handler(event, context):
    try:
        logger.info("Received event: %s" % json.dumps(event))

        request = event['Records'][0]['cf']['request']
        target_servers = table.scan()["Items"]
        # sort target server by load_balancer_metric
        sorted_servers = sorted(target_servers, key=lambda k: k.get(load_balancer_metric, 0), reverse=False)
        origin_server = sorted_servers[0]["dns"]
        request['origin']['custom']['domainName'] = origin_server
        request['headers']['host'] = [{'key': 'host', 'value': origin_server}]

        logger.info("target Server---------------------")
        logger.info(target_servers)
        logger.info("sorted Server---------------------")
        logger.info(sorted_servers)

        return request

    except ClientError as e:
        logger.error(e)
        return {
            'status': '500',
            'statusDescription': 'internal error'
        }
