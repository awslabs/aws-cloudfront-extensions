import datetime
import logging
import os

import pytest

from layer.common.domain_utils import is_valid_domain, validate_input_parameters
from layer.common.file_utils import convert_string_to_file
from layer.common.response import to_json_serializable

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))

class TestCommon:

    def test_get_domain_list_from_cert(self, monkeypatch):
        from layer.common.cert_utils import get_domain_list_from_cert
        logger = logging.Logger('test')
        resp = get_domain_list_from_cert('notexist.pem', logger)
        assert resp is not None
        resp = get_domain_list_from_cert(f'{ROOT_DIR}/0000_key-certbot.pem', logger)
        assert resp is not None
        resp = get_domain_list_from_cert(f'{ROOT_DIR}/test_cert.pem', logger)
        assert resp is not None
        import layer.common.domain_utils as utils
        monkeypatch.setattr(utils, 'is_valid_domain', lambda *args, **kwargs: False)
        resp = get_domain_list_from_cert(f'{ROOT_DIR}/test_cert.pem', logger)
        assert resp is not None

    def test_is_valid_domain(self, monkeypatch):
        invalid_domains = [
            ''
            'www.mydom-ain-.com.uk',
            'bad_domain.com',
            'bad:domain.com',
            'http://only.domains.com',
        ]

        for d in invalid_domains:
            resp = is_valid_domain(d)
            assert not resp

        valid_domains = [
            '1.mydomain.com',
            '1.2.mydomain.com',
            'www.domain.com',
            '*.domain.com',
        ]

        for d in valid_domains:
            resp = is_valid_domain(d)
            assert resp

    def test_validate_input_parameters(self, monkeypatch):
        event = {
            "acm_op": "create",  # "import"
            "dist_aggregate": "false",
            "auto_creation": "true",
            "cnameList": [
                {
                    "domainName": "cdn2.risetron.cn",
                    "sanList": [
                        "cdn3.risetron.cn"
                    ],
                    "existing_cf_info": {
                        'distribution_id': '1'
                    },
                    "originsItemsDomainName": "risetron.s3.ap-east-1.amazonaws.com"
                },
                {
                    "domainName": "cdn3.risetron.cn",
                    "sanList": [
                        "cdn4.risetron.cn"
                    ],
                    "existing_cf_info": {
                        'distribution_id': '1'
                    },
                    "originsItemsDomainName": "risetron.s3.ap-east-1.amazonaws.com"
                }
            ],
            "pemList": [
                {
                    "CertPem": "xx",
                    "PrivateKeyPem": "xx",
                    "ChainPem": "xx"
                },
                {
                    "CertPem": "xx",
                    "PrivateKeyPem": "xx",
                    "ChainPem": "xx"
                }
            ]
        }
        validate_input_parameters(event)
        with pytest.raises(Exception):
            validate_input_parameters({})

    def test_convert_string_to_file(self, monkeypatch):
        convert_string_to_file('test', '.testfile_not_used')

    def test_to_json_serializable(self, monkeypatch):
        resp = to_json_serializable({
            'str': 'str',
            'number': 1,
            'bool': True,
            'list': ['str', 1, True, datetime.datetime.now()],
            'date': datetime.datetime.now()
        })
        assert resp is not None
