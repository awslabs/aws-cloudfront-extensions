from typing import TypedDict, List

from layer.common.types_ import Cname, Pem


class Input(TypedDict):
    aws_request_id: str
    acm_op: str
    auto_creation: str
    dist_aggregate: str
    enable_cname_check: str
    cnameList: List[Cname]
    pemList: List[Pem]


class Event(TypedDict):
    task_token: str
    input: Input
