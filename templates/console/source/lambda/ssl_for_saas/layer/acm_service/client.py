import json
import logging
import os
import re
import uuid
import boto3
import random
import string

from typing import Any, Union
from tenacity import retry, stop_after_attempt, wait_random, wait_fixed, retry_if_exception_type
from layer.acm_service.types_ import *
from layer.common.constants_ import ACM_METADATA_TABLE
from layer.common.types_ import *
from layer.ddb_service.client import DynamoDbUtilsService
from requests import exceptions
from layer.job_service.client import JobInfoUtilsService
from layer.stepfunction_service.client import StepFunctionUtilsService


class AcmUtilsService:

    def __init__(self, region_name: str = 'us-east-1', logging_level=logging.INFO, logger=None):
        if logger:
            self.logger = logger
        else:
            self.logger = logging.getLogger('boto3')
            self.logger.setLevel(logging_level)

        self.acm_metadata_table = os.environ.get(ACM_METADATA_TABLE)
        if not self.acm_metadata_table:
            raise Exception('not found table name for acm_metadata_table')
        self.client = boto3.client('acm', region_name)
        self.ddb_util = DynamoDbUtilsService(logger=self.logger)
        self.stepf_client = StepFunctionUtilsService(logger=self.logger)
        self.job_util = JobInfoUtilsService(logger=self.logger)

    # def list_certificates_raw(self) -> Any:
    #     return self.client.list_certificates()

    def list_certificates(self) -> List[CertificateSummary]:
        resp = self.client.list_certificates()
        named_ = ListCertificateSummaryOutput(**resp)
        return named_['CertificateSummaryList']

    def list_certificates_by_status(self, statuses: List[str]) -> List[CertificateSummary]:
        resp = self.client.list_certificates(CertificateStatuses=statuses)
        named_ = ListCertificateSummaryOutput(**resp)
        return named_['CertificateSummaryList']

    def get_results(self, job_id: str, certificates: List[CertificateSummary]) -> List[str]:
        result = []
        # filter only the certificates with jobId in job_token tag
        for cert in certificates:
            tags = self.list_certificate_tags_by_arn(
                certificate_arn=cert['CertificateArn']
            )

            self.logger.info(json.dumps(tags, default=str))

            for tagItem in tags:
                if tagItem['Key'] == 'job_token' and tagItem['Value'] == job_id:
                    result.append(cert['CertificateArn'])
        return result

    def _tag_certificate(self, cert_arn: str, key: str, val: str):
        """[summary]

        Args:
            :param val:
            :param key:
            :param cert_arn:
        """
        self.logger.info('Tagging certificate %s with %s -> %s', cert_arn, key, val)
        self.client.add_tags_to_certificate(
            CertificateArn=cert_arn,
            Tags=[
                {
                    'Key': key,
                    'Value': val
                }
            ]
        )

    def tag_certificate(self, cert_arn: str, task_token: str):
        self._tag_certificate(cert_arn, 'task_token', task_token)

    def tag_job_certificate(self, cert_arn: str, job_token: str):
        self._tag_certificate(cert_arn, 'job_token', job_token)

    @retry(wait=wait_fixed(1) + wait_random(0, 2), stop=stop_after_attempt(30))
    def request_certificate(self, certificate: Certificate) -> str:
        """

        :param certificate:
        :return: str - the certificate arn
        """
        self.logger.info('Requesting certificate for %s', certificate.DomainName)
        resp = self.client.request_certificate(
            DomainName=certificate.DomainName,
            ValidationMethod='DNS',
            SubjectAlternativeNames=certificate.SubjectAlternativeNames,
            Options={
                'CertificateTransparencyLoggingPreference': 'ENABLED'
            },
            Tags=[
                {
                    'Key': 'issuer',
                    'Value': certificate.DomainName.replace('*.', '')
                }
            ]
        )
        self.logger.info('Certificate creation response: %s', resp)
        named_ = RequestCertificateOutput(**resp)
        return named_['CertificateArn']

    def create_acm_metadata(self, metadata: CertificateMetadata):
        """

        :param metadata:
        :return:
        """
        self.logger.info('Creating domain metadata with taskToken %s, domainName %s', metadata['taskToken'],
                         metadata['domainName'])
        resp = self.ddb_util.put_items(self.acm_metadata_table, metadata)
        self.logger.info('Domain metadata creation response: %s', resp)

    def is_subset(self, san_list: List[str], wildcard_san_dict: dict[str, Any]) -> Union[str, None]:
        """

        :param san_list:
        :param wildcard_san_dict:
        :return:
        """
        # iterate wildcard san dict
        self.logger.info('start to check if san list %s is subset of wildcard san dict %s', san_list, wildcard_san_dict)
        for key, value in wildcard_san_dict.items():
            # wildcard search in string with regular expression
            # regex = re.compile(r'.*\.risetron.cn') key is *.risetron.cn
            regex = re.compile(r'.*\.{}'.format(key.replace('*.', '')))
            matches = [san for san in san_list if re.match(regex, san)]
            self.logger.info('regex: %s, matches %s', regex, matches)
            if len(matches) == len(san_list):
                return value
        return None

    def is_wildcard(self, san_list: List[str]) -> Union[str, None]:
        """

        :param san_list:
        :return:
        """
        # iterate san list
        for san in san_list:
            # check if wildcard string
            if san.startswith('*'):
                return san
        return None

    # describe certificate details
    @retry(wait=wait_fixed(1) + wait_random(0, 2), stop=stop_after_attempt(20),
           retry=retry_if_exception_type(exceptions.Timeout))
    def fetch_dcv_value(self, cert_arn: str) -> CertificateDetail:
        # describe certificate domainName
        resp = self.client.describe_certificate(
            CertificateArn=cert_arn
        )
        self.logger.info('fetch acm response for dcv: %s', resp)
        if 'DomainValidationOptions' not in resp['Certificate']:
            self.logger.info('DomainValidationOptions is None, retry')
            raise exceptions.Timeout

        # validate if schema DomainValidationOptions is None and retry if possible
        if 'ResourceRecord' not in resp['Certificate']['DomainValidationOptions'][0]:
            self.logger.info('ResourceRecord is None, retry')
            raise exceptions.Timeout

        self.logger.info("ResourceRecord fulfilled, return for further processing")
        _named = DescribeCertificateOutput(**resp)
        return _named['Certificate']

    def _common_cert_operations(self, certificate: Certificate) -> CommonCertOperationResult:
        """

        :param certificate:
        :return:
        """
        cert_arn = self.request_certificate(certificate)
        self.logger.info('Certificate creation response: %s', cert_arn)
        metadata = CertificateMetadata(
            domainName=certificate.DomainName,
            sanList=certificate.SubjectAlternativeNames,
            certUUid=certificate.CertUUID,
            taskToken=certificate.TaskToken,
            taskType=certificate.TaskType,
            taskStatus='TASK_TOKEN_TAGGED',
            certArn=cert_arn,
            jobToken=certificate.JobToken
        )

        self.create_acm_metadata(metadata)

        self.tag_certificate(cert_arn, certificate.TaskToken[:128])
        self.tag_job_certificate(cert_arn, certificate.JobToken)
        cert_detail = self.fetch_dcv_value(cert_arn)

        # iterate DomainValidationOptions array to get DNS validation record
        sns_msgs = []
        for dns_index, dns_value in enumerate(cert_detail['DomainValidationOptions']):
            if dns_value['ValidationMethod'] == 'DNS':
                dns_validation_record = dns_value['ResourceRecord']
                self.logger.info('index %s: DNS validation record: %s', dns_index, dns_validation_record)
                sns_msgs.append(dns_validation_record)

        return CommonCertOperationResult(CertArn=cert_arn, DnsValidationRecords=sns_msgs)

    def check_generate_task_token(self, task_token: str) -> str:
        if not task_token:
            self.logger.error("Task token not found in event")
            # generate a random string as task_token
            task_token = ''.join(random.choices(string.ascii_lowercase, k=128))
        else:
            self.logger.info("Task token {}".format(task_token))
        return task_token

    def aggregate_dist(self, domains: List[Cname], task_token: str, task_type: str, job_token: str) \
            -> List[ResourceRecord]:
        wildcard_cert_dict = {}
        sns_records = []
        for cname_index, cname_value in enumerate(domains):
            cert_uuid = str(uuid.uuid4())
            # san_list_dynamo_db = [dict(zip(['S'], [x])) for x in cname_value.sanList]
            # self.logger.info('index %s: sanList for DynamoDB: %s', cname_index, san_list_dynamo_db)
            certificate = Certificate(
                CertUUID=cert_uuid,
                SubjectAlternativeNames=cname_value['sanList'],
                DomainName=cname_value['domainName'],
                TaskToken=task_token,
                TaskType=task_type,
                JobToken=job_token,
            )
            # TBD, add cname_value['domainName'] to wildcard_cert_dict
            wildcard_san = self.is_wildcard(cname_value['sanList'])
            self.logger.info('wildcardSan: %s', wildcard_san)
            if not wildcard_san:
                parent_cert_arn = self.is_subset(cname_value['sanList'], wildcard_cert_dict)
                self.logger.info('parentCertArn: %s', parent_cert_arn)
                if parent_cert_arn:
                    metadata = CertificateMetadata(
                        domainName=certificate.DomainName,
                        sanList=cname_value['sanList'],
                        certUUid=cert_uuid,
                        taskToken=task_token,
                        taskType=task_type,
                        taskStatus='TASK_TOKEN_TAGGED',
                        certArn=parent_cert_arn,
                        jobToken=job_token
                    )
                    self.create_acm_metadata(metadata)
                    continue

            ############### TBD, wrapper needed
            resp = self._common_cert_operations(certificate)
            sns_records.extend(resp.DnsValidationRecords)
            ###############

            if wildcard_san:
                # update wildcard certificate dict
                wildcard_cert_dict[wildcard_san] = resp.CertArn

        return sns_records

    def none_aggregate_dist(self, domains: List[Cname], task_token: str, task_type: str, job_token: str) \
            -> List[ResourceRecord]:
        sns_records = []
        for cname_index, cname_value in enumerate(domains):
            cert_uuid = str(uuid.uuid4())
            # san_list_dynamo_db = [dict(zip(['S'], [x])) for x in cname_value['sanList']]
            # logger.info('index %s: sanList for DynamoDB: %s', cname_index, san_list_dynamo_db)
            certificate = Certificate(
                CertUUID=cert_uuid,
                SubjectAlternativeNames=cname_value['sanList'],
                DomainName=cname_value['domainName'],
                TaskToken=task_token,
                TaskType=task_type,
                JobToken=job_token
            )
            resp = self._common_cert_operations(certificate)
            sns_records.extend(resp.DnsValidationRecords)
        return sns_records

    def scan_by_conditions(self, filters: dict[str, Any]) -> List[CertificateMetadata]:
        resp = self.ddb_util.scan(table=self.acm_metadata_table, filters=filters)
        # raise exception if response['Items'] is empty
        if resp is None or len(resp) == 0:
            self.logger.info('Specific domain not found, retry')
            raise exceptions.Timeout
        result = []
        for item in resp:
            metadata = CertificateMetadata(
                domainName=item['domainName']['S'],
                sanList=item['sanList']['L'],
                certUUid=item['certUUid']['S'],
                certArn=item['certArn']['S'],
                taskToken=item['taskToken']['S'],
                taskType=item['taskType']['S'],
                taskStatus=item['taskStatus']['S'],
                jobToken=item['jobToken']['S']
            )
            result.append(metadata)
        return result

    def scan_for_cert(self, domain_name: str) -> List[CertificateMetadata]:
        return self.scan_by_conditions({
            'domainName': domain_name,
            'taskStatus': 'CERT_ISSUED'
        })

    def scan_by_job_token(self, job_token: str) -> List[CertificateMetadata]:
        return self.scan_by_conditions({
            'jobToken': job_token
        })

    def delete_by_task_id_and_domain(self, task_token: str, domain: str):
        self.ddb_util.delete_item(self.acm_metadata_table, {
            'taskToken': task_token,
            'domainName': domain
        })

    def list_certificate_tags_by_arn(self, certificate_arn: str) -> List[Tag]:
        resp = self.client.list_tags_for_certificate(
            CertificateArn=certificate_arn
        )
        self.logger.info('certificate tags: %s', json.dumps(resp))
        _named = ListTagsForCertificateOutput(**resp)
        return _named['Tags']

    # fixme: to many api calls make the function very expensive
    def query_certificate_status(self, task_token: str) -> str:
        # list all certificates, TBD take list_certificates out of such function
        certificates = self.list_certificates()
        self.logger.info('certificates summary: %s', json.dumps(certificates, default=str))
        # True if all certificates with specified tag(token_id) are Issued
        cert_status = 'notIssued'

        # iterate all certificates
        certificates.reverse()
        for certificate in certificates:
            # select certificates with tag 'token_id'
            tags = self.list_certificate_tags_by_arn(certificate['CertificateArn'])
            # iterate all tags and check if tag 'token_id' is present
            for tag in tags:
                # logger.info('tag value: {}, task_token: {}'.format(tag['Value'], task_token))
                if tag['Key'] == 'task_token' and tag['Value'] == task_token:
                    self.logger.info('certificate found: %s', certificate['CertificateArn'])
                    # describe certificate
                    resp = self.client.describe_certificate(
                        CertificateArn=certificate['CertificateArn']
                    )
                    cert_info = DescribeCertificateOutput(**resp)
                    # check if status is ISSUED,
                    # 'PENDING_VALIDATION'|'ISSUED'|'INACTIVE'|'EXPIRED'|'VALIDATION_TIMED_OUT'|'REVOKED'|'FAILED',
                    if cert_info['Certificate']['Status'] == 'ISSUED':
                        cert_status = 'certIssued'
                        self.logger.info('certificate issued: %s', certificate['CertificateArn'])
                        # break
                    elif cert_info['Certificate']['Status'] == 'PENDING_VALIDATION':
                        cert_status = 'certNotIssued'
                        self.logger.info('certificate not issued: %s with status %s', certificate['CertificateArn'],
                                         resp['Certificate']['Status'])
                        return cert_status
                    elif cert_info['Certificate']['Status'] == 'VALIDATION_TIMED_OUT' or \
                            cert_info['Certificate']['Status'] == 'FAILED':
                        cert_status = 'certFailed'
                        self.logger.info('certificate not issued: %s with status %s', certificate['CertificateArn'],
                                         resp['Certificate']['Status'])
                        return cert_status

        return cert_status

    def fetch_acm_status_from_waiting_list(self, task_status: str):
        rows = self.ddb_util.scan(self.acm_metadata_table, {
            'taskStatus': task_status
        })
        if not rows or len(rows) == 0:
            self.logger.info('No Task found with taskStatus: %s', task_status)
            return

        metadata = []
        for row in rows:
            record = self.ddb_util.deserialize(row)
            metadata.append(CertificateMetadata(**record))

        # filter item into acm_dcv_dict with {taskToken1: [certUUid1, certUUid2, ...], ...}
        self.logger.info('dynamodb scan result with status TASK_TOKEN_TAGGED: %s', json.dumps(metadata, default=str))

        # an empty key value pair
        acm_dcv_dict = {}

        for item in metadata:
            # create list in dict
            if item['taskToken'] not in acm_dcv_dict:
                acm_dcv_dict[item['taskToken']] = []

            # append cert uuid into the list
            acm_dcv_dict[item['taskToken']].append(item['domainName'])
        # todo: no rollback if failed!!! job status has been updated
        self.query_update_metadata(acm_dcv_dict)

    def _update_acm_metadata_task_status(self, task_token: str, domain_name: str, task_status: str):
        self.logger.info('update task (token %s, domain name %s) status to %s', task_token, domain_name, task_status)
        self.ddb_util.update_item(table=self.acm_metadata_table, key={
            'taskToken': task_token,
            'domainName': domain_name
        }, field_name='taskStatus', value=task_status)

    def update_acm_metadata_task_token_by_job_id(self, job_id: str, task_token: str):
        self.logger.info(f'update task jobid {job_id} task_token to {task_token}')
        self.ddb_util.update_item(table=self.acm_metadata_table, key={
            'jobToken': job_id
        }, field_name='taskToken', value=task_token)

    # query job_id specific taskToken
    def query_certificate_job_id(self, task_token: str) -> str:
        certs = self.list_certificates()
        self.logger.info('certificates summary: %s', json.dumps(certs, default=str))

        # iterate all certificates
        for certificate in certs:
            # select certificates with tag 'token_id'
            tags = self.list_certificate_tags_by_arn(
                certificate_arn=certificate['CertificateArn']
            )
            self.logger.info('certificate tags: %s', json.dumps(tags, default=str))
            # iterate all tags and check if tag 'token_id' is present
            for tag in tags:
                if tag['Key'] == 'task_token' and tag['Value'] == task_token:
                    for inside_tag in tags:
                        if inside_tag['Key'] =='job_token':
                            return inside_tag['Value']

        return ''

    def query_update_metadata(self, acm_dcv_dict: dict[str, List[str]]):
        # iterate all taskToken in acm_dcv_dict
        job_status_dict = {}
        for task_token, domains in acm_dcv_dict.items():
            cert_status = self.query_certificate_status(task_token[:128])
            # check if all certificates with specified taskToken are issued
            if cert_status == 'certIssued':
                # note such output will be carried into next state as input
                for domain_name in domains:
                    self._update_acm_metadata_task_status(task_token, domain_name, 'CERT_ISSUED')
                self.stepf_client.set_task(token=task_token, task='success', output={'status': 'SUCCEEDED'})
                current_num = job_status_dict.get(task_token, 0)
                job_token = self.query_certificate_job_id(task_token[:128])
                # FIXME: why twice?
                job_status_dict.setdefault(job_token, current_num)
                job_status_dict.update({job_token: current_num+1})
                # update all certs in acm_dcv_dict, validate transient status are:
                # TASK_TOKEN_TAGGED | CERT_ISSUED | CERT_FAILED
            elif cert_status == 'certNotIssued':
                self.logger.info('one or more certificate with task token %s not issued', task_token)
                self.stepf_client.set_task(token=task_token, task='heartbeat')
            elif cert_status == 'certFailed':
                self.logger.info('one or more certificate with task token %s failed to issue', task_token)
                # iterate all certs in acm_dcv_dict, TBD delete DynamoDB item and notify with sns directly
                for domain_name in domains:
                    self._update_acm_metadata_task_status(task_token, domain_name, 'CERT_FAILED')
                self.stepf_client.set_task(task_token, 'failure', {'status': 'FAILED'},)

        # Update the job info table for the issued cert number
        for job_token, num in job_status_dict.items():
            self.logger.info(job_token)
            self.logger.info(num)
            resp = self.job_util.get_job_info_by_id(job_token)
            if resp is None:
                self.logger.error(f"failed to get the job info of job_id:{job_token} ")
                continue
            cert_total_number = resp['cert_total_number']
            self.job_util.update_job_field(job_token, 'cert_completed_number', cert_total_number)

    def import_certificate_by_pem(self, certificate: ImportCertificateInput) -> str:
        self.logger.info('start to importing existing certification %s', json.dumps(certificate, default=str))

        resp = self.client.import_certificate(
            Certificate=certificate['Certificate'],
            PrivateKey=certificate['PrivateKey'],
            CertificateChain=certificate['CertificateChain'],
            Tags=certificate['Tags']
        )

        named_ = ImportCertificateOutput(**resp)
        return named_['CertificateArn']

    def get_notification_content(self, job_token: str, cloudfront_distributions: List[NotificationInput],
                                 dcv_msg: List[ResourceRecord]) -> str:
        # self.logger.info("Received event: " + json.dumps(event))
        # Update the job info table to mark the cloudfront distribution creation succeed
        # response = self.job_util.get_job_info_by_id(job_token)
        # if response is not None:
        #     self.job_util.update_job_fields_by_dict(job_token, {
        #         'cloudfront_distribution_created_number': response['cloudfront_distribution_total_number'],
        #         'cert_total_number': response['cert_total_number'],
        #         'distStageStatus': 'SUCCESS',
        #     })
        # else:
        #     self.logger.error('No job info found for job token: ' + job_token)

        msg = self.get_distribution_msg(cloudfront_distributions=cloudfront_distributions)
        message_to_be_published = {
            'CloudFront Details': msg,
            'Acm Certificate Dcv': dcv_msg
        }

        return json.dumps(message_to_be_published, indent=3, default=str)

        # self.sns_client.publish_by_topic(
        #     topic_arn=topic_arn,
        #     msg=json.dumps(message_to_be_published, indent=3, default=str),
        #     subject='SSL for SaaS event received'
        # )

    def get_distribution_msg(self, cloudfront_distributions: List[NotificationInput]) -> List[str]:
        msg = []
        # iterate distribution list from event
        for record in cloudfront_distributions:
            msg.append("Distribution domain name {} created, ARN: {}, aliases: {}"
                       .format(record['distributionDomainName'],
                               record['distributionArn'],
                               record['aliases']
                               )
                       )
        return msg

    def close(self):
        self.client.close()
