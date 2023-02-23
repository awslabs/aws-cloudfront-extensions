import logging

from moto import mock_s3


class TestS3Service:

    @mock_s3
    def test_constructor(self, monkeypatch):
        from layer.s3_service.client import S3UtilService
        import layer.s3_service.client as util
        client = S3UtilService()
        logger = logging.Logger('test-log')
        S3UtilService(logger=logger)
        monkeypatch.setattr(client.s3_client, 'get_object', lambda *args, **kwargs: {
            'Body': '{"test": 1}'
        })
        monkeypatch.setattr(util.json, 'load', lambda *args, **kwargs: {"test": 1})
        resp = client.get_object('bucket', 'key')
        assert resp['test'] == 1
