import logging
import os

import boto3
import pytest
from moto import mock_dynamodb

from layer.common.constants_ import ACM_METADATA_TABLE, CONFIG_VERSION_TABLE, JOB_INFO_TABLE_NAME
from layer.job_service.types_ import JobInfo
from test.test_utils import create_job_info_table

# os.environ.setdefault('AWS_PROFILE', 'cloudfront_ext')
os.environ.setdefault(ACM_METADATA_TABLE,
                      'cert_metadata_table')
os.environ.setdefault(CONFIG_VERSION_TABLE,
                      CONFIG_VERSION_TABLE)
os.environ.setdefault('GRAPHQL_API_KEY', 'graphql_key')
os.environ.setdefault('GRAPHQL_API_URL', 'grapql_http')
os.environ.setdefault(JOB_INFO_TABLE_NAME,
                      JOB_INFO_TABLE_NAME)
os.environ.setdefault('STEP_FUNCTION_ARN',
                      'arn:aws:sns:us-east-1:${ACCOUNT_ID}:CloudFront_Distribution_Notification')
os.environ.setdefault('SNS_TOPIC', 'arn:aws:sns:us-east-1:${ACCOUNT_ID}:CloudFront_Distribution_Notification')


class TestJobInfo:

    def test_constructor(self, monkeypatch):
        from layer.job_service.client import JobInfoUtilsService
        client = JobInfoUtilsService()
        logger = logging.Logger('test-log')
        JobInfoUtilsService(logger=logger)
        del os.environ[JOB_INFO_TABLE_NAME]
        with pytest.raises(Exception):
            JobInfoUtilsService(logger=logger)
        os.environ.setdefault(JOB_INFO_TABLE_NAME, JOB_INFO_TABLE_NAME)

        del os.environ[ACM_METADATA_TABLE]
        with pytest.raises(Exception):
            JobInfoUtilsService(logger=logger)
        os.environ.setdefault(ACM_METADATA_TABLE, ACM_METADATA_TABLE)

    @mock_dynamodb
    def test_create_job_info(self, monkeypatch):
        from layer.job_service.client import JobInfoUtilsService
        client = JobInfoUtilsService()
        ddb = boto3.client("dynamodb")
        create_job_info_table(ddb, client.job_info_table)
        job_id = 'job_id'
        job_info = JobInfo(
            certList=[],
            certCreateStageStatus='certCreateStageStatus',
            cert_total_number=0,
            cert_completed_number=0,
            certValidationStageStatus='certValidationStageStatus',
            cloudfront_distribution_created_number=0,
            cloudfront_distribution_total_number=0,
            creationDate='date',
            distList=[],
            dcv_validation_msg='dcv_msg',
            distStageStatus='distStageStatus',
            job_input='input',
            jobType='job_type',
            jobId=job_id,
            promptInfo=''
        )
        client.create_job_info(job_info)
        resp = client.get_job_info_by_id('not_exist')
        assert resp is None
        resp = client.get_job_info_by_id(job_id)
        assert resp is not None
        resp = client.get_all()
        assert resp is not None and len(resp) == 1
        resp = client.update_job_fields_by_dict(job_id, {'jobType': 'job_type_2'})
        resp = client.get_job_info_by_id(job_id)
        assert resp['jobType'] == 'job_type_2'


