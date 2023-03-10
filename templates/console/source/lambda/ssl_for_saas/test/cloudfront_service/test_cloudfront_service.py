import copy
import logging
import os

import boto3
import pytest
from moto import mock_dynamodb, mock_cloudfront
from tenacity import wait_none

from layer.cloudfront_service.types_ import GetDistributionConfigOutput, DistributionConfigWithTags, Tag, Tags
from layer.common.constants_ import ACM_METADATA_TABLE, CONFIG_VERSION_TABLE
from layer.common.types_ import Cname, SourceCfInfo
from test.test_utils import create_config_version_table, sample_cloudfront_config

# os.environ.setdefault('AWS_PROFILE', 'cloudfront_ext')
os.environ.setdefault(CONFIG_VERSION_TABLE,
                      CONFIG_VERSION_TABLE)
os.environ.setdefault('GRAPHQL_API_KEY', 'grapql_key')
os.environ.setdefault('GRAPHQL_API_URL', 'gf_api')
os.environ.setdefault('STEP_FUNCTION_ARN',
                      'arn:aws:sns:us-east-1:${ACCOUNT_ID}:CloudFront_Distribution_Notification')
os.environ.setdefault('SNS_TOPIC', 'arn:aws:sns:us-east-1:${ACCOUNT_ID}:CloudFront_Distribution_Notification')


class TestCloudfrontService:

    def test_constructor(self, monkeypatch):
        from layer.cloudfront_service.client import CloudFrontUtilsService
        CloudFrontUtilsService()

        logger = logging.Logger('test-log')
        CloudFrontUtilsService(logger=logger)
        del os.environ[CONFIG_VERSION_TABLE]

        with pytest.raises(Exception):
            CloudFrontUtilsService(logger=logger)

        os.environ.setdefault(CONFIG_VERSION_TABLE, CONFIG_VERSION_TABLE)

    @mock_dynamodb
    @mock_cloudfront
    def test_validate_source_cloudfront_dist(self, monkeypatch):
        from layer.cloudfront_service.client import CloudFrontUtilsService
        client = CloudFrontUtilsService()
        ddb = boto3.client("dynamodb")
        create_config_version_table(ddb, client.config_version_table)
        distr_id = 'ED1GHHCCBZVHL'
        client.ddb_client.put_items(table=client.config_version_table, entries={
            'distributionId': distr_id,
            'versionId': 1,
            'config_link': "test",
            's3_bucket': 'CONFIG_VERSION_S3_BUCKET',
            's3_key': 'config_version_1.json'
        })

        domain_name_list = [
            Cname(
                existing_cf_info=SourceCfInfo(
                    config_version_id='1',
                    distribution_id=distr_id,
                )
            )]

        resp = client.validate_source_cloudfront_dist(domain_name_list)
        assert resp

        # assert resp is not None
        domain_name_list = [
            Cname(
                existing_cf_info=SourceCfInfo(
                    config_version_id='0',
                    distribution_id='not_exist',
                ))
        ]
        with pytest.raises(Exception):
            client.validate_source_cloudfront_dist(domain_name_list)


        domain_name_list = [
            Cname(
                existing_cf_info=SourceCfInfo(
                    distribution_id=distr_id,
                )
            )]
        monkeypatch.setattr(client.client, 'get_distribution', lambda *args, **kwargs: {})

        with pytest.raises(Exception):
            client.validate_source_cloudfront_dist(domain_name_list)

        monkeypatch.setattr(client.client, 'get_distribution', lambda *args, **kwargs: {
            'Distribution': {}
        })
        with pytest.raises(Exception):
            client.validate_source_cloudfront_dist(domain_name_list)

        domain_name_list = []
        with pytest.raises(Exception):
            client.validate_source_cloudfront_dist(domain_name_list)

        domain_name_list = [Cname()]
        with pytest.raises(Exception):
            client.validate_source_cloudfront_dist(domain_name_list)

        monkeypatch.setattr(client.client, 'get_distribution_config', lambda *args, **kwargs: sample_cloudfront_config)
        monkeypatch.setattr(client.s3_client, 'get_object', lambda *args, **kwargs: sample_cloudfront_config)

        resp = client.get_distribution_config_by_distribution_id(distr_id)
        assert resp is not None

        resp = client.fetch_cloudfront_config_version(distribution_id=distr_id, version_id='1')
        assert resp is not None

    def test_construct_cloudfront_config(self, monkeypatch):
        from layer.cloudfront_service.client import CloudFrontUtilsService
        client = CloudFrontUtilsService()
        monkeypatch.setattr(client, 'fetch_cloudfront_config_version', lambda *args, **kwargs: {
            'Aliases': {
                'Items': []
            },
            'ViewerCertificate': {
                'CloudFrontDefaultCertificate': {}
            },
            'Logging': {}
        })
        config = client.construct_cloudfront_config_with_version('cert_arn', 'dist_id', '1', ['list'])
        assert config is not None

        monkeypatch.setattr(client, 'get_distribution_config_by_distribution_id',
                            lambda *args, **kwargs: {
                                'Aliases': {
                                    'Items': []
                                },
                                'ViewerCertificate': {
                                    'CloudFrontDefaultCertificate': {}
                                },
                                'Logging': {}
                            })

        config = client.construct_cloudfront_config_with_dist_id('cert_arn', 'dist_id', ['list'])
        assert config is not None
        # from acm_cb_handler import construct_cloudfront_config_with_dist_id
        # construct_cloudfront_config_with_dist_id('cert', 'orig_id', {}, 0, 'test.com', 0, '/path', ['list'])

    @mock_cloudfront
    def test_create_distribution_with_tags(self, monkeypatch):
        from layer.cloudfront_service.client import CloudFrontUtilsService
        client = CloudFrontUtilsService()
        client.create_distribution_with_tags.retry.wait = wait_none()
        client.create_distribution_with_tags.retry.reraise = True
        copy_config = copy.deepcopy(sample_cloudfront_config)
        del copy_config['ETag']
        base_config = DistributionConfigWithTags(**copy_config)
        base_config['Tags'] = Tags(
            Items=[
                Tag(
                    Key='key',
                    Value='value'
                )
            ]
        )

        resp = client.create_distribution_with_tags(base_config)
        assert resp is not None
