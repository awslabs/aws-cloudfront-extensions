import logging
import os
import time
import copy
import json

from datetime import datetime
from typing import Any, Union, List

from layer.common.constants_ import JOB_INFO_TABLE_NAME, ACM_METADATA_TABLE
from layer.ddb_service.client import DynamoDbUtilsService
from layer.job_service.types_ import JobInfo


class JobInfoUtilsService:

    def __init__(self, logging_level=logging.INFO, logger=None):
        self.job_info_table = os.getenv(JOB_INFO_TABLE_NAME)
        if not self.job_info_table:
            raise Exception("table name %s not found", JOB_INFO_TABLE_NAME)
        self.acm_metadata_table = os.getenv(ACM_METADATA_TABLE)
        if not self.acm_metadata_table:
            raise Exception("table name %s not found", ACM_METADATA_TABLE)
        if logger:
            self.logger = logger
        else:
            self.logger = logging.getLogger('boto3')
            self.logger.setLevel(logging_level)
        self.dynamo_client = DynamoDbUtilsService(logger=self.logger)

    def create_job_info(self, job_info: JobInfo):
        self.logger.info(
            f"trying to create job record with ddb_table_name: {self.job_info_table}, job_id:{job_info['jobId']}, "
            f"job_input: {job_info['job_input']}, cert_total_number:{job_info['cert_total_number']}, "
            f"cloudfront_distribution_total_number:{job_info['cloudfront_distribution_total_number']}, "
            f"cert_completed_number:{job_info['cert_completed_number']},"
            f"cloudfront_distribution_created_number:{job_info['cloudfront_distribution_created_number']}"
            f"jobType:{job_info['jobType']}"
            f"creationDate: {time.time()}"
            f"certCreateStageStatus: {job_info['certCreateStageStatus']}"
            f"certValidationStageStatus: {job_info['certValidationStageStatus']}"
            f"distStageStatus: {job_info['distStageStatus']}"
        )
        self.dynamo_client.put_items(table=self.job_info_table, entries=job_info)

    def create_job_with_event(self, event: dict[str, Any]):
        """
        :param event:
        event example:
        {
            "input": {
            "acm_op": "create",
            "auto_creation": "true",
            "dist_aggregate": "false",
            "enable_cname_check": "false",
            "cnameList": [
                {
                    "domainName": "web1.v2.ssl-for-saas.demo.solutions.aws.a2z.org.cn",
                    "sanList": [
                        "web1.v2.ssl-for-saas.demo.solutions.aws.a2z.org.cn"
                    ],
                    "originsItemsDomainName": "",
                    "existing_cf_info": {
                        "distribution_id": "E2CWQXEO490X1W",
                        "config_version_id": "1"
                    }
                }
            ],
            "pemList": [
                {
                    "CertPem": "",
                    "PrivateKeyPem": "",
                    "ChainPem": "",
                    "originsItemsDomainName": "",
                    "existing_cf_info": {
                        "distribution_id": "E2CWQXEO490X1W",
                        "config_version_id": "1"
                    }
                }
            ],
            "aws_request_id": "a9543ea5-96d5-4c12-9672-cf9f30bdabf2"
            }
        }
        :return:
        """

        job_token = event['input']['aws_request_id']
        if self.get_job_info_by_id(job_token) is None:
            domain_name_list = event['input']['cnameList']

        auto_creation = event['input']['auto_creation']
        cert_total_number = len(event['input']['cnameList'])
        cloudfront_total_number = 0 if (auto_creation == 'false') else cert_total_number
        job_type = event['input']['acm_op']
        creation_date = str(datetime.now())
        cert_create_stage_status = 'INPROGRESS'
        cert_validation_stage_status = 'NOTSTART'
        dist_stage_status = 'NOTSTART'

        body_without_pem = copy.deepcopy(event['input'])
        if 'pemList' in body_without_pem:
            del body_without_pem['pemList']

        if self.get_job_info_by_id(job_token) is None:
            self.create_job_info(JobInfo(
                jobId=job_token,
                job_input=json.dumps(body_without_pem, indent=4, default=str),
                cert_total_number=cert_total_number,
                cloudfront_distribution_total_number=cloudfront_total_number,
                cert_completed_number=0,
                cloudfront_distribution_created_number=0,
                jobType=job_type,
                creationDate=creation_date,
                certCreateStageStatus=cert_create_stage_status,
                certValidationStageStatus=cert_validation_stage_status,
                distStageStatus=dist_stage_status,
                promptInfo='',
                certList=[],
                dcv_validation_msg='',
                distList=[]
            ))

    def update_job_fields_by_dict(self, job_id: str, filed_values: dict[str, Any]):
        for key, val in filed_values.items():
            self.update_job_field(job_id, key, val)

    def update_job_field(self, job_id: str, field: str, value: Any):
        self.dynamo_client.update_item(self.job_info_table, {
            'jobId': job_id
        }, field, value)

    def get_job_info_by_id(self, job_id: str) -> Union[None, JobInfo]:
        self.logger.info(f"get_job_info: job_id={job_id}")
        self.logger.info(f"get_job_info: ddb_table_name={self.job_info_table}")
        resp = self.dynamo_client.get_item(self.job_info_table, key_values={
            'jobId': job_id
        })
        if not resp or len(resp) == 0:
            return None

        named_ = JobInfo(**resp)
        return named_

    def get_all(self) -> List[dict[str, Any]]:
        resp = self.dynamo_client.get_all(table=self.job_info_table)
        self.logger.info(f"SSL jobs list is : {resp}")
        return resp
