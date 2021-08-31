from modify_host_origin_request_header import app


def test_event():
    return {
        "Records": [
            {
                "cf": {
                    "config": {
                        "distributionId": "EXAMPLE"
                    },
                    "response": {
                        "status": "200",
                        "statusDescription": "OK",
                        "headers": {
                            "vary": [
                                {
                                    "key": "Vary",
                                    "value": "*"
                                }
                            ],
                            "last-modified": [
                                {
                                    "key": "Last-Modified",
                                    "value": "2016-11-25"
                                }
                            ],
                            "x-amz-meta-last-modified": [
                                {
                                    "key": "X-Amz-Meta-Last-Modified",
                                    "value": "2016-01-01"
                                }
                            ]
                        }
                    },
                    "request": {
                        "uri": "/test.mp4",
                        "querystring": "",
                        "method": "GET",
                        "clientIp": "2001:cdba::3257:9652",
                        "headers": {
                            "host": [
                                {
                                    "key": "Host",
                                    "value": "d123.cf.net"
                                }
                            ],
                            "range": [
                                {
                                    "key": "Range",
                                    "value": "bytes=0-4042343"
                                }
                            ]
                        }
                    }
                }
            }
        ]
    }


def test_lambda_handler():
    ret = app.lambda_handler(test_event(), "")
    assert ret['headers']['X-Amz-Meta-CloudFront-Prefetch-Urls'][0]['value'] == '/test.mp4'
