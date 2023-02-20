from typing import List, TypedDict


class ResponseMetadata(dict):
    pass


class SourceCfInfo(TypedDict):
    distribution_id: str
    config_version_id: str


class Cname(TypedDict):
    domainName:             str
    sanList:                List[str]
    originsItemsDomainName: str
    existing_cf_info:       SourceCfInfo


class Pem(TypedDict):
    CertPem: str
    PrivateKeyPem: str
    ChainPem: str
    existing_cf_info: SourceCfInfo
