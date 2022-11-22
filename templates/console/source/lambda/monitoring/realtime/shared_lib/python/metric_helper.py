import json
import logging
from datetime import datetime
import time
from datetime import timedelta
import boto3
import os

cf_client = boto3.client('cloudfront')
log = logging.getLogger()
log.setLevel('INFO')

SLEEP_TIME = 1
RETRY_COUNT = 60


def get_domain_list():
    domain_list_env = os.getenv('DOMAIN_LIST')
    domain_list = []
    if domain_list_env.upper() == "ALL":
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
                          db_name, table_name, query_output, m_interval, latency_limit):
    log.info('[schedule_athena_query] Start')

    query_string = construct_query_string(
        db_name, start_time, end_time, metric, table_name, m_interval, latency_limit)

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


def construct_query_string(db_name, start_time, end_time, metric, table_name, m_interval, latency_limit):
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
        ) + ' AND ("x-edge-detailed-result-type" = \'Miss\' OR ("x-edge-detailed-result-type" like \'%Origin%\' AND "x-edge-detailed-result-type" <> \'OriginShieldHit\')) group by "cs-host";'
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
        ) + ' AND ("x-edge-detailed-result-type" = \'Miss\' OR ("x-edge-detailed-result-type" like \'%Origin%\' AND "x-edge-detailed-result-type" <> \'OriginShieldHit\')) group by "sc-status", "cs-host";'
    elif metric == 'downstreamTraffic':
        query_string = 'SELECT sum("sc-bytes"), "cs-host" FROM "' + \
            db_name + '"."' + table_name + '" WHERE '
        query_string = assemble_query(start_time, end_time, query_string)
        query_string += ' AND timestamp <= ' + str(
            format_date_time(end_time)) + ' AND timestamp > ' + str(
            format_date_time(start_time)) + ' group by "cs-host";'
    elif metric == 'bandwidth':
        query_string = f'SELECT sum("sc-bytes")/(60*{m_interval})*8, "cs-host" FROM "' + \
            db_name + '"."' + table_name + '" WHERE '
        query_string = assemble_query(start_time, end_time, query_string)
        query_string += ' AND timestamp <= ' + str(
            format_date_time(end_time)) + ' AND timestamp > ' + str(
            format_date_time(start_time)) + ' group by "cs-host";'
    elif metric == 'bandwidthOrigin':
        query_string = f'SELECT sum("sc-bytes")/(60*{m_interval})*8, "cs-host" FROM "' + \
            db_name + '"."' + table_name + '" WHERE '
        query_string = assemble_query(start_time, end_time, query_string)
        query_string += ' AND timestamp <= ' + str(
            format_date_time(end_time)) + ' AND timestamp > ' + str(
            format_date_time(start_time)
        ) + ' AND ("x-edge-detailed-result-type" = \'Miss\' OR ("x-edge-detailed-result-type" like \'%Origin%\' AND "x-edge-detailed-result-type" <> \'OriginShieldHit\')) group by "cs-host";'
    elif metric == 'chr':
        query_string = 'SELECT cast((sum(case when "x-edge-result-type" like \'%Hit\' then 1 else 0 end) * 100.0 / count(1)) as decimal(38,2)) as ratio, "cs-host" FROM "' + \
            db_name + '"."' + table_name + '" WHERE '
        query_string = assemble_query(start_time, end_time,
                                      query_string)
        query_string += ' AND timestamp <= ' + str(
            format_date_time(end_time)
        ) + ' AND timestamp > ' + str(
            format_date_time(start_time)
        ) + ' AND "x-edge-response-result-type" <> \'LimitExceeded\' AND "x-edge-response-result-type" <> \'CapacityExceeded\' group by "cs-host";'
    elif metric == 'chrBandWidth':
        query_string = 'SELECT cast((sum(case when "x-edge-result-type" like \'%Hit\' then "sc-bytes" else 0 end)*100.0/(60*5)*8) / (sum("sc-bytes")/(60*5)*8 ) as decimal(38,2)) as ratio, "cs-host" FROM "' + \
            db_name + '"."' + table_name + '" WHERE '
        query_string = assemble_query(start_time, end_time,
                                      query_string)
        query_string += ' AND timestamp <= ' + str(
            format_date_time(end_time)
        ) + ' AND timestamp > ' + str(
            format_date_time(start_time)
        ) + ' AND "x-edge-response-result-type" <> \'LimitExceeded\' AND "x-edge-response-result-type" <> \'CapacityExceeded\' group by "cs-host";'
    elif metric == 'topNUrlRequests':
        query_string = f'SELECT b.* from (SELECT "cs-host", "cs-uri-stem", cnt, row_number() ' \
                       f'over (partition by "cs-host", "cs-uri-stem" order by cnt desc) rank ' \
                       f'from (select "cs-host", "cs-uri-stem", count(1) as cnt from ' \
                       f'"{db_name}"."{table_name}" where '
        query_string = assemble_query(start_time, end_time, query_string)
        query_string = query_string + ' AND timestamp <= ' + str(
            format_date_time(end_time)) + ' AND timestamp > ' + str(
            format_date_time(start_time)
        ) + ' group by "cs-host", "cs-uri-stem") a) b where b.rank<=100 order by "cs-host", "cnt" desc'
    elif metric == 'topNUrlSize':
        query_string = f'SELECT b.* from (SELECT "cs-host", "cs-uri-stem", sc_size, row_number() ' \
                       f'over (partition by "cs-host", "cs-uri-stem" order by sc_size desc) rank ' \
                       f'from (select "cs-host", "cs-uri-stem", sum("sc-bytes") as sc_size from ' \
                       f'"{db_name}"."{table_name}" where '
        query_string = assemble_query(start_time, end_time, query_string)
        query_string = query_string + ' AND timestamp <= ' + str(
            format_date_time(end_time)) + ' AND timestamp > ' + str(
            format_date_time(start_time)
        ) + ' group by "cs-host", "cs-uri-stem") a) b where b.rank<=100 order by "cs-host", "sc_size" desc'
    elif metric == 'latencyratio':
        query_string = f'SELECT cast((sum(case when "time-taken" >= {latency_limit} then 1 else 0 end) * 100.0 / count(*)) ' \
                       f'as decimal(38,2)) as ratio, "cs-host" FROM "{db_name}"."{table_name}" WHERE '
        query_string = assemble_query(start_time, end_time, query_string)
        query_string += ' AND timestamp <= ' + str(
            format_date_time(end_time)) + ' AND timestamp > ' + str(
            format_date_time(start_time)) + ' group by "cs-host";'
    else:
        raise Exception('[schedule_athena_query] Invalid metric ' + metric)

    log.info(query_string)

    return query_string


def gen_detailed_by_interval(metric, start_time, end_time,
                             athena_client, db_name, table_name, query_output, m_interval, latency_limit=1):
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
        temp_datetime += timedelta(minutes=m_interval)
        if not temp_datetime < end_datetime:
            interval_item['end'] = end_datetime.strftime("%Y-%m-%d %H:%M:%S")
            athena_query_result = schedule_athena_query(
                metric, interval_item['start'], interval_item['end'],
                athena_client, db_name, table_name, query_output, m_interval, latency_limit)
            interval_item['QueryId'] = athena_query_result['QueryExecutionId']
            interval_list.append(interval_item)
            break
        interval_item['end'] = temp_datetime.strftime("%Y-%m-%d %H:%M:%S")
        athena_query_result_5m = schedule_athena_query(
            metric, interval_item['start'], interval_item['end'],
            athena_client, db_name, table_name, query_output, m_interval, latency_limit)
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
