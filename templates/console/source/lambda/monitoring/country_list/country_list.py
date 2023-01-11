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
    """Get a list of country from DynamoDB table and sort them by request number"""
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
    # {
    #     "metricId": "request-d123.cloudfront.net",
    #     "timestamp": 1670578440,
    #     "metricData": {
    #         "US": [{
    #             "Count": "21"
    #         }],
    #         "KR": [{
    #             "Count": "10"
    #         }]
    #     }
    # }
    country_result = {}
    for item in res_items:
        for country in item["metricData"]:
            if country not in country_result:
                country_result[country] = int(item["metricData"][country][0]["Count"])
            else:
                country_result[country] += int(item["metricData"][country][0]["Count"])

    # Sort country_result in desc order
    sorted_country_result = sorted(
        country_result.items(), key=lambda kv: kv[1], reverse=True
    )

    country_array = []
    sum_req = 0
    for s in sorted_country_result:
        country_array.append({"country": s[0], "request": s[1]})
        sum_req += int(s[1])
    country_array.append({"country": "All", "request": sum_req})

    return country_array


@logger.inject_lambda_context(correlation_id_path=correlation_paths.APPSYNC_RESOLVER)
def lambda_handler(event, context):
    return app.resolve(event, context)
