import datetime
import json
import os
from unittest import TestCase

import pytest

from layer.common.constants_ import *
from layer.job_service.client import JobInfoUtilsService
from layer.job_service.types_ import JobInfo

os.environ.setdefault('AWS_PROFILE', 'cloudfront_ext')
os.environ.setdefault(ACM_METADATA_TABLE,
                      'CloudFrontExtnConsoleStack-StepFunctionRpTsConstructacmmetadataAE01DAD1-1PSG8OYZCNPE5')
os.environ.setdefault(CONFIG_VERSION_TABLE,
                      'CloudFrontExtnConsoleStack-CloudFrontConfigVersionConstructCloudFrontConfigVersionTableF219CCBB-15HF8YDW5AVJ4')
os.environ.setdefault('GRAPHQL_API_KEY', 'da2-y2k7si5ctzaetppba56r7nb754')
os.environ.setdefault('GRAPHQL_API_URL', 'https://gtjgvw6jk5fxvklgk7yge7kzqq.appsync-api.us-east-1.amazonaws.com/graphql')
os.environ.setdefault(JOB_INFO_TABLE_NAME,
                      'CloudFrontExtnConsoleStack-StepFunctionRpTsConstructsslforsaasjobinfotable199EF239-R0CQ1O54JK2T')
os.environ.setdefault('STEP_FUNCTION_ARN',
                      'arn:aws:sns:us-east-1:648149843064:CloudFront_Distribution_Notification')
os.environ.setdefault('SNS_TOPIC', 'arn:aws:sns:us-east-1:648149843064:CloudFront_Distribution_Notification')


@pytest.mark.skip(reason="dev only")
class TestJobInfoUtilsService(TestCase):
    def test_get_all(self):
        client = JobInfoUtilsService()
        resp = client.get_job_info_by_id('a9bd53cf-bcdf-4907-9ef3-3413d4b86bd5')
        print(resp)

        print(resp['cloudfront_distribution_created_number'])

    def test_create_job(self):
        client = JobInfoUtilsService()
        client.create_job_info(JobInfo(
            jobId='testtoken',
            job_input='{"test": "test"}',
            cert_total_number=0,
            cloudfront_distribution_total_number=0,
            cert_completed_number=0,
            cloudfront_distribution_created_number=0,
            jobType='jobtype',
            creationDate=json.dumps(datetime.datetime.now(), default=str),
            certCreateStageStatus='certCreateStageStatus',
            certValidationStageStatus='cert_validation_stage_status',
            distStageStatus='dist_stage_status',
            promptInfo='',
            certList=[],
            dcv_validation_msg='',
            distList=[]
        ))
        print('created')
