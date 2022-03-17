import boto3
from moto import mock_athena
from metric_helper import gen_detailed_by_interval
from metric_helper import assemble_query
from metric_helper import schedule_athena_query
from metric_helper import construct_query_string
from metric_helper import format_date_time
from moto.athena import athena_backends

def test_assemble_query():
    date_time_str_start = '2022-01-21 08:15:27'
    date_time_str_end = '2022-01-21 08:15:27'

    result = assemble_query(date_time_str_start,date_time_str_end,"<<<QUERY STRING>>>")
    assert result == "<<<QUERY STRING>>>year = 2022 AND month = 1 AND day = 21 AND hour = 8 AND minute = 15"

def test_construct_query_string():
    date_time_str_start = '2022-01-21 08:15:27'
    date_time_str_end = '2022-01-21 08:15:27'
    db_name = "TESTDB"
    domain_name = "TESTDOMAIN"
    table_name = "TESTTABLE"

    metric = 'request'
    query_string = construct_query_string(db_name,domain_name, date_time_str_start, date_time_str_end, metric,table_name)
    assert query_string == 'SELECT count(timestamp) FROM \"TESTDB\".\"TESTTABLE\" WHERE year = 2022 AND month = 1 AND day = 21 AND hour = 8 AND minute = 15 AND \"cs-host\" = \'TESTDOMAIN\' AND timestamp <= 1642724127.0 AND timestamp > 1642724127.0;'

    metric = 'requestOrigin'
    query_string = construct_query_string(db_name,domain_name, date_time_str_start, date_time_str_end, metric, table_name)
    assert query_string == 'SELECT count(timestamp) FROM \"TESTDB\".\"TESTTABLE\" WHERE year = 2022 AND month = 1 AND day = 21 AND hour = 8 AND minute = 15 AND \"cs-host\" = \'TESTDOMAIN\' AND timestamp <= 1642724127.0 AND timestamp > 1642724127.0 AND \"x-edge-response-result-type\"=\'Miss\';'

    metric = 'statusCode'
    query_string = construct_query_string(db_name,domain_name, date_time_str_start, date_time_str_end, metric, table_name)
    assert query_string == 'SELECT \"sc-status\", count(timestamp) FROM \"TESTDB\".\"TESTTABLE\" WHERE year = 2022 AND month = 1 AND day = 21 AND hour = 8 AND minute = 15 AND \"cs-host\" = \'TESTDOMAIN\' AND timestamp <= 1642724127.0 AND timestamp > 1642724127.0 GROUP BY \"sc-status\";'

    metric = 'statusCodeOrigin'
    query_string = construct_query_string(db_name,domain_name, date_time_str_start, date_time_str_end, metric, table_name)
    assert query_string == 'SELECT \"sc-status\", count(timestamp) FROM \"TESTDB\".\"TESTTABLE\" WHERE year = 2022 AND month = 1 AND day = 21 AND hour = 8 AND minute = 15 AND \"cs-host\" = \'TESTDOMAIN\' AND timestamp <= 1642724127.0 AND timestamp > 1642724127.0 AND \"x-edge-response-result-type\"=\'Miss\' GROUP BY \"sc-status\";'

    metric = 'bandwidth'
    query_string = construct_query_string(db_name,domain_name, date_time_str_start, date_time_str_end, metric, table_name)
    assert query_string == 'SELECT sum(\"sc-bytes\") FROM \"TESTDB\".\"TESTTABLE\" WHERE year = 2022 AND month = 1 AND day = 21 AND hour = 8 AND minute = 15 AND \"cs-host\" = \'TESTDOMAIN\' AND timestamp <= 1642724127.0 AND timestamp > 1642724127.0;'

    metric = 'bandwidthOrigin'
    query_string = construct_query_string(db_name,domain_name, date_time_str_start, date_time_str_end, metric, table_name)
    assert query_string == 'SELECT sum(\"sc-bytes\") FROM \"TESTDB\".\"TESTTABLE\" WHERE year = 2022 AND month = 1 AND day = 21 AND hour = 8 AND minute = 15 AND \"cs-host\" = \'TESTDOMAIN\' AND timestamp <= 1642724127.0 AND timestamp > 1642724127.0 AND \"x-edge-response-result-type\"=\'Miss\';'

    metric = 'chr'
    query_string = construct_query_string(db_name,domain_name, date_time_str_start, date_time_str_end, metric, table_name)
    assert query_string == 'SELECT cast(A.hitCount as decimal(38,2)) * 100 / cast(B.all as decimal(38,2)) as CHR FROM (SELECT count(timestamp) as hitCount FROM \"TESTDB\".\"TESTTABLE\" WHERE year = 2022 AND month = 1 AND day = 21 AND hour = 8 AND minute = 15 AND \"cs-host\" = \'TESTDOMAIN\' AND timestamp <= 1642724127.0 AND timestamp > 1642724127.0 AND (\"x-edge-response-result-type\" = \'Hit\' OR \"x-edge-response-result-type\" = \'RefreshHit\')) A, (SELECT count(timestamp) as all FROM \"TESTDB\".\"TESTTABLE\" WHERE year = 2022 AND month = 1 AND day = 21 AND hour = 8 AND minute = 15 AND \"cs-host\" = \'TESTDOMAIN\' AND timestamp <= 1642724127.0 AND timestamp > 1642724127.0 AND \"x-edge-response-result-type\" <> \'LimitExceeded\' AND \"x-edge-response-result-type\" <> \'CapacityExceeded\' AND \"x-edge-response-result-type\" <> \'Error\' AND \"x-edge-response-result-type\" <> \'Redirect\') B;'

    metric = 'chrBandWith'
    query_string = construct_query_string(db_name,domain_name, date_time_str_start, date_time_str_end, metric, table_name)
    assert query_string == 'SELECT cast(A.hitCount as decimal(38,2)) * 100 / cast(B.all as decimal(38,2)) as CHR FROM (SELECT sum(\"cs-bytes\") as hitCount FROM \"TESTDB\".\"TESTTABLE\" WHERE year = 2022 AND month = 1 AND day = 21 AND hour = 8 AND minute = 15 AND \"cs-host\" = \'TESTDOMAIN\' AND timestamp <= 1642724127.0 AND timestamp > 1642724127.0 AND (\"x-edge-response-result-type\" = \'Hit\' OR \"x-edge-response-result-type\" = \'RefreshHit\')) A, (SELECT sum(\"cs-bytes\") as all FROM \"TESTDB\".\"TESTTABLE\" WHERE year = 2022 AND month = 1 AND day = 21 AND hour = 8 AND minute = 15 AND \"cs-host\" = \'TESTDOMAIN\' AND timestamp <= 1642724127.0 AND timestamp > 1642724127.0 AND \"x-edge-response-result-type\" <> \'LimitExceeded\' AND \"x-edge-response-result-type\" <> \'CapacityExceeded\' AND \"x-edge-response-result-type\" <> \'Error\' AND \"x-edge-response-result-type\" <> \'Redirect\') B;'

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
    athena_backends["us-east-1"].executions.get(exex_id).status = "QUEUED"

    finalResult = schedule_athena_query(metric,date_time_str_start,date_time_str_end,domain_name,athena_client,db_name,table_name,query_output)
    assert finalResult["ResponseMetadata"]['HTTPStatusCode'] == 200

@mock_athena
def test_gen_detailed_by_interval():
    date_time_str_start = '2022-01-21 08:15:27'
    date_time_str_end = '2022-01-21 08:15:27'
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
