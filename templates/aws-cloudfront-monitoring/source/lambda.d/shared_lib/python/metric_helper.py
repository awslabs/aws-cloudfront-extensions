import json
import logging
import os
import time
from datetime import datetime, timedelta

import boto3

cf_client = boto3.client('cloudfront')
log = logging.getLogger()
log.setLevel('INFO')

SLEEP_TIME = 1
RETRY_COUNT = 60
INTERVAL = 5


def get_domain_list():
    domain_list_env = os.getenv('DOMAIN_LIST')
    domain_list = []
    if domain_list_env == "ALL":
        list_distributions_response = cf_client.list_distributions(
            MaxItems='200')
        list_distributions = list_distributions_response['DistributionList']

        while list_distributions['IsTruncated'] is True:
            if list_distributions['Quantity'] != 0:
                for distribution in list_distributions['Items']:
                    dist_domain_name = distribution['DomainName']
                    dist_aliases = distribution['Aliases']
                    if dist_aliases['Quantity'] == 0:
                        domain_list.append(dist_domain_name)
                    else:
                        for alias in dist_aliases['Items']:
                            domain_list.append(alias)
            next_marker = list_distributions['NextMarker']
            list_distributions_response = cf_client.list_distributions(
                Marker=next_marker, MaxItems='200')
            list_distributions = list_distributions_response[
                'DistributionList']

        if list_distributions['Quantity'] != 0:
            for distribution in list_distributions['Items']:
                dist_domain_name = distribution['DomainName']
                dist_aliases = distribution['Aliases']
                if dist_aliases['Quantity'] == 0:
                    domain_list.append(dist_domain_name)
                else:
                    for alias in dist_aliases['Items']:
                        domain_list.append(alias)
    else:
        domain_list = os.getenv('DOMAIN_LIST').split(",")

    return domain_list


def get_athena_query_result(athena_client, query_execution_id):
    '''Get Athena query by id'''
    for i in range(1, 1 + RETRY_COUNT):
        # Get query execution
        query_status = athena_client.get_query_execution(
            QueryExecutionId=query_execution_id)
        query_execution_status = query_status['QueryExecution']['Status'][
            'State']

        if query_execution_status == 'SUCCEEDED':
            log.info("[get_athena_query_result] STATUS: " +
                     query_execution_status + ", retry: " + str(i))
            break

        if query_execution_status == 'FAILED':
            raise Exception("[get_athena_query_result] STATUS:" +
                            query_execution_status + ", retry: " + str(i))

        else:
            log.info("[get_athena_query_result] STATUS:" +
                     query_execution_status + ", retry: " + str(i))
            time.sleep(SLEEP_TIME)
    else:
        athena_client.stop_query_execution(QueryExecutionId=query_execution_id)
        raise Exception('[get_athena_query_result] TIME OUT with retry ' +
                        str(RETRY_COUNT))

    # Get query results
    result = athena_client.get_query_results(
        QueryExecutionId=query_execution_id)
    log.info("[get_athena_query_result] Get query result")
    log.info(str(result))

    return result


def assemble_query(start_time, end_time, query_string):
    '''Add year/month/day/hour/minute into sql query string for Athena partition'''
    start_date_time = datetime.strptime(start_time, "%Y-%m-%d %H:%M:%S")
    end_date_time = datetime.strptime(end_time, "%Y-%m-%d %H:%M:%S")

    start_min = start_date_time.minute
    start_hour = start_date_time.hour
    start_day = start_date_time.day
    start_month = start_date_time.month
    start_year = start_date_time.year

    end_min = end_date_time.minute
    end_hour = end_date_time.hour
    end_day = end_date_time.day
    end_month = end_date_time.month
    end_year = end_date_time.year

    if (start_year == end_year):
        query_string += 'year = ' + str(start_year)
        if (start_month == end_month):
            query_string += ' AND month = ' + str(start_month)
            if (start_day == end_day):
                query_string += ' AND day = ' + str(start_day)
                if (start_hour == end_hour):
                    query_string += ' AND hour = ' + str(start_hour)
                    if (start_min == end_min):
                        query_string += ' AND minute = ' + str(start_min)
                    else:
                        query_string += ' AND minute BETWEEN ' + str(
                            start_min) + ' AND ' + str(end_min)

    return query_string


def schedule_athena_query(metric, start_time, end_time, athena_client,
                          db_name, table_name, query_output):
    log.info('[schedule_athena_query] Start')

    query_string = construct_query_string(
        db_name, start_time, end_time, metric, table_name)

    log.info("[schedule_athena_query] Query string: " + query_string)

    response = athena_client.start_query_execution(
        QueryString=query_string,
        QueryExecutionContext={'Database': db_name},
        ResultConfiguration={
            'OutputLocation': query_output,
            'EncryptionConfiguration': {
                'EncryptionOption': 'SSE_S3'
            }
        },
        WorkGroup="primary"
    )

    log.info('[schedule_athena_query] End')
    return response


def construct_query_string(db_name, start_time, end_time, metric, table_name):
    # Dynamically build query string using partition
    if metric == 'request':
        query_string = 'SELECT count(timestamp), "cs-host" FROM "' + \
            db_name + '"."' + table_name + '" WHERE '
        query_string = assemble_query(start_time, end_time, query_string)
        query_string += ' AND timestamp <= ' + str(
            format_date_time(end_time)) + ' AND timestamp > ' + str(
            format_date_time(start_time)) + ' group by "cs-host";'
    elif metric == 'requestOrigin':
        query_string = 'SELECT count(timestamp), "cs-host" FROM "' + \
            db_name + '"."' + table_name + '" WHERE '
        query_string = assemble_query(start_time, end_time, query_string)
        query_string += ' AND timestamp <= ' + str(
            format_date_time(end_time)) + ' AND timestamp > ' + str(
            format_date_time(start_time)
        ) + ' AND "x-edge-response-result-type"=\'Miss\' group by "cs-host";'
    elif metric == 'statusCode':
        query_string = 'SELECT "sc-status", count(timestamp), "cs-host" FROM "' + \
            db_name + '"."' + table_name + '" WHERE '
        query_string = assemble_query(start_time, end_time, query_string)
        query_string += ' AND timestamp <= ' + str(
            format_date_time(end_time)) + ' AND timestamp > ' + str(
            format_date_time(start_time)) + ' GROUP BY "sc-status", "cs-host";'
    elif metric == 'statusCodeOrigin':
        query_string = 'SELECT "sc-status", count(timestamp), "cs-host" FROM "' + \
            db_name + '"."' + table_name + '" WHERE '
        query_string = assemble_query(start_time, end_time, query_string)
        query_string += ' AND timestamp <= ' + str(
            format_date_time(end_time)
        ) + ' AND timestamp > ' + str(
            format_date_time(start_time)
        ) + ' AND "x-edge-response-result-type"=\'Miss\' GROUP BY "sc-status", "cs-host";'
    elif metric == 'bandwidth':
        query_string = 'SELECT sum("sc-bytes")*8/(60*' + str(INTERVAL) + '), "cs-host" FROM "' + \
            db_name + '"."' + table_name + '" WHERE '
        query_string = assemble_query(start_time, end_time, query_string)
        query_string += ' AND timestamp <= ' + str(
            format_date_time(end_time)) + ' AND timestamp > ' + str(
            format_date_time(start_time)) + ' group by "cs-host";'
    elif metric == 'bandwidthOrigin':
        query_string = 'SELECT sum("sc-bytes")*8/(60*' + str(INTERVAL) + '), "cs-host" FROM "' + \
            db_name + '"."' + table_name + '" WHERE '
        query_string = assemble_query(start_time, end_time, query_string)
        query_string += ' AND timestamp <= ' + str(
            format_date_time(end_time)) + ' AND timestamp > ' + str(
            format_date_time(start_time)
        ) + ' AND "x-edge-response-result-type"=\'Miss\' group by "cs-host";'
    elif metric == 'chr':
        query_string = 'SELECT cast((100.0 - sum(case when "x-edge-response-result-type" = \'Miss\' then 1 else 0 end) * 100.0 / count("timestamp")) as decimal(38,2)) as ratio, "cs-host" FROM "' + \
            db_name + '"."' + table_name + '" WHERE '
        query_string = assemble_query(start_time, end_time,
                                      query_string)
        query_string += ' AND timestamp <= ' + str(
            format_date_time(end_time)
        ) + ' AND timestamp > ' + str(
            format_date_time(start_time)
        ) + ' AND "x-edge-response-result-type" <> \'LimitExceeded\' AND "x-edge-response-result-type" <> \'CapacityExceeded\' AND "x-edge-response-result-type" <> \'Error\' AND "x-edge-response-result-type" <> \'Redirect\' group by "cs-host";'
    elif metric == 'chrBandWith':
        query_string = 'SELECT cast((100.0 - sum(case when "x-edge-response-result-type" = \'Miss\' then "cs-bytes" else 0 end) * 100.0 / sum("cs-bytes")) as decimal(38,2)) as ratio, "cs-host" FROM "' + \
            db_name + '"."' + table_name + '" WHERE '
        query_string = assemble_query(start_time, end_time,
                                      query_string)
        query_string += ' AND timestamp <= ' + str(
            format_date_time(end_time)
        ) + ' AND timestamp > ' + str(
            format_date_time(start_time)
        ) + ' AND "x-edge-response-result-type" <> \'LimitExceeded\' AND "x-edge-response-result-type" <> \'CapacityExceeded\' AND "x-edge-response-result-type" <> \'Error\' AND "x-edge-response-result-type" <> \'Redirect\' group by "cs-host";'
    else:
        raise Exception('[schedule_athena_query] Invalid metric ' + metric)
    return query_string


def gen_detailed_by_interval(metric, start_time, end_time,
                             athena_client, db_name, table_name, query_output):
    '''Generate detailed data according to start time, end time and interval'''
    interval_list = []
    start_datetime = datetime.strptime(start_time, "%Y-%m-%d %H:%M:%S")
    end_datetime = datetime.strptime(end_time, "%Y-%m-%d %H:%M:%S")
    temp_datetime = start_datetime
    gen_data = {}
    detailed_data = []

    while True:
        log.info("[gen_detailed_by_interval] Setup interval list")
        interval_item = {}
        interval_item['start'] = temp_datetime.strftime("%Y-%m-%d %H:%M:%S")
        temp_datetime += timedelta(minutes=5)
        if not temp_datetime < end_datetime:
            interval_item['end'] = end_datetime.strftime("%Y-%m-%d %H:%M:%S")
            athena_query_result = schedule_athena_query(
                metric, interval_item['start'], interval_item['end'],
                athena_client, db_name, table_name, query_output)
            interval_item['QueryId'] = athena_query_result['QueryExecutionId']
            interval_list.append(interval_item)
            break
        interval_item['end'] = temp_datetime.strftime("%Y-%m-%d %H:%M:%S")
        athena_query_result_5m = schedule_athena_query(
            metric, interval_item['start'], interval_item['end'],
            athena_client, db_name, table_name, query_output)
        interval_item['QueryId'] = athena_query_result_5m['QueryExecutionId']
        interval_list.append(interval_item)

    for item in interval_list:
        detailed_data_item = {}
        log.info("[gen_detailed_by_interval] Start to get query result")
        log.info(item)

        detailed_data_item['Time'] = str(int(format_date_time(item['end'])))
        detailed_data_item['QueryId'] = item['QueryId']
        detailed_data.append(detailed_data_item)

    gen_data['Detail'] = detailed_data

    log.info("[gen_detailed_by_interval] Generated data: ")
    log.info(json.dumps(gen_data))

    return gen_data


def format_date_time(date_string):
    '''Format a date string (eg. 2021-09-07 12:00:00) to timestamp'''
    formatted_date = datetime.strptime(date_string, "%Y-%m-%d %H:%M:%S")
    formatted_timestamp = datetime.timestamp(formatted_date)
    log.info("[format_date_time] " + str(formatted_timestamp))
    return formatted_timestamp
