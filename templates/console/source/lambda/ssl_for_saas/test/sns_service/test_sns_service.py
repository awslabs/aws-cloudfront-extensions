import logging
import os

from moto import mock_sns

# os.environ.setdefault('AWS_PROFILE', 'cloudfront_ext')


class TestSnsUtilService:

    def test_constructor(self, monkeypatch):
        from layer.sns_service.client import SnsUtilsService
        client = SnsUtilsService()
        logger = logging.Logger('test-log')
        SnsUtilsService(logger=logger)

        resp = client.generate_notify_content('msg')
        assert resp is not None

    @mock_sns
    def test_notify_sns_subscriber(self, monkeypatch):
        from layer.sns_service.client import SnsUtilsService
        client = SnsUtilsService()
        monkeypatch.setattr(client.client, 'publish', lambda *args, **kwargs: {})
        client.notify_sns_subscriber('msg', 'topic')
