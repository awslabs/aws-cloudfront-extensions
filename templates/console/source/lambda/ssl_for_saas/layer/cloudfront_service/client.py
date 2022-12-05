import json
import logging
import os
import uuid

import boto3

from tenacity import retry, wait_fixed, wait_random, stop_after_attempt

from layer.cloudfront_service.types_ import *
from layer.common.constants_ import CONFIG_VERSION_TABLE
from layer.common.types_ import Cname
from layer.ddb_service.client import DynamoDbUtilsService
from layer.s3_service.client import S3UtilService


class CloudFrontUtilsService:

    def __init__(self, region: str = 'us-east-1', logging_level=logging.INFO, logger=None):
        self.client = boto3.client('cloudfront')
        if logger:
            self.logger = logger
        else:
            self.logger = logging.getLogger('boto3')
            self.logger.setLevel(logging_level)
        self.config_version_table = os.getenv(CONFIG_VERSION_TABLE)
        if not self.config_version_table:
            raise Exception('%s table not found', CONFIG_VERSION_TABLE)
        self.ddb_client = DynamoDbUtilsService(logger=self.logger)
        self.s3_client = S3UtilService(logger=logger)

    def validate_source_cloudfront_dist(self, cname_list: List[Cname]) -> bool:
        if cname_list is None or len(cname_list) == 0:
            raise Exception("Request missing existing_cf_info section which is not optional field"
                            "(example: {\"existing_cf_info\": {\"distribution_id\": \"E1J2U5I18F046Q\", "
                            "\"config_version_id\": \"1\"}})")
        for cname_index, cname_value in enumerate(cname_list):
            if 'existing_cf_info' in cname_value and cname_value['existing_cf_info']:
                source_cf_info = cname_value['existing_cf_info']
                dist_id = source_cf_info['distribution_id']
                if 'config_version_id' in source_cf_info and source_cf_info['config_version_id']:
                    # search the config ddb for source cloudfront config version
                    version_id = source_cf_info['config_version_id']
                    # get specific cloudfront distributions version info
                    response = self.ddb_client.get_item(table=self.config_version_table, key_values={
                        "distributionId": dist_id,
                        "versionId": int(version_id)
                    })
                    if not response or len(response) == 0:
                        self.logger.error("existing cf config with name: %s, version: %s does not exist", dist_id,
                                          version_id)
                        raise Exception(
                            "Failed to find existing config with name: %s, version: %s in cname_value: %s, index: %s",
                            dist_id, version_id, cname_value, cname_index)
                else:
                    # There is no config version info, just check whether cloudfront distribution exist
                    resp = self.get_distribution_by_id(
                        distribution_id=dist_id,
                    )
                    if 'Distribution' not in resp:
                        self.logger.error("Can not found source cloudfront distribution with id: %s", dist_id)
                        raise Exception("Can not found source cloudfront distribution with id: %s", dist_id)
            else:
                self.logger.error("Request missing existing_cf_info section which is not optional field"
                                  "(example: {\"existing_cf_info\": {\"distribution_id\": \"E1J2U5I18F046Q\", "
                                  "\"config_version_id\": \"1\"}})")
                raise Exception("Request missing existing_cf_info section which is not optional field"
                                "(example: {\"existing_cf_info\": {\"distribution_id\": \"E1J2U5I18F046Q\", "
                                "\"config_version_id\": \"1\"}})")
        return True

    def get_distribution_by_id(self, distribution_id: str) -> Distribution:
        resp = self.client.get_distribution(Id=distribution_id)
        # todo: check fail
        _named = GetDistributionOutput(**resp)
        return _named['Distribution']

    def get_distribution_config_by_distribution_id(self, distribution_id) -> DistributionConfig:
        resp = self.client.get_distribution_config(
            Id=distribution_id
        )
        named_ = GetDistributionConfigOutput(**resp)
        return named_['DistributionConfig']

    def fetch_cloudfront_config_version(self, distribution_id: str, version_id: str) -> DistributionConfig:
        data = self.ddb_client.get_item(self.config_version_table, {
            "distributionId": distribution_id,
            "versionId": int(version_id)
        })
        config_link = data['config_link']
        self.logger.info("target s3 link is " + config_link)
        content = self.s3_client.get_object(data['s3_bucket'], data['s3_key'])
        config = DistributionConfig(**content)
        return config

    def construct_cloudfront_config_with_version(self, certificate_arn: str = '', distribution_id: str = '',
                                                 distribution_version: str = '', sub_domain_name_list: List[str] = None) \
            -> DistributionConfig:
        config = self.fetch_cloudfront_config_version(distribution_id, distribution_version)
        config['CallerReference'] = str(uuid.uuid4())

        return self.construct_cloudfront_config(config, certificate_arn, sub_domain_name_list)

    def construct_cloudfront_config_with_dist_id(self, certificate_arn: str = '', distribution_id: str = '',
                                                 sub_domain_name_list: List[str] = None) -> DistributionConfig:
        config = self.get_distribution_config_by_distribution_id(distribution_id)
        config['CallerReference'] = str(uuid.uuid4())
        return self.construct_cloudfront_config(config, certificate_arn, sub_domain_name_list)

    def construct_cloudfront_config(self, template: DistributionConfig, certificate_arn: str,
                                    sub_domain_list: List[str]) -> DistributionConfig:
        if sub_domain_list is not None and len(sub_domain_list) > 0:
            template['Aliases']['Items'] = sub_domain_list
            template['Aliases']['Quantity'] = len(template['Aliases']['Items'])
        # config['DefaultRootObject'] = default_root_object
        # support single origin for now, will support multiple origin in future TBD
        # config['Origins']['Items'] = [
        #     {
        #         "Id": origins_items_id,
        #         "DomainName": origins_items_domain_name,
        #         "OriginPath": origins_items_origin_path,
        #         "CustomHeaders": {
        #             "Quantity": 0
        #         },
        #         "S3OriginConfig": {
        #             "OriginAccessIdentity": ""
        #         },
        #         "ConnectionAttempts": 3,
        #         "ConnectionTimeout": 10,
        #         "OriginShield": {
        #             "Enabled": False
        #         }
        #     }]
        # config['DefaultCacheBehavior']['TargetOriginId'] = default_cache_behavior_target_origin_id
        # config['DefaultCacheBehavior']['CachePolicyId'] = "658327ea-f89d-4fab-a63d-7e88639e58f6"
        if certificate_arn is not None and certificate_arn != '':
            template['ViewerCertificate'].pop('CloudFrontDefaultCertificate')
            template['ViewerCertificate']['ACMCertificateArn'] = certificate_arn
            template['ViewerCertificate']['MinimumProtocolVersion'] = 'TLSv1.2_2021'
            template['ViewerCertificate']['SSLSupportMethod'] = 'sni-only'
        # disable the logging for new cloudfront distribution
        template['Logging']['Enabled'] = False
        template['Logging']['IncludeCookies'] = False
        template['Logging']['Bucket'] = ''
        template['Logging']['Prefix'] = ''
        return template

    # create CloudFront distribution
    @retry(wait=wait_fixed(2) + wait_random(0, 2), stop=stop_after_attempt(100))
    def create_distribution_with_tags(self, config: DistributionConfigWithTags) -> Distribution:
        self.logger.info('Creating distribution with config: %s', json.dumps(config, default=str))
        resp = self.client.create_distribution_with_tags(
            DistributionConfigWithTags=config
        )
        self.logger.info('distribution start to create, ID: %s, ARN: %s, Domain Name: %s, with tags %s',
                         resp['Distribution']['Id'],
                         resp['Distribution']['ARN'], resp['Distribution']['DomainName'],
                         str(json.dumps(config['Tags'], default=str)))
        named_ = CreateDistributionWithTagsOutput(**resp)
        return named_['Distribution']

    def update_distribution(self, config: DistributionConfig, cloudfront_id: str, etag: str) -> Distribution:
        self.logger.info('Creating distribution with config: %s', json.dumps(config, default=str))
        resp = self.client.update_distribution(
            DistributionConfig=config,
            Id=cloudfront_id,
            IfMatch=etag
        )
        self.logger.info('distribution start to create, ID: %s, ARN: %s, Domain Name: %s',
                         resp['Distribution']['Id'],
                         resp['Distribution']['ARN'], resp['Distribution']['DomainName'])
        named_ = CreateDistributionWithTagsOutput(**resp)
        return named_['Distribution']
