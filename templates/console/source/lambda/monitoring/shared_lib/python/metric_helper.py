import json
import logging
from datetime import datetime
import time
from datetime import timedelta
import boto3
import os

cf_client = boto3.client("cloudfront")
log = logging.getLogger()
log.setLevel("INFO")

SLEEP_TIME = 1
RETRY_COUNT = 60


def insert_value_with_list(domain_country_dict, domain, country, item_row):
    # Add country into domain as JSON object and add status_code_row into country as JSON array
    if domain in domain_country_dict.keys():
        if country in domain_country_dict[domain].keys():
            domain_country_dict[domain][country].append(item_row)
        else:
            item_query_value = []
            item_query_value.append(item_row)
            domain_country_dict[domain][country] = item_query_value
    else:
        item_query_value = {}
        item_query_value[country] = [item_row]
        domain_country_dict[domain] = item_query_value
    
    return domain_country_dict


def insert_value(domain_country_dict, domain, country, item_query_value):
    if domain in domain_country_dict.keys():
        if country not in domain_country_dict[domain].keys():
            domain_country_dict[domain][country] = item_query_value
    else:
        domain_country_dict[domain] = {country: item_query_value}
    
    return domain_country_dict


def collect_metric_data(metric, start_time, end_time, athena_client, DB_NAME, GLUE_TABLE_NAME, ATHENA_QUERY_OUTPUT, M_INTERVAL, table, is_realtime, latency_limit=1, use_start='false'):
    try:
        gen_data = {}
        gen_data = gen_detailed_by_interval(metric, start_time, end_time,
                                            athena_client, DB_NAME,
                                            GLUE_TABLE_NAME, ATHENA_QUERY_OUTPUT, M_INTERVAL, is_realtime, latency_limit, use_start)
        
        for query_item in gen_data['Detail']:
            item_query_result = get_athena_query_result(
                athena_client, query_item['QueryId'])
            
            domain_country_dict = {}
            result_rows = item_query_result["ResultSet"]["Rows"]
            if metric == 'bandwidth' or metric == 'bandwidthOrigin' or metric == 'downstreamTraffic':
                for i in range(1, len(result_rows)):
                    if item_query_result['ResultSet']['Rows'][i]['Data'][0].get('VarCharValue') != None:
                        item_query_value = result_rows[i]['Data'][0]['VarCharValue']
                        domain = result_rows[i]['Data'][1]['VarCharValue']
                        country = result_rows[i]['Data'][2]['VarCharValue']
                        domain_country_dict = insert_value(domain_country_dict, domain, country, item_query_value)
            elif metric == 'request' or metric == 'requestOrigin':
                for i in range(1, len(result_rows)):
                    if item_query_result['ResultSet']['Rows'][i]['Data'][0].get('VarCharValue') != None:
                        request_row = {}
                        request_row["Count"] = result_rows[i]['Data'][0]['VarCharValue']
                        request_row["Latency"] = result_rows[i]['Data'][1]['VarCharValue']
                        domain = result_rows[i]['Data'][2]['VarCharValue']
                        country = result_rows[i]['Data'][3]['VarCharValue']
                        domain_country_dict = insert_value_with_list(domain_country_dict, domain, country, request_row)
            elif metric == 'edgeType':
                for i in range(1, len(result_rows)):
                    if result_rows[i]['Data'][0].get('VarCharValue') != None:
                        edge_type_row = {}
                        # Edge type row example: {"Count": "11", "Latency": "0.010", "EdgeType": "Hit"}
                        edge_type_row["EdgeType"] = result_rows[i]["Data"][0]["VarCharValue"]
                        edge_type_row["Count"] = result_rows[i]["Data"][1]["VarCharValue"]
                        edge_type_row["Latency"] = result_rows[i]["Data"][2]["VarCharValue"]
                        domain = result_rows[i]["Data"][3]["VarCharValue"]
                        country = result_rows[i]["Data"][4]["VarCharValue"]
                        domain_country_dict = insert_value_with_list(domain_country_dict, domain, country, edge_type_row)
            elif metric == 'statusCode' or metric == 'statusCodeOrigin':
                for i in range(1, len(result_rows)):
                    if result_rows[i]["Data"][0].get("VarCharValue") != None:
                        status_code_row = {}
                        # Status code row example: {"Count": "11", "Latency": "0.010", "StatusCode": "200"}
                        status_code_row["StatusCode"] = result_rows[i]["Data"][0]["VarCharValue"]
                        status_code_row["Count"] = result_rows[i]["Data"][1]["VarCharValue"]
                        status_code_row["Latency"] = result_rows[i]["Data"][2]["VarCharValue"]
                        domain = result_rows[i]["Data"][3]["VarCharValue"]
                        country = result_rows[i]["Data"][4]["VarCharValue"]
                        domain_country_dict = insert_value_with_list(domain_country_dict, domain, country, status_code_row)
            elif metric == 'latencyRatio':
                for i in range(1, len(result_rows)):
                    if result_rows[i]['Data'][0].get('VarCharValue') != None:
                        lr_row = {}
                        # {
                        #     "metricId": "latencyRatio-d12345.cloudfront.net",
                        #     "timestamp": 1670578440,
                        #     "metricData": {
                        #         "US": [{
                        #             "Count": "21",
                        #             "Latency": "5.00" --- 5% requests are larger than 1s latency
                        #         }],
                        #         "KR": [{
                        #             "Count": "11",
                        #             "Latency": "2.25"
                        #         }]
                        #     }
                        # }
                        lr_row["Latency"] = result_rows[i]["Data"][0]["VarCharValue"]
                        lr_row["Count"] = result_rows[i]["Data"][1]["VarCharValue"]
                        domain = result_rows[i]["Data"][2]["VarCharValue"]
                        country = result_rows[i]["Data"][3]["VarCharValue"]
                        domain_country_dict = insert_value_with_list(domain_country_dict, domain, country, lr_row)
            elif metric == "chr" or metric == "chrBandWidth":
                for i in range(1, len(result_rows)):
                    if result_rows[i]['Data'][0].get('VarCharValue') != None:
                        chr_row = {}
                        chr_row["Metric"] = result_rows[i]["Data"][0]["VarCharValue"]
                        if float(chr_row["Metric"]) > 100:
                            chr_row["Metric"] = '100.00'
                        chr_row["Count"] = result_rows[i]["Data"][1]["VarCharValue"]
                        domain = result_rows[i]["Data"][2]["VarCharValue"]
                        country = result_rows[i]["Data"][3]["VarCharValue"]
                        domain_country_dict = insert_value_with_list(domain_country_dict, domain, country, chr_row)
            #TODO: top url request and top url bandwidth
            if len(domain_country_dict) != 0:
                log.info(metric)
                log.info(domain_country_dict)
                for domain in domain_country_dict.keys():
                    table_item = {
                        'metricId': metric + '-' + domain,
                        'timestamp': int(query_item['Time']),
                        'metricData': domain_country_dict[domain],
                    }
                    ddb_response = table.put_item(Item=table_item)
                    log.info(json.dumps(table_item))
                    log.info(str(ddb_response))
    except Exception as error:
        log.error(str(error))


def get_domain_list():
    domain_list_env = os.getenv("DOMAIN_LIST")
    domain_list = []
    if domain_list_env.upper() == "ALL":
        list_distributions_response = cf_client.list_distributions(MaxItems="200")
        list_distributions = list_distributions_response["DistributionList"]

        while list_distributions["IsTruncated"] is True:
            if list_distributions["Quantity"] != 0:
                for distribution in list_distributions["Items"]:
                    dist_domain_name = distribution["DomainName"]
                    dist_aliases = distribution["Aliases"]
                    if dist_aliases["Quantity"] == 0:
                        domain_list.append(dist_domain_name)
                    else:
                        for alias in dist_aliases["Items"]:
                            domain_list.append(alias)
            next_marker = list_distributions["NextMarker"]
            list_distributions_response = cf_client.list_distributions(
                Marker=next_marker, MaxItems="200"
            )
            list_distributions = list_distributions_response["DistributionList"]

        if list_distributions["Quantity"] != 0:
            for distribution in list_distributions["Items"]:
                dist_domain_name = distribution["DomainName"]
                dist_aliases = distribution["Aliases"]
                if dist_aliases["Quantity"] == 0:
                    domain_list.append(dist_domain_name)
                else:
                    for alias in dist_aliases["Items"]:
                        domain_list.append(alias)
    else:
        domain_list = os.getenv("DOMAIN_LIST").split(",")

    return domain_list


def get_athena_query_result(athena_client, query_execution_id):
    """Get Athena query by id"""
    for i in range(1, 1 + RETRY_COUNT):
        # Get query execution
        query_status = athena_client.get_query_execution(
            QueryExecutionId=query_execution_id
        )
        query_execution_status = query_status["QueryExecution"]["Status"]["State"]

        if query_execution_status == "SUCCEEDED":
            log.info(
                "[get_athena_query_result] STATUS: "
                + query_execution_status
                + ", retry: "
                + str(i)
            )
            break

        if query_execution_status == "FAILED":
            if 'DIVISION_BY_ZERO' in query_status['QueryExecution']['Status'][
                    'StateChangeReason']:
                # DIVISION_BY_ZERO is caused by the denominator is zero, set CHR to 0
                log.info("[get_athena_query_result] REASON: DIVISION_BY_ZERO, STATUS: " +
                         query_execution_status + ", retry: " + str(i))
                failed_result = {
                    "ResultSet": {
                        "Rows": [{
                            "Data": [{
                                "VarCharValue": "CHR"
                            }]
                        }, {
                            "Data": [{
                                "VarCharValue": "0"
                            }]
                        }]
                    }
                }
                return failed_result
            else:
                raise Exception("[get_athena_query_result] STATUS:" +
                                query_execution_status + ", retry: " + str(i))
        else:
            log.info(
                "[get_athena_query_result] STATUS:"
                + query_execution_status
                + ", retry: "
                + str(i)
            )
            time.sleep(SLEEP_TIME)
    else:
        athena_client.stop_query_execution(QueryExecutionId=query_execution_id)
        raise Exception(
            "[get_athena_query_result] TIME OUT with retry " + str(RETRY_COUNT)
        )

    # Get query results
    result = athena_client.get_query_results(QueryExecutionId=query_execution_id)
    log.info("[get_athena_query_result] Get query result")
    log.info(str(result))

    return result


def assemble_query(start_time, end_time, query_string, is_realtime):
    """Add year/month/day/hour/minute into sql query string for Athena partition"""
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

    if start_year == end_year:
        query_string += "year = " + str(start_year)
        if start_month == end_month:
            query_string += " AND month = " + str(start_month)
            if start_day == end_day:
                query_string += " AND day = " + str(start_day)
                if is_realtime:
                    if start_hour == end_hour:
                        query_string += " AND hour = " + str(start_hour)
                        if start_min == end_min:
                            query_string += " AND minute = " + str(start_min)
                        else:
                            query_string += (
                                " AND minute BETWEEN "
                                + str(start_min)
                                + " AND "
                                + str(end_min)
                            )
                else:
                    if (start_hour == end_hour):
                        query_string += ' AND hour = ' + str(start_hour)
                    else:
                        query_string += ' AND hour BETWEEN ' + str(start_hour) + ' AND ' + str(end_hour)

    return query_string


def schedule_athena_query(
    metric,
    start_time,
    end_time,
    athena_client,
    db_name,
    table_name,
    query_output,
    m_interval,
    is_realtime,
    latency_limit
):
    log.info("[schedule_athena_query] Start")

    query_string = construct_query_string(
        db_name, start_time, end_time, metric, table_name, m_interval, is_realtime, latency_limit
    )

    log.info("[schedule_athena_query] Query string: " + query_string)

    response = athena_client.start_query_execution(
        QueryString=query_string,
        QueryExecutionContext={"Database": db_name},
        ResultConfiguration={
            "OutputLocation": query_output,
            "EncryptionConfiguration": {"EncryptionOption": "SSE_S3"},
        },
        WorkGroup="primary",
    )

    log.info("[schedule_athena_query] End")
    return response


def construct_query_string(
    db_name, start_time, end_time, metric, table_name, m_interval, is_realtime, latency_limit
):
    # Dynamically build query string using partition
    if metric == "request" or metric == "requestLatency":
        query_string = (
            'SELECT count(timestamp), cast(avg("time-taken")*1000 as decimal(38,3)), "cs-host", "c-country" FROM "'
            + db_name
            + '"."'
            + table_name
            + '" WHERE '
        )
        query_string = assemble_query(start_time, end_time, query_string, is_realtime)
        query_string += (
            " AND timestamp <= "
            + str(format_date_time(end_time))
            + " AND timestamp > "
            + str(format_date_time(start_time))
            + ' group by "cs-host", "c-country";'
        )
    elif metric == "requestOrigin" or metric == "requestOriginLatency":
        query_string = (
            'SELECT count(timestamp), cast(avg("time-taken")*1000 as decimal(38,3)), "cs-host", "c-country" FROM "'
            + db_name
            + '"."'
            + table_name
            + '" WHERE '
        )
        query_string = assemble_query(start_time, end_time, query_string, is_realtime)
        query_string += (
            " AND timestamp <= "
            + str(format_date_time(end_time))
            + " AND timestamp > "
            + str(format_date_time(start_time))
            + ' AND ("x-edge-detailed-result-type" = \'Miss\' OR ("x-edge-detailed-result-type" like \'%Origin%\' AND "x-edge-detailed-result-type" <> \'OriginShieldHit\')) group by "cs-host", "c-country";'
        )
    elif metric == "statusCode" or metric == "statusCodeLatency":
        query_string = (
            'SELECT "sc-status", count(timestamp), cast(avg("time-taken")*1000 as decimal(38,3)), "cs-host", "c-country" FROM "'
            + db_name
            + '"."'
            + table_name
            + '" WHERE '
        )
        query_string = assemble_query(start_time, end_time, query_string, is_realtime)
        query_string += (
            " AND timestamp <= "
            + str(format_date_time(end_time))
            + " AND timestamp > "
            + str(format_date_time(start_time))
            + ' GROUP BY "sc-status", "cs-host", "c-country";'
        )
    elif metric == "statusCodeOrigin" or metric == "statusCodeOriginLatency":
        query_string = (
            'SELECT "sc-status", count(timestamp), cast(avg("time-taken")*1000 as decimal(38,3)), "cs-host", "c-country" FROM "'
            + db_name
            + '"."'
            + table_name
            + '" WHERE '
        )
        query_string = assemble_query(start_time, end_time, query_string, is_realtime)
        query_string += (
            " AND timestamp <= "
            + str(format_date_time(end_time))
            + " AND timestamp > "
            + str(format_date_time(start_time))
            + ' AND ("x-edge-detailed-result-type" = \'Miss\' OR ("x-edge-detailed-result-type" like \'%Origin%\' AND "x-edge-detailed-result-type" <> \'OriginShieldHit\')) group by "sc-status", "cs-host", "c-country";'
        )
    elif metric == "downstreamTraffic":
        query_string = (
            'SELECT sum("sc-bytes"), "cs-host", "c-country" FROM "'
            + db_name
            + '"."'
            + table_name
            + '" WHERE '
        )
        query_string = assemble_query(start_time, end_time, query_string, is_realtime)
        query_string += (
            " AND timestamp <= "
            + str(format_date_time(end_time))
            + " AND timestamp > "
            + str(format_date_time(start_time))
            + ' group by "cs-host", "c-country";'
        )
    elif metric == "bandwidth":
        query_string = (
            f'SELECT sum("sc-bytes")/(60*{m_interval})*8, "cs-host", "c-country" FROM "'
            + db_name
            + '"."'
            + table_name
            + '" WHERE '
        )
        query_string = assemble_query(start_time, end_time, query_string, is_realtime)
        query_string += (
            " AND timestamp <= "
            + str(format_date_time(end_time))
            + " AND timestamp > "
            + str(format_date_time(start_time))
            + ' group by "cs-host", "c-country";'
        )
    elif metric == "bandwidthOrigin":
        query_string = (
            f'SELECT sum("sc-bytes")/(60*{m_interval})*8, "cs-host", "c-country" FROM "'
            + db_name
            + '"."'
            + table_name
            + '" WHERE '
        )
        query_string = assemble_query(start_time, end_time, query_string, is_realtime)
        query_string += (
            " AND timestamp <= "
            + str(format_date_time(end_time))
            + " AND timestamp > "
            + str(format_date_time(start_time))
            + ' AND ("x-edge-detailed-result-type" = \'Miss\' OR ("x-edge-detailed-result-type" like \'%Origin%\' AND "x-edge-detailed-result-type" <> \'OriginShieldHit\')) group by "cs-host", "c-country";'
        )
    elif metric == "chr":
        query_string = (
            'SELECT cast((sum(case when "x-edge-response-result-type" like \'%Hit\' then 1 else 0 end) * 100.0 / count(1)) as decimal(38,2)) as ratio, count(timestamp), "cs-host", "c-country" FROM "'
            + db_name
            + '"."'
            + table_name
            + '" WHERE '
        )
        query_string = assemble_query(start_time, end_time, query_string, is_realtime)
        query_string += (
            " AND timestamp <= "
            + str(format_date_time(end_time))
            + " AND timestamp > "
            + str(format_date_time(start_time))
            + ' AND "x-edge-response-result-type" <> \'LimitExceeded\' AND "x-edge-response-result-type" <> \'CapacityExceeded\' group by "cs-host", "c-country";'
        )
    elif metric == "chrBandWidth":
        query_string = (
            'SELECT cast((sum(case when "x-edge-response-result-type" like \'%Hit\' then "sc-bytes" else 0 end)*100.0/(60*5)*8) / (sum("sc-bytes")/(60*5)*8 ) as decimal(38,2)) as ratio, count(timestamp), "cs-host", "c-country" FROM "'
            + db_name
            + '"."'
            + table_name
            + '" WHERE '
        )
        query_string = assemble_query(start_time, end_time, query_string, is_realtime)
        query_string += (
            " AND timestamp <= "
            + str(format_date_time(end_time))
            + " AND timestamp > "
            + str(format_date_time(start_time))
            + ' AND "x-edge-response-result-type" <> \'LimitExceeded\' AND "x-edge-response-result-type" <> \'CapacityExceeded\' group by "cs-host", "c-country";'
        )
    elif metric == 'topNUrlRequests':
        query_string = f'SELECT b.* from (SELECT "cs-host", "cs-uri-stem", cnt, row_number() ' \
                       f'over (order by cnt desc) rank ' \
                       f'from (select "cs-host", "cs-uri-stem", count(1) as cnt from ' \
                       f'"{db_name}"."{table_name}" where '
        query_string = assemble_query(start_time, end_time, query_string, is_realtime)
        query_string = query_string + ' AND timestamp < ' + str(
            format_date_time(end_time) + 1) + ' AND timestamp >= ' + str(
            format_date_time(start_time)
        ) + ' group by "cs-host", "cs-uri-stem") a) b where b.rank<=10 order by "cs-host", "cnt" desc'
    elif metric == 'topNUrlSize':
        query_string = f'SELECT b.* from (SELECT "cs-host", "cs-uri-stem", sc_size, row_number() ' \
                       f'over (order by sc_size desc) rank ' \
                       f'from (select "cs-host", "cs-uri-stem", sum("sc-bytes") as sc_size from ' \
                       f'"{db_name}"."{table_name}" where '
        query_string = assemble_query(start_time, end_time, query_string, is_realtime)
        query_string = query_string + ' AND timestamp < ' + str(
            format_date_time(end_time) + 1) + ' AND timestamp >= ' + str(
            format_date_time(start_time)
        ) + ' group by "cs-host", "cs-uri-stem") a) b where b.rank<=10 order by "cs-host", "sc_size" desc'
    elif metric == "latencyRatio":
        query_string = (
            f'SELECT cast((sum(case when "time-taken" >= {latency_limit} then 1 else 0 end) * 100.0 / count(*)) '
            f'as decimal(38,2)) as ratio, count(timestamp), "cs-host", "c-country" FROM "{db_name}"."{table_name}" WHERE '
        )
        query_string = assemble_query(start_time, end_time, query_string, is_realtime)
        query_string += (
            " AND timestamp <= "
            + str(format_date_time(end_time))
            + " AND timestamp > "
            + str(format_date_time(start_time))
            + ' group by "cs-host", "c-country";'
        )
    elif metric == "edgeType" or metric == "edgeTypeLatency":
        # edgeTypeLatency: average time-taken for requests group by x-edge-response-result-type
        query_string = (
            'SELECT "x-edge-response-result-type", count(timestamp), cast(avg("time-taken")*1000 as decimal(38,3)), "cs-host", "c-country" FROM "'
            + db_name
            + '"."'
            + table_name
            + '" WHERE '
        )
        query_string = assemble_query(start_time, end_time, query_string, is_realtime)
        query_string += (
            " AND timestamp <= "
            + str(format_date_time(end_time))
            + " AND timestamp > "
            + str(format_date_time(start_time))
            + ' group by "x-edge-response-result-type", "cs-host", "c-country";'
        )
    else:
        raise Exception("[schedule_athena_query] Invalid metric " + metric)

    log.info(query_string)

    return query_string


def gen_detailed_by_interval(
    metric,
    start_time,
    end_time,
    athena_client,
    db_name,
    table_name,
    query_output,
    m_interval,
    is_realtime,
    latency_limit=1,
    use_start="false"
):
    """Generate detailed data according to start time, end time and interval"""
    interval_list = []
    start_datetime = datetime.strptime(start_time, "%Y-%m-%d %H:%M:%S")
    end_datetime = datetime.strptime(end_time, "%Y-%m-%d %H:%M:%S")
    temp_datetime = start_datetime
    gen_data = {}
    detailed_data = []

    while True:
        log.info("[gen_detailed_by_interval] Setup interval list")
        interval_item = {}
        interval_item["start"] = temp_datetime.strftime("%Y-%m-%d %H:%M:%S")
        temp_datetime += timedelta(minutes=m_interval)
        if not temp_datetime < end_datetime:
            interval_item["end"] = end_datetime.strftime("%Y-%m-%d %H:%M:%S")
            athena_query_result = schedule_athena_query(
                metric,
                interval_item["start"],
                interval_item["end"],
                athena_client,
                db_name,
                table_name,
                query_output,
                m_interval,
                is_realtime,
                latency_limit
            )
            interval_item["QueryId"] = athena_query_result["QueryExecutionId"]
            interval_list.append(interval_item)
            break
        interval_item["end"] = temp_datetime.strftime("%Y-%m-%d %H:%M:%S")
        athena_query_result_5m = schedule_athena_query(
            metric,
            interval_item["start"],
            interval_item["end"],
            athena_client,
            db_name,
            table_name,
            query_output,
            m_interval,
            is_realtime,
            latency_limit
        )
        interval_item["QueryId"] = athena_query_result_5m["QueryExecutionId"]
        interval_list.append(interval_item)

    for item in interval_list:
        detailed_data_item = {}
        log.info("[gen_detailed_by_interval] Start to get query result")
        log.info(item)
        if use_start.lower() == "true":
            detailed_data_item["Time"] = str(int(format_date_time(item["start"])))
        else:
            detailed_data_item["Time"] = str(int(format_date_time(item["end"])))
        detailed_data_item["QueryId"] = item["QueryId"]
        detailed_data.append(detailed_data_item)

    gen_data["Detail"] = detailed_data

    log.info("[gen_detailed_by_interval] Generated data: ")
    log.info(json.dumps(gen_data))

    return gen_data


def format_date_time(date_string):
    """Format a date string (eg. 2021-09-07 12:00:00) to timestamp"""
    formatted_date = datetime.strptime(date_string, "%Y-%m-%d %H:%M:%S")
    formatted_timestamp = datetime.timestamp(formatted_date)
    log.info("[format_date_time] " + str(formatted_timestamp))
    return formatted_timestamp
