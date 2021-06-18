from modify_host_origin_request_header import app

def test_event():
    return {
        "Records": [
            {
                "cf": {
                    "request": {
                        "headers": {
                            "host": [
                                {
                                    "key": "Host",
                                    "value": "xxx.agilewing-demo.net"
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
    assert ret['headers']['host'][0]['value'] == 'ORIGIN_DOMAIN'
