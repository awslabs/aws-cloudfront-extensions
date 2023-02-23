import logging
import os

from moto import mock_resourcegroupstaggingapi


os.environ.setdefault('AWS_PROFILE', 'cloudfront_ext')


class TestResourceService:

    def test_constructor(self, monkeypatch):
        from layer.resouce_service.client import ResourceUtilService
        client = ResourceUtilService()
        logger = logging.Logger('test-log')
        ResourceUtilService(logger=logger)

    @mock_resourcegroupstaggingapi
    def test_get_resource_by_job_id(self, monkeypatch):
        from layer.resouce_service.client import ResourceUtilService
        client = ResourceUtilService()

        resp = client.get_resource_by_job_id('job_id')
        assert len(resp) == 0
        monkeypatch.setattr(client.resource_client, 'get_resources', lambda *args, **kwargs: {
            'ResourceTagMappingList': [{
                'ResourceARN': 'test'
            }]
        })

        resp = client.get_resource_by_job_id('job_id')
        assert len(resp) == 1



