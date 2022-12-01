import json
import logging
from typing import Any

import boto3


class S3UtilService:

    def __init__(self, region='us-east-1', logging_level=logging.INFO, logger=None):
        self.s3_client = boto3.client('s3')
        if logger:
            self.logger = logger
        else:
            self.logger = logging.getLogger('boto3')
            self.logger.setLevel(logging_level)

    def get_object(self, bucket: str, key: str) -> Any:
        data = self.s3_client.get_object(Bucket=bucket, Key=key)
        content = json.load(data['Body'])
        return content
