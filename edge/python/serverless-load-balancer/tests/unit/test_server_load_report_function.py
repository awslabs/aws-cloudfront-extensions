from functions.server_load_report_function import app


def test_stock_checker():
    stock_price = 25
    input_payload = {
        "Records": [
        {
            "messageId": "19dd0b57-b21e-4ac1-bd88-01bbb068cb78",
            "receiptHandle": "MessageReceiptHandle",
            "body": "{\"ip\": \"44.239.121.112\", \"requests_active\": \"500\", \"requests_new\": \"5\", \"network_out\": \"100\", \"network_in\": \"50\", \"cpu_usage\": \"30\",\"dns\": \"ec2-44-239-121-112.us-west-2.compute.amazonaws.com\", \"mem_usage\": \"50\"}",
            "attributes": {
            "ApproximateReceiveCount": "1",
            "SentTimestamp": "1523232000000",
            "SenderId": "123456789012",
            "ApproximateFirstReceiveTimestamp": "1523232000001"
            },
            "messageAttributes": {},
            "md5OfBody": "{{{md5_of_body}}}",
            "eventSource": "aws:sqs",
            "eventSourceARN": "arn:aws:sqs:us-east-1:123456789012:MyQueue",
            "awsRegion": "us-east-1"
        }
        ]
    }

    data = app.lambda_handler(input_payload, "")

    assert "RequestId" in data

    assert data["HTTPStatusCode"] == 200
    assert data["RetryAttempts"] == 0
    
