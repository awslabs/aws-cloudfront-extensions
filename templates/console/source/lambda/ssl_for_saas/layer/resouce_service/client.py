import logging
from typing import List

import boto3


class ResourceUtilService:

    def __init__(self, region='us-east-1', logging_level=logging.INFO, logger=None):
        if logger:
            self.logger = logger
        else:
            self.logger = logging.getLogger('boto3')
            self.logger.setLevel(logging_level)

        self.resource_client = boto3.client('resourcegroupstaggingapi', region_name='us-east-1')

    def get_resource_by_job_id(self, job_id) -> List[str]:
        resp = self.resource_client.get_resources(
            TagFilters=[
                {
                    'Key': 'job_token',
                    'Values': [
                        job_id,
                    ]
                },
            ],
            ResourcesPerPage=100,
            ResourceTypeFilters=[
                'cloudfront',
            ],
        )

        result = []
        # filter only the certificates with jobId in job_token tag
        for cloudfrontItem in resp['ResourceTagMappingList']:
            result.append(cloudfrontItem['ResourceARN'])
        return result
