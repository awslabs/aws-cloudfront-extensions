import boto3
from moto import mock_glue


@mock_glue
def test_lambda_handler(monkeypatch):
    DB_NAME = 'testGlueDB'
    TABLE_NAME = 'testGlueTable'
    CATALOG_ID = '01010101'
    S3_BUCKET = 'TestS3Bucket'
    REGION_NAME = 'us-east-1'
    DDB_TABLE_NAME = 'TestDDBTable'
    INTERVAL = '1'
    DOMAIN_LIST = 'ALL'
    USE_START_TIME = '2022-01-21T08:15:27Z'
    LATENCY_LIMIT = '1'

    conn = boto3.client('glue', region_name='us-east-1')
    conn.create_database(
        CatalogId=CATALOG_ID,
        DatabaseInput={
            'Name': DB_NAME,
            'Description': 'test',
            'LocationUri': 'string',
            'TargetDatabase': {
                'CatalogId': CATALOG_ID,
                'DatabaseName': DB_NAME
            }
        }
    )
    conn.create_table(
        CatalogId=CATALOG_ID,
        DatabaseName=DB_NAME,
        TableInput={
            'Name': TABLE_NAME,
            'Description': 'string',
            'StorageDescriptor': {
                "Compressed": True,
                "InputFormat": 'txt',
                "Location": S3_BUCKET,
                "OutputFormat": 'txt',
                "SerdeInfo": {
                    "SerializationLibrary": 'org.apache.hadoop.hive.serde2.columnar.ColumnarSerDe'
                },
            },
            'PartitionKeys': [
                {
                    'Name': "year",
                    'Type': "int"
                },
                {
                    'Name': "month",
                    'Type': "int"
                },
                {
                    'Name': "day",
                    'Type': "int"
                },
                {
                    'Name': "hour",
                    'Type': "int"
                },
                {
                    'Name': "minute",
                    'Type': "int"
                }
            ],
        },

    )

    event = {
        "time": '2022-01-21T08:15:27Z'
    }

    monkeypatch.setenv('GLUE_DATABASE_NAME', DB_NAME)
    monkeypatch.setenv('GLUE_TABLE_NAME', TABLE_NAME)
    monkeypatch.setenv('ACCOUNT_ID', CATALOG_ID)
    monkeypatch.setenv('S3_BUCKET', S3_BUCKET)
    monkeypatch.setenv('DDB_TABLE_NAME', DDB_TABLE_NAME)
    monkeypatch.setenv('REGION_NAME', REGION_NAME)
    monkeypatch.setenv('DOMAIN_LIST', DOMAIN_LIST)
    monkeypatch.setenv('INTERVAL', INTERVAL)
    monkeypatch.setenv('USE_START_TIME', USE_START_TIME)
    monkeypatch.setenv('LATENCY_LIMIT', LATENCY_LIMIT)

    import metric_collector_latency_ratio
    from metric_collector_latency_ratio import lambda_handler
    monkeypatch.setattr(metric_collector_latency_ratio, "gen_detailed_by_interval", mock_gen_detailed_by_interval, raising=True)
    monkeypatch.setattr(metric_collector_latency_ratio, "get_athena_query_result", mock_get_athena_query_result)

    lambda_handler(event, None)

def mock_gen_detailed_by_interval(*args, **kwargs):
    return {
        "Detail":[
            {
                "QueryId":1
            },
            {
                "QueryId":2
            }
        ]
    }
    
def mock_internal_get_domain_list():
    return 


def mock_get_athena_query_result(*args, **kwargs):
    return {
        # item_query_result['ResultSet']['Rows'][i]['Data'][0])
        "ResultSet": {
            "Rows": [
                {
                    "Data": [
                        {
                            "VarCharValue": "1"
                        },
                        {
                            "VarCharValue": "2"
                        },
                        {
                            "VarCharValue": "1"
                        },
                        {
                            "VarCharValue": "2"
                        }
                    ]
                },
                {
                    "Data": [
                        {
                            "VarCharValue": "1"
                        },
                        {
                            "VarCharValue": "2"
                        },
                        {
                            "VarCharValue": "1"
                        },
                        {
                            "VarCharValue": "2"
                        }
                    ]
                }
            ]
        }
    }