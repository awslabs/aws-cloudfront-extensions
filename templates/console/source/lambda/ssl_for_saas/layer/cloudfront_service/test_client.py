import json
import os
from unittest import TestCase

import pytest

from layer.cloudfront_service.client import CloudFrontUtilsService
from layer.common.constants_ import CONFIG_VERSION_TABLE

os.environ.setdefault('AWS_PROFILE', 'cloudfront_ext')
os.environ.setdefault(CONFIG_VERSION_TABLE,
                      'CloudFrontExtnConsoleStack-CloudFrontConfigVersionConstructCloudFrontConfigVersionTableF219CCBB-15HF8YDW5AVJ4')
os.environ.setdefault('GRAPHQL_API_KEY', 'da2-y2k7si5ctzaetppba56r7nb754')
os.environ.setdefault('GRAPHQL_API_URL', 'https://gtjgvw6jk5fxvklgk7yge7kzqq.appsync-api.us-east-1.amazonaws.com/graphql')
os.environ.setdefault('STEP_FUNCTION_ARN',
                      'arn:aws:sns:us-east-1:648149843064:CloudFront_Distribution_Notification')
os.environ.setdefault('SNS_TOPIC', 'arn:aws:sns:us-east-1:648149843064:CloudFront_Distribution_Notification')


@pytest.mark.skip(reason="dev only")
class TestCloudFrontUtilsClient(TestCase):
    def test_get_distribution_by_id(self):
        client = CloudFrontUtilsService()
        # resp = client.get_distribution_by_id(distribution_id='E3P84CPTS0TTY0')
        resp = client.fetch_cloudfront_config_version(distribution_id='EDZ12ZYVLJ0Y1', version_id='1')
        print(resp)
