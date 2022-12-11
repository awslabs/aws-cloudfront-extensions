import boto3
from moto import mock_athena
import metric_helper
from metric_helper import gen_detailed_by_interval
from metric_helper import assemble_query
from metric_helper import schedule_athena_query
from metric_helper import construct_query_string
from metric_helper import format_date_time
from metric_helper import get_domain_list
from moto import mock_cloudfront
from datetime import datetime, timedelta


def test_assemble_query():
    date_time_str_start = '2022-08-21 08:15:27'
    date_time_str_end = '2022-08-21 08:15:27'

    result = assemble_query(date_time_str_start,date_time_str_end,"<<<QUERY STRING>>>")
    assert result == "<<<QUERY STRING>>>year = 2022 AND month = 8 AND day = 21 AND hour = 8"

def test_construct_query_string():
    date_time_str_start = '2022-01-21 08:15:27'
    date_time_str_end = '2022-01-21 08:15:27'
    db_name = "TESTDB"
    domain_name = "TESTDOMAIN"
    table_name = "TESTTABLE"
    m_interval = 0
    latency_limit = 0

    metric = 'request'
    query_string = construct_query_string(db_name, date_time_str_start, date_time_str_end, metric,table_name, m_interval, latency_limit)
    assert query_string == 'SELECT count(timestamp), \"cs-host\" FROM \"TESTDB\".\"TESTTABLE\" WHERE year = 2022 AND month = 1 AND day = 21 AND hour = 8 AND timestamp <= 1642724127.0 AND timestamp > 1642724127.0 group by \"cs-host\";'

    metric = 'requestOrigin'
    query_string = construct_query_string(db_name, date_time_str_start, date_time_str_end, metric, table_name, m_interval, latency_limit)
    assert query_string == 'SELECT count(timestamp), \"cs-host\" FROM \"TESTDB\".\"TESTTABLE\" WHERE year = 2022 AND month = 1 AND day = 21 AND hour = 8 AND timestamp <= 1642724127.0 AND timestamp > 1642724127.0 AND (\"x-edge-detailed-result-type\" = \'Miss\' OR (\"x-edge-detailed-result-type\" like \'%Origin%\' AND \"x-edge-detailed-result-type\" <> \'OriginShieldHit\')) group by \"cs-host\";'

    metric = 'statusCode'
    query_string = construct_query_string(db_name, date_time_str_start, date_time_str_end, metric, table_name, m_interval, latency_limit)
    assert query_string == 'SELECT \"sc-status\", count(timestamp), \"cs-host\" FROM \"TESTDB\".\"TESTTABLE\" WHERE year = 2022 AND month = 1 AND day = 21 AND hour = 8 AND timestamp <= 1642724127.0 AND timestamp > 1642724127.0 GROUP BY \"sc-status\", \"cs-host\";'

    metric = 'statusCodeOrigin'
    query_string = construct_query_string(db_name, date_time_str_start, date_time_str_end, metric, table_name, m_interval, latency_limit)
    assert query_string == 'SELECT \"sc-status\", count(timestamp), \"cs-host\" FROM \"TESTDB\".\"TESTTABLE\" WHERE year = 2022 AND month = 1 AND day = 21 AND hour = 8 AND timestamp <= 1642724127.0 AND timestamp > 1642724127.0 AND (\"x-edge-detailed-result-type\" = \'Miss\' OR (\"x-edge-detailed-result-type\" like \'%Origin%\' AND \"x-edge-detailed-result-type\" <> \'OriginShieldHit\')) group by \"sc-status\", \"cs-host\";'

    metric = 'bandwidth'
    query_string = construct_query_string(db_name, date_time_str_start, date_time_str_end, metric, table_name, m_interval, latency_limit)
    assert query_string == 'SELECT sum(\"sc-bytes\")/(60*0)*8, \"cs-host\" FROM \"TESTDB\".\"TESTTABLE\" WHERE year = 2022 AND month = 1 AND day = 21 AND hour = 8 AND timestamp <= 1642724127.0 AND timestamp > 1642724127.0 group by \"cs-host\";'

    metric = 'bandwidthOrigin'
    query_string = construct_query_string(db_name, date_time_str_start, date_time_str_end, metric, table_name, m_interval, latency_limit)
    assert query_string == 'SELECT sum(\"sc-bytes\")/(60*0)*8, \"cs-host\" FROM \"TESTDB\".\"TESTTABLE\" WHERE year = 2022 AND month = 1 AND day = 21 AND hour = 8 AND timestamp <= 1642724127.0 AND timestamp > 1642724127.0 AND (\"x-edge-detailed-result-type\" = \'Miss\' OR (\"x-edge-detailed-result-type\" like \'%Origin%\' AND \"x-edge-detailed-result-type\" <> \'OriginShieldHit\')) group by \"cs-host\";'

    metric = 'chr'
    query_string = construct_query_string(db_name, date_time_str_start, date_time_str_end, metric, table_name, m_interval, latency_limit)
    assert query_string == 'SELECT cast((sum(case when \"x-edge-response-result-type\" like \'%Hit\' then 1 else 0 end) * 100.0 / count(1)) as decimal(38,2)) as ratio, \"cs-host\" FROM \"TESTDB\".\"TESTTABLE\" WHERE year = 2022 AND month = 1 AND day = 21 AND hour = 8 AND timestamp <= 1642724127.0 AND timestamp > 1642724127.0 AND \"x-edge-response-result-type\" <> \'LimitExceeded\' AND \"x-edge-response-result-type\" <> \'CapacityExceeded\' group by \"cs-host\";'

    metric = 'chrBandWidth'
    query_string = construct_query_string(db_name, date_time_str_start, date_time_str_end, metric, table_name, m_interval, latency_limit)
    assert query_string == 'SELECT cast((sum(case when \"x-edge-response-result-type\" like \'%Hit\' then \"sc-bytes\" else 0 end)*100.0/(60*5)*8) / (sum(\"sc-bytes\")/(60*5)*8 ) as decimal(38,2)) as ratio, \"cs-host\" FROM \"TESTDB\".\"TESTTABLE\" WHERE year = 2022 AND month = 1 AND day = 21 AND hour = 8 AND timestamp <= 1642724127.0 AND timestamp > 1642724127.0 AND \"x-edge-response-result-type\" <> \'LimitExceeded\' AND \"x-edge-response-result-type\" <> \'CapacityExceeded\' group by \"cs-host\";'

    metric = 'topNUrlRequests'
    query_string = construct_query_string(db_name, date_time_str_start, date_time_str_end, metric, table_name, m_interval, latency_limit)
    assert query_string == 'SELECT b.* from (SELECT \"cs-host\", \"cs-uri-stem\", cnt, row_number() over (partition by \"cs-host\", \"cs-uri-stem\" order by cnt desc) rank from (select \"cs-host\", \"cs-uri-stem\", count(1) as cnt from \"TESTDB\".\"TESTTABLE\" where year = 2022 AND month = 1 AND day = 21 AND hour = 8 AND timestamp < 1642724128.0 AND timestamp >= 1642724127.0 group by \"cs-host\", \"cs-uri-stem\") a) b where b.rank<=100 order by \"cs-host\", \"cnt\" desc'
    
    metric = 'topNUrlSize'
    query_string = construct_query_string(db_name, date_time_str_start, date_time_str_end, metric, table_name, m_interval, latency_limit)
    assert query_string == 'SELECT b.* from (SELECT \"cs-host\", \"cs-uri-stem\", sc_size, row_number() over (partition by \"cs-host\", \"cs-uri-stem\" order by sc_size desc) rank from (select \"cs-host\", \"cs-uri-stem\", sum(\"sc-bytes\") as sc_size from \"TESTDB\".\"TESTTABLE\" where year = 2022 AND month = 1 AND day = 21 AND hour = 8 AND timestamp < 1642724128.0 AND timestamp >= 1642724127.0 group by \"cs-host\", \"cs-uri-stem\") a) b where b.rank<=100 order by \"cs-host\", \"sc_size\" desc'
    
    metric = 'latencyratio'
    query_string = construct_query_string(db_name, date_time_str_start, date_time_str_end, metric, table_name, m_interval, latency_limit)
    assert query_string == 'SELECT cast((sum(case when \"time-taken\" >= 0 then 1 else 0 end) * 100.0 / count(*)) as decimal(38,2)) as ratio, \"cs-host\" FROM \"TESTDB\".\"TESTTABLE\" WHERE year = 2022 AND month = 1 AND day = 21 AND hour = 8 AND timestamp <= 1642724127.0 AND timestamp > 1642724127.0 group by \"cs-host\";'

@mock_athena
def test_schedule_athena_query():
    date_time_str_start = '2022-01-21 08:15:27'
    date_time_str_end = '2022-01-21 08:15:27'
    athena_client = boto3.client('athena', region_name='us-east-1')
    metric = 'request'
    db_name = "TESTDB"
    domain_name = "TESTDOMAIN"
    table_name = "TESTTABLE"
    query_output = "/test/"
    m_interval = 0
    latency_limit = 0
    query_string = construct_query_string(db_name, date_time_str_start, date_time_str_end, metric, table_name, m_interval, latency_limit)
    athena_client.create_work_group(
        Name='primary',
        Description="my group",
        Configuration={
            "ResultConfiguration": {
                "OutputLocation": query_output,
                "EncryptionConfiguration": {
                    "EncryptionOption": "SSE_S3",
                },
            }
        },
        Tags=[],
    )

    exex_id = athena_client.start_query_execution(
        QueryString=query_string,
        QueryExecutionContext={'Database': db_name},
        ResultConfiguration={
            'OutputLocation': query_output,
            'EncryptionConfiguration': {
                'EncryptionOption': 'SSE_S3'
            }
        },
        WorkGroup="primary"
    )["QueryExecutionId"]
    # athena_backends["us-east-1"].executions.get(exex_id).status = "QUEUED"
    finalResult = schedule_athena_query(metric,date_time_str_start,date_time_str_end,athena_client,db_name, table_name,query_output, m_interval, latency_limit)
    assert finalResult["ResponseMetadata"]['HTTPStatusCode'] == 200

@mock_athena
def test_gen_detailed_by_interval():
    date_time_str_start = '2022-08-21 08:15:27'
    date_time_str_end = '2022-08-21 08:15:27'
    athena_client = boto3.client('athena', region_name='us-east-1')
    metric = 'request'
    db_name = "TESTDB"
    domain_name = "TESTDOMAIN"
    table_name = "TESTTABLE"
    query_output = "/test/"

    query_string = construct_query_string(db_name, domain_name, date_time_str_start, date_time_str_end, metric, table_name)
    athena_client.create_work_group(
     Name='primary',
     Description="my group",
     Configuration={
         "ResultConfiguration": {
             "OutputLocation": query_output,
             "EncryptionConfiguration": {
                 "EncryptionOption": "SSE_S3",
             },
         }
     },
     Tags=[],
    )

    exex_id = athena_client.start_query_execution(
        QueryString=query_string,
        QueryExecutionContext={'Database': db_name},
        ResultConfiguration={
         'OutputLocation': query_output,
         'EncryptionConfiguration': {
             'EncryptionOption': 'SSE_S3'
         }
        },
        WorkGroup="primary"
    )["QueryExecutionId"]
    athena_backends["us-east-1"].executions.get(exex_id).status = "SUCCEEDED"

    finalResult = gen_detailed_by_interval(metric,date_time_str_start,date_time_str_end,domain_name,athena_client,db_name,table_name,query_output)
    assert len(finalResult["Detail"]) > 0

def test_format_date_time():
    resultTime = format_date_time('2022-01-24 09:22:44')
    assert resultTime != None

@mock_cloudfront
def test_get_domain_list(monkeypatch):
    monkeypatch.setenv('DOMAIN_LIST', 'ALL')
    cf_client = boto3.client('cloudfront')
    monkeypatch.setattr(cf_client, "list_distributions", mock_list_distributions)
    
    monkeypatch.setattr(metric_helper, "cf_client", cf_client)
    get_domain_list()
    monkeypatch.setenv('DOMAIN_LIST', '')
    get_domain_list()

@mock_athena
def test_gen_detailed_by_interval(monkeypatch):
    M_INTERVAL = 1
    event_time = '2022-08-21T08:15:27Z'
    event_datetime = datetime.strptime(
    event_time, "%Y-%m-%dT%H:%M:%SZ") - timedelta(minutes=60)
    start_datetime = event_datetime - timedelta(minutes=M_INTERVAL)

    start_time = start_datetime.strftime("%Y-%m-%d %H:%M:%S")
    end_time = event_datetime.strftime("%Y-%m-%d %H:%M:%S")

    metric = "bandwidth"
    
    athena_client = boto3.client('athena', region_name='us-east-1')
    
    DB_NAME = 'DB_NAME'
    GLUE_TABLE_NAME = 'GLUE_TABLE_NAME'
    ATHENA_QUERY_OUTPUT = 'ATHENA_QUERY_OUTPUT'
    USE_START_TIME = 'USE_START_TIME'
    monkeypatch.setattr(metric_helper, "schedule_athena_query", mock_schedule_athena_query)
    gen_detailed_by_interval(metric, start_time, end_time,
                                            athena_client, DB_NAME,
                                            GLUE_TABLE_NAME, ATHENA_QUERY_OUTPUT, M_INTERVAL, use_start=USE_START_TIME)

def mock_schedule_athena_query(*args, **kwargs):
    return {
        "QueryExecutionId": 1
    }
    
    
def mock_list_distributions(*args, **kwargs):
    if 'Marker' in kwargs:
        return {
        "DistributionList": {
            "IsTruncated": False,
            "Quantity": 1,
            "NextMarker": 2,
            "Items" : [
                {
                    "DomainName": "Mock_Domain_0",
                    "Aliases": {
                        "Quantity": 0
                    }
                },
                {
                    "DomainName": "Mock_Domain_1",
                    "Aliases": {
                        "Quantity": 1,
                        "Items": [
                            {
                                "Name": "Aliases_0",
                            },
                            {
                                "Name": "Aliases_1",
                            }
                        ]
                    }
                },
            ]
        }
    }
    else:
        return {
            "DistributionList": {
                "IsTruncated": True,
                "Quantity": 1,
                "NextMarker": 2,
                "Items" : [
                    {
                        "DomainName": "Mock_Domain_0",
                        "Aliases": {
                            "Quantity": 0
                        }
                    },
                    {
                        "DomainName": "Mock_Domain_1",
                        "Aliases": {
                            "Quantity": 1,
                            "Items": [
                                {
                                    "Name": "Aliases_0",
                                },
                                {
                                    "Name": "Aliases_1",
                                }
                            ]
                        }
                    },
                ]
            }
        }
