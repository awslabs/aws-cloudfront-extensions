import logging
import os
import boto3
import pytest
from moto import mock_acm, mock_dynamodb
from tenacity import wait_none

from layer.acm_service.client import AcmUtilsService
from layer.acm_service.types_ import *
from layer.common.constants_ import *
from layer.common.types_ import Cname, SourceCfInfo
from layer.job_service.types_ import JobInfo
from test.test_utils import create_acm_metadata_table

os.environ.setdefault('AWS_PROFILE', 'cloudfront_ext')
os.environ.setdefault(ACM_METADATA_TABLE, 'metadata_table')
os.environ.setdefault(JOB_INFO_TABLE_NAME, 'job_info_table')
test_domain = 'test.com'
sanlist = ['a.' + test_domain, 'b.' + test_domain, '*.' + test_domain]


class TestAcmUtils:

    def test_constructor(self, monkeypatch):
        from layer.acm_service.client import AcmUtilsService
        AcmUtilsService()
        from layer.acm_service.client import AcmUtilsService
        logger = logging.Logger('test-log')
        AcmUtilsService(logger=logger)
        del os.environ[ACM_METADATA_TABLE]
        with pytest.raises(Exception):
            AcmUtilsService(logger=logger)
        os.environ.setdefault(ACM_METADATA_TABLE, 'metadata_table')

    @mock_acm
    def test_list_certificates(self, monkeypatch):
        from layer.acm_service.client import AcmUtilsService
        client = AcmUtilsService()
        cert_arn = _get_a_mock_cert(client)
        assert cert_arn is not None

        resp = client.list_certificates()
        assert len(resp) == 1
        test_task_token = "token"

        client.tag_certificate(cert_arn, test_task_token)
        client.tag_job_certificate(cert_arn, test_task_token)

        cert_detail = client.fetch_dcv_value(cert_arn)
        assert cert_detail['CertificateArn'] == cert_arn
        resp = client.list_certificates_by_status([cert_detail['Status']])
        assert resp[0]['CertificateArn'] == cert_arn

    @mock_acm
    @mock_dynamodb
    def test_certificate_metadata(self, monkeypatch):
        from layer.acm_service.client import AcmUtilsService
        client = AcmUtilsService()
        cert_arn = _get_a_mock_cert(client)
        assert cert_arn is not None
        ddb = boto3.resource(service_name="dynamodb", region_name="us-east-1")
        create_acm_metadata_table(ddb, client.acm_metadata_table)
        test_task_token = "token"
        monkeypatch.setattr(client.stepf_client, 'set_task', lambda *args, **kwargs: {})
        for status in ['certIssued', 'certNotIssued', 'certFailed']:

            test_metadata = CertificateMetadata(
                certArn=cert_arn,
                certUUid='certUUid',
                domainName=test_domain,
                jobToken=test_task_token,
                sanList=sanlist,
                taskStatus=status,
                taskToken=test_task_token,
                taskType='taskType'
            )

            client.tag_certificate(cert_arn, test_task_token)
            client.tag_job_certificate(cert_arn, test_task_token)
            client.create_acm_metadata(test_metadata)
            metadata = client.scan_by_job_token(test_metadata['jobToken'])
            assert metadata[0]['certArn'] == test_metadata['certArn']

            resp = client.get_results(job_id=test_metadata['jobToken'],
                                      certificates=[CertificateSummary(
                                          CertificateArn=cert_arn,
                                      )])
            assert resp[0] == cert_arn
            with pytest.raises(Exception):
                client.scan_by_conditions.retry.wait = wait_none()
                client.scan_by_conditions.retry.reraise = True
                resp = client.scan_for_cert(domain_name=test_domain)
                assert len(resp) == 0
            resp = client.fetch_dcv_value(cert_arn=cert_arn)
            assert resp is not None
            resp = client.fetch_acm_status_from_waiting_list('TASK_TOKEN_TAGGED')
            assert resp is None
            monkeypatch.setattr(client, 'query_certificate_status', lambda *args, **kwargs: status)
            monkeypatch.setattr(client.job_util, 'get_job_info_by_id', lambda *args, **kwargs: JobInfo(
                cert_total_number=0
            ))
            monkeypatch.setattr(client.job_util, 'update_job_field', lambda *args, **kwargs: {})

            client.fetch_acm_status_from_waiting_list(status)

    @mock_acm
    @mock_dynamodb
    def test_is_subset(self, monkeypatch):
        from layer.acm_service.client import AcmUtilsService
        client = AcmUtilsService()
        san = ["*.test.com"]
        res = client.is_wildcard(san)
        assert res == san[0]
        not_wild = client.is_wildcard(["test.com", "test2.com"])
        assert not_wild is None
        res = client.is_subset(san, {san[0]: "certArn"})
        assert res == "certArn"
        res = client.is_subset(san, {"not.com": "notSub"})
        assert res is None

        task_token_resp = client.check_generate_task_token("")
        assert task_token_resp != ""
        monkeypatch.setattr(client, 'create_acm_metadata', lambda *args, **kwargs: {})
        monkeypatch.setattr(client.ddb_util, 'delete_item', lambda *args, **kwargs: {})

        client.request_certificate.retry.wait = wait_none()
        client.request_certificate.retry.reraise = True


        for case_domain in ['test.com', 'sub.test.com']:
            sanlist_cases = [['a.' + case_domain, 'b.' + case_domain], sanlist, ['*.test.com'], ['test.com', '*.test.com']]

            for case in sanlist_cases:
                domain_name_list = [
                    Cname(
                        domainName=case_domain,
                        sanList=case,
                        existing_cf_info=SourceCfInfo(
                            config_version_id='1',
                            distribution_id='test',
                        ),
                        originsItemsDomainName=''
                    )
                ]
                resource_records = client.aggregate_dist(domain_name_list, task_token_resp, "create", "job_token")
                assert len(resource_records) > 0
                resource_records = client.none_aggregate_dist(domain_name_list, task_token_resp, "create", "job_token")
                assert len(resource_records) > 0
                resp = client.query_certificate_job_id(task_token_resp)
                assert resp is not None
                resp = client.query_certificate_status(task_token_resp)
                assert resp is not None
        client.delete_by_task_id_and_domain(task_token=task_token_resp, domain=test_domain)

    @mock_acm
    def test_import_certificate_by_pem(self, monkeypatch):
        from layer.acm_service.client import AcmUtilsService
        client = AcmUtilsService()
        monkeypatch.setattr(client.client, 'import_certificate', lambda *args, **kwargs: {'CertificateArn': 'test'})
        client.import_certificate_by_pem(ImportCertificateInput(
            Certificate='cert',
            PrivateKey='',
            CertificateChain='',
            Tags=''
        ))


def _get_a_mock_cert(client: AcmUtilsService) -> str:
    certificate_req = Certificate(
        DomainName=test_domain,
        SubjectAlternativeNames=sanlist,
        CertUUID='',
        JobToken='',
        TaskType='',
        TaskToken='',
    )
    cert_arn = client.request_certificate(certificate_req)
    return cert_arn