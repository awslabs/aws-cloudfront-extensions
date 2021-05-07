from functions.lambda_edge_function import app


def test_stock_checker():
    stock_price = 75
    input_payload = {
        "Records": [
        {
            "cf": {
            "config": {
                "distributionDomainName": "d111111abcdef8.cloudfront.net",
                "distributionId": "EDFDVBD6EXAMPLE",
                "eventType": "origin-request",
                "requestId": "4TyzHTaYWb1GX1qTfsHhEqV6HUDd_BzoBZnwfnvQc_1oF26ClkoUSEQ=="
            },
            "request": {
                "clientIp": "203.0.113.178",
                "headers": {
                "x-forwarded-for": [
                    {
                    "key": "X-Forwarded-For",
                    "value": "203.0.113.178"
                    }
                ],
                "user-agent": [
                    {
                    "key": "User-Agent",
                    "value": "Amazon CloudFront"
                    }
                ],
                "via": [
                    {
                    "key": "Via",
                    "value": "2.0 2afae0d44e2540f472c0635ab62c232b.cloudfront.net (CloudFront)"
                    }
                ],
                "host": [
                    {
                    "key": "Host",
                    "value": "example.org"
                    }
                ],
                "cache-control": [
                    {
                    "key": "Cache-Control",
                    "value": "no-cache, cf-no-cache"
                    }
                ]
                },
                "method": "GET",
                "origin": {
                "custom": {
                    "customHeaders": {},
                    "domainName": "example.org",
                    "keepaliveTimeout": 5,
                    "path": "",
                    "port": 443,
                    "protocol": "https",
                    "readTimeout": 30,
                    "sslProtocols": [
                    "TLSv1",
                    "TLSv1.1",
                    "TLSv1.2"
                    ]
                }
                },
                "querystring": "",
                "uri": "/TV7038"
            }
            }
        }
        ]
    }

    data = app.lambda_handler(input_payload, "")

    assert "origin" in data
    assert "headers" in data