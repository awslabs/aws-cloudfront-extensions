import os
from unittest import TestCase

import pytest

from layer.common.constants_ import ACM_METADATA_TABLE, JOB_INFO_TABLE_NAME
from layer.resouce_service.client import ResourceUtilService

os.environ.setdefault('AWS_PROFILE', 'cloudfront_ext')
os.environ.setdefault(ACM_METADATA_TABLE,
                      'cloudfront-extn-01-StepFunctionRpTsConstructacmmetadataAE01DAD1-NDRJLSR8R5DH')
os.environ.setdefault(JOB_INFO_TABLE_NAME,
                      'CloudFrontExtnConsoleStack-StepFunctionRpTsConstructsslforsaasjobinfotable199EF239-20EOT6Z1TZGV')
os.environ.setdefault('STEP_FUNCTION_ARN',
                      'arn:aws:states:us-east-1:648149843064:stateMachine:SSL-for-SaaS-StateMachine')


@pytest.mark.skip(reason="dev only")
class TestResourceUtilService(TestCase):
    def test_get_resource_by_job_id(self):
        client = ResourceUtilService()
        resp = client.get_resource_by_job_id('996d6b0d-2180-4b2a-98f8-51b353d09f7b')
        print(resp)
