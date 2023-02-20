from typing import TypedDict, List

from layer.common.types_ import Cname, Pem


class InputValue(TypedDict):
    value: Cname
    aws_request_id: str


class Event(TypedDict):
    input: InputValue
