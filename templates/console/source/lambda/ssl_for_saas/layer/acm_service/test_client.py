# fixme: tests need to be move to test folder
from dataclasses import dataclass, field
from datetime import datetime
import json
import os
from typing import NamedTuple, Union, TypedDict
from unittest import TestCase

import pytest

from layer.acm_service.client import AcmUtilsService
from layer.common.constants_ import ACM_METADATA_TABLE, JOB_INFO_TABLE_NAME
from layer.common.response import to_json_serializable

os.environ.setdefault('AWS_PROFILE', 'cloudfront_ext')
os.environ.setdefault(ACM_METADATA_TABLE, 'cloudfront-extn-01-StepFunctionRpTsConstructacmmetadataAE01DAD1-NDRJLSR8R5DH')
os.environ.setdefault(JOB_INFO_TABLE_NAME, 'cloudfront-extn-01-StepFunctionRpTsConstructacmmetadataAE01DAD1-NDRJLSR8R5DH')


@dataclass
class MyTest:
    num_1: int = 0
    empty: str = field(default='')
    not_empty: str = ''
    not_empty_date: Union[datetime.time, None] = None


@pytest.mark.skip(reason="dev only")
class TestAcmUtilsClient(TestCase):
    def test_list_certificates(self):
        client = AcmUtilsService()

        # resp = client.list_certificates_raw()
        # print(resp)

        resp = client.list_certificates()
        client.close()
        print(resp)
        print(to_json_serializable(resp))
        print(type(resp))
        for key, val in resp[0].items():
            print("{}: {}".format(key, val))

        print(json.dumps(resp, default=str))
        # self.fail()
        self.assertEqual(1, 1, 'pass')

    def test_fetch_dcv_value(self):
        client = AcmUtilsService()
        resp = client.fetch_dcv_value('arn:aws:acm:us-east-1:${account_id}:certificate/2058456d-cf27-4409-aff9-eefefd1e87c3')
        print(resp)
        print(resp['CertificateArn'])
        self.assertEqual(1, 1, 'pass')
        client.close()

    def test_empty(self):
        hello = MyTest(not_empty_date=datetime.now())
        print(hello.not_empty_date)
        # print(json.dumps(hello.__dict__))

        event = {"num_1": 0, "empty": "", "not_empty": "test", "not_empty_date": "\"2022-11-17 20:20:48.615226\""}
        t = MyTest(**event)
        self._my_test(t)

    def _my_test(self, event: MyTest):
        print(event.num_1)
