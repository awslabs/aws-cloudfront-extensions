import logging
import os
import boto3
import pytest
from moto import mock_dynamodb
from layer.common.constants_ import CONFIG_VERSION_TABLE
from test.test_utils import create_config_version_table

# os.environ.setdefault('AWS_PROFILE', 'cloudfront_ext')


class TestDDBService:

    def test_constructor(self, monkeypatch):
        from layer.ddb_service.client import DynamoDbUtilsService
        DynamoDbUtilsService()
        logger = logging.Logger('test-log')
        DynamoDbUtilsService(logger=logger)

    @mock_dynamodb
    def test_all_cases(self, monkeypatch):
        from layer.ddb_service.client import DynamoDbUtilsService
        client = DynamoDbUtilsService()
        table_name = CONFIG_VERSION_TABLE
        ddb = boto3.resource(service_name="dynamodb", region_name="us-east-1")
        create_config_version_table(ddb, table_name)
        with pytest.raises(Exception):
            client.put_items(table=None, entries={
                'distributionId': 'test',
                'versionId': 1,
                'config_link': "test",
                's3_bucket': 'CONFIG_VERSION_S3_BUCKET',
                's3_key': 'config_version_1.json'
            })

        resp = client.put_items(table=table_name, entries={})
        assert resp is None

        client.put_items(table=table_name, entries={
            'distributionId': 'test',
            'versionId': 1,
            'config_link': "test",
            's3_bucket': True,
            's3_key': ['config_version_1.json', 'test123'],
        })
        resp = client.get_all(table_name)
        assert resp is not None and len(resp) == 1
        resp = client.update_item(table_name, {
            'distributionId': 'test',
            'versionId': 1,
        }, 'config_link', 'test2')
        resp = client.get_item(table_name, {
            'distributionId': 'test',
            'versionId': 1,
        })
        assert resp['config_link'] == 'test2'

        resp = client.scan(table_name, filters={
            'distributionId': 'test',
            'versionId': 1,
        })
        assert resp[0]['config_link']['S'] == 'test2'

        resp = client.get_all(table_name)
        assert resp[0]['config_link'] == 'test2'

        client.delete_item(table_name, {
            'distributionId': 'test',
            'versionId': 1,
        })
        resp = client.get_all(table_name)
        assert len(resp) == 0



