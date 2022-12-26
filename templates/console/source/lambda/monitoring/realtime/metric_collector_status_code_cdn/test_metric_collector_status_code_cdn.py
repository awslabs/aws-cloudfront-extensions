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

    import metric_collector_status_code_cdn
    from metric_collector_status_code_cdn import lambda_handler
    monkeypatch.setattr(metric_collector_status_code_cdn, "collect_metric_data", mock_collect_metric_data, raising=True)

    lambda_handler(event, None)

def mock_collect_metric_data(*args, **kwargs):
    return {
        "Detail" : [
                {
                    "QueryId" :"1"   
                }
            ]
    }
    
def mock_internal_get_domain_list():
    return 