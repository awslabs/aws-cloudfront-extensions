import os
from unittest import TestCase

import pytest

from layer.common.constants_ import ACM_METADATA_TABLE, CONFIG_VERSION_TABLE, JOB_INFO_TABLE_NAME

os.environ.setdefault('AWS_PROFILE', 'cloudfront_ext')
os.environ.setdefault(ACM_METADATA_TABLE,
                      'CloudFrontExtnConsoleStack-StepFunctionRpTsConstructacmmetadataAE01DAD1-1V8Y8Y8EKVW5K')
os.environ.setdefault(CONFIG_VERSION_TABLE,
                      'CloudFrontExtnConsoleStack-CloudFrontConfigVersionConstructCloudFrontConfigVersionTableF219CCBB-15HF8YDW5AVJ4')
os.environ.setdefault('GRAPHQL_API_KEY', 'da2-y2k7si5ctzaetppba56r7nb754')
os.environ.setdefault('GRAPHQL_API_URL', 'https://gtjgvw6jk5fxvklgk7yge7kzqq.appsync-api.us-east-1.amazonaws.com/graphql')
os.environ.setdefault(JOB_INFO_TABLE_NAME,
                      'CloudFrontExtnConsoleStack-StepFunctionRpTsConstructsslforsaasjobinfotable199EF239-1JYPAMATXT90U')
os.environ.setdefault('STEP_FUNCTION_ARN',
                      'arn:aws:sns:us-east-1:648149843064:CloudFront_Distribution_Notification')
os.environ.setdefault('SNS_TOPIC', 'arn:aws:sns:us-east-1:648149843064:CloudFront_Distribution_Notification')


def test_for():
    range = [1, 2, 3, 4, 5, 6, 7]
    for i in range:
        print(f'outter {i}')
        for x in range:
            print(f'inner {x}')
            if x == 3:
                break

    print('done')

@pytest.mark.skip(reason="dev only")
class Test(TestCase):
    def test_handler(self):
        from handler import handler
        handler({}, {})
