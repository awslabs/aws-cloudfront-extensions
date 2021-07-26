import pytest
from edge.python.prewarm.prewarm import app


@pytest.fixture()
def test_event():
    return {
        "key1": "value1",
        "key2": "value2",
        "key3": "value3"
    }


def test_lambda_handler():
    ret = app.lambda_handler(test_event, "")
    assert "statusCode" in ret
    assert "failed_count" in ret["body"]
    assert "failed_url" in ret["body"]
