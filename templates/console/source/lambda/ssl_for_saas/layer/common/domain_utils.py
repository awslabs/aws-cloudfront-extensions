import json
import re


# domain name validation
from cerberus import Validator


def is_valid_domain(domain: str):
    """

    :param domain:
    :return:
    """
    if (domain is None) or domain.count('.') < 2:
        return False

    # accept domain format:
    # 1.mydomain.com
    # 1.2.mydomain.com
    # www.domain.com
    # *.domain.com

    # deny domain format:
    # www.mydom-ain-.com.uk
    # bad_domain.com
    # bad:domain.com
    # http://only.domains.com
    regex = r"^(\*\.)*(((?!-))(xn--|_{1,1})?[a-z0-9-]{0,61}[a-z0-9]{1,1}\.)*(xn--)?([a-z0-9][a-z0-9\-]{0,60}|[a-z0-9-]{1,30}\.[a-z]{2,})$"
    p = re.compile(regex)

    if re.search(p, domain):
        return True
    else:
        return False


# validate the input
def validate_input_parameters(input):
    string_type = {'type': 'string'}
    existing_cf_info_type = {
        'distribution_id': {'type': 'string', 'required': True},
        'config_version_id': {'type': 'string', 'required': False}
    }
    cnameInfo_type = {
        'type': 'dict',
        'schema': {
            'domainName': {'type': 'string', 'required': True},
            'sanList': {'type': 'list', 'schema': string_type, 'required': True},
            'existing_cf_info': {'type': 'dict', 'schema': existing_cf_info_type, 'required': True}
        }
    }
    pemInfo = {
        'type': 'dict',
        'schema': {
            'CertPem': {'type': 'string', 'required': True},
            'PrivateKeyPem': {'type': 'string', 'required': True},
            'ChainPem': {'type': 'string', 'required': True},
            'existing_cf_info': {'type': 'dict', 'schema': existing_cf_info_type}
        }
    }
    schema = {
        "acm_op": {"type": "string", 'required': True},
        "auto_creation": {"type": "string", 'required': True},
        'cnameList': {'type': 'list', 'schema': cnameInfo_type, 'required': False},
        'pemList': {'type': 'list', 'schema': pemInfo, 'required': False}
    }
    v = Validator(schema)
    v.allow_unknown = True
    if not v.validate(input):
        # raise Exception('Invalid input with error: ' + str(v.errors))
        raise Exception('Invalid input parameters: ' + json.dumps(v.errors))
