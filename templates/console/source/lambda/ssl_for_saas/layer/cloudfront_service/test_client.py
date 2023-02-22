import json
import os
from unittest import TestCase

import pytest

from layer.cloudfront_service.client import CloudFrontUtilsService
from layer.cloudfront_service.types_ import GetDistributionConfigOutput
from layer.common.constants_ import CONFIG_VERSION_TABLE

os.environ.setdefault('AWS_PROFILE', 'cloudfront_ext')
os.environ.setdefault(CONFIG_VERSION_TABLE,
                      'CloudFrontExtnConsoleStack-CloudFrontConfigVersionConstructCloudFrontConfigVersionTableF219CCBB-15HF8YDW5AVJ4')
os.environ.setdefault('GRAPHQL_API_KEY', 'graphql_key')
os.environ.setdefault('GRAPHQL_API_URL', 'https://{id}.appsync-api.us-east-1.amazonaws.com/graphql')
os.environ.setdefault('STEP_FUNCTION_ARN',
                      'arn:aws:sns:us-east-1:${ACCOUNT_ID}:CloudFront_Distribution_Notification')
os.environ.setdefault('SNS_TOPIC', 'arn:aws:sns:us-east-1:${ACCOUNT_ID}:CloudFront_Distribution_Notification')


@pytest.mark.skip(reason="dev only")
class TestCloudFrontUtilsClient(TestCase):
    def test_get_distribution_by_id(self):
        client = CloudFrontUtilsService()
        # resp = client.get_distribution_by_id(distribution_id='E3P84CPTS0TTY0')
        resp = client.fetch_cloudfront_config_version(distribution_id='EDZ12ZYVLJ0Y1', version_id='1')
        print(resp)

    def test_update_distribution(self):
        client = CloudFrontUtilsService()
        cert_arn = 'arn:aws:acm:us-east-1:${ACCOUNT_ID}:certificate/1a69599b-aaa6-449f-b380-15c3fafd4536'
        distribution_id = 'E2NUDMZ8FNWX3G'
        resp = client.client.get_distribution_config(
            Id=distribution_id
        )
        named_ = GetDistributionConfigOutput(**resp)

        config = client.construct_cloudfront_config(
            certificate_arn=cert_arn,
            template=named_['DistributionConfig'],
            sub_domain_list=['workflow005.erinzh.com']
        )

        client.update_distribution(
            config=config,
            cloudfront_id='E2NUDMZ8FNWX3G',
            etag=named_['ETag']
        )
