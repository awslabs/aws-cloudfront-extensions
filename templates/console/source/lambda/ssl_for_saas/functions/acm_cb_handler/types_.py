from typing import TypedDict, List

from layer.common.types_ import Cname, Pem


class Event(TypedDict):
    input: Cname
