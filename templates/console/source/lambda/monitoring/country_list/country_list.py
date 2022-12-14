import os

import boto3
from aws_lambda_powertools import Logger
from aws_lambda_powertools.event_handler import AppSyncResolver
from aws_lambda_powertools.logging import correlation_paths
from boto3.dynamodb.conditions import Key

region = os.environ["AWS_REGION"]
DDB_TABLE_NAME = os.environ["DDB_TABLE_NAME"]
dynamodb_client = boto3.resource("dynamodb", region_name=region)

logger = Logger(service="Monitoring")
app = AppSyncResolver()
metric_header = "request"


@app.resolver(type_name="Query", field_name="listCountry")
def list_country(domain, start_time, end_time):
    """Get a list of country from DynamoDB table"""
    logger.info(f"Listing country for domain {domain} from {start_time} to {end_time}")
    table = dynamodb_client.Table(DDB_TABLE_NAME)
    response = table.query(
        KeyConditionExpression=Key("metricId").eq(f"{metric_header}-{domain}")
        & Key("timestamp").between(start_time, end_time),
        ScanIndexForward=False,
    )

    if 0 == response["Count"]:
        logger.info(
            f"No data found for domain {domain} from {start_time} to {end_time}"
        )
        return []

    res_items = response["Items"]
    # Get distinct country from res_items
    country_list = list(set([item["country"] for item in res_items]))

    return country_list


@logger.inject_lambda_context(correlation_id_path=correlation_paths.APPSYNC_RESOLVER)
def lambda_handler(event, context):
    return app.resolve(event, context)
