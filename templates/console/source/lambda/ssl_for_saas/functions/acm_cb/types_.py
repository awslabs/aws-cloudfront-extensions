from typing import TypedDict, List, Any

from layer.common.types_ import Cname, Pem


class CloudFrontInfo(TypedDict):
    distributionId: str
    distributionArn: str
    distributionDomainName: str
    aliases: Any


class Payload(TypedDict):
    body: CloudFrontInfo


class PayloadContainer(TypedDict):
    Payload: Payload


class MapInput(Cname):
    fn_cloudfront_bind: PayloadContainer


class Input(TypedDict):
    aws_request_id: str
    acm_op: str
    auto_creation: str
    dist_aggregate: str
    enable_cname_check: str
    cnameList: List[Cname]
    pemList: List[Pem]
    fn_acm_cb_handler_map: List[MapInput]


class Event(TypedDict):
    task_token: str
    input: Input
