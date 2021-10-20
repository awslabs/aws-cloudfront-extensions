import pytest
from geo_traffic_blocker import app


@pytest.fixture()
def cn_access():
    """ Generates Cloudfront Event"""

    return {
        "Records": [
            {
                "cf": {
                    "config": {
                        "distributionDomainName": "d111111abcdef8.cloudfront.net",
                        "distributionId": "EDFDVBD6EXAMPLE",
                        "eventType": "viewer-request",
                        "requestId": "4TyzHTaYWb1GX1qTfsHhEqV6HUDd_BzoBZnwfnvQc_1oF26ClkoUSEQ=="
                    },
                    "request": {
                        "clientIp": "116.232.53.159",
                        "headers": {
                            "cloudfront-viewer-country": [
                                {
                                    "key": "country",
                                    "value": "CN"
                                }
                            ],
                            "host": [
                                {
                                    "key": "Host",
                                    "value": "d111111abcdef8.cloudfront.net"
                                }
                            ],
                            "user-agent": [
                                {
                                    "key": "User-Agent",
                                    "value": "curl/7.66.0"
                                }
                            ],
                            "accept": [
                                {
                                    "key": "accept",
                                    "value": "*/*"
                                }
                            ]
                        },
                        "method": "GET",
                        "querystring": "",
                        "uri": "/"
                    }
                }
            }
        ]
    }


@pytest.fixture()
def hk_access():
    """ Generates Cloudfront Event"""

    return {
        "Records": [
            {
                "cf": {
                    "config": {
                        "distributionDomainName": "d111111abcdef8.cloudfront.net",
                        "distributionId": "EDFDVBD6EXAMPLE",
                        "eventType": "viewer-request",
                        "requestId": "4TyzHTaYWb1GX1qTfsHhEqV6HUDd_BzoBZnwfnvQc_1oF26ClkoUSEQ=="
                    },
                    "request": {
                        "clientIp": "175.45.20.138",
                        "headers": {
                            "cloudfront-viewer-country": [
                                {
                                    "key": "country",
                                    "value": "CN"
                                }
                            ],
                            "host": [
                                {
                                    "key": "Host",
                                    "value": "d111111abcdef8.cloudfront.net"
                                }
                            ],
                            "user-agent": [
                                {
                                    "key": "User-Agent",
                                    "value": "curl/7.66.0"
                                }
                            ],
                            "accept": [
                                {
                                    "key": "accept",
                                    "value": "*/*"
                                }
                            ]
                        },
                        "method": "GET",
                        "querystring": "",
                        "uri": "/"
                    }
                }
            }
        ]
    }


@pytest.fixture()
def mo_access():
    """ Generates Cloudfront Event"""

    return {
        "Records": [
            {
                "cf": {
                    "config": {
                        "distributionDomainName": "d111111abcdef8.cloudfront.net",
                        "distributionId": "EDFDVBD6EXAMPLE",
                        "eventType": "viewer-request",
                        "requestId": "4TyzHTaYWb1GX1qTfsHhEqV6HUDd_BzoBZnwfnvQc_1oF26ClkoUSEQ=="
                    },
                    "request": {
                        "clientIp": "122.100.160.253",
                        "headers": {
                            "cloudfront-viewer-country": [
                                {
                                    "key": "country",
                                    "value": "CN"
                                }
                            ],
                            "host": [
                                {
                                    "key": "Host",
                                    "value": "d111111abcdef8.cloudfront.net"
                                }
                            ],
                            "user-agent": [
                                {
                                    "key": "User-Agent",
                                    "value": "curl/7.66.0"
                                }
                            ],
                            "accept": [
                                {
                                    "key": "accept",
                                    "value": "*/*"
                                }
                            ]
                        },
                        "method": "GET",
                        "querystring": "",
                        "uri": "/"
                    }
                }
            }
        ]
    }


@pytest.fixture()
def tw_access():
    """ Generates Cloudfront Event"""

    return {
        "Records": [
            {
                "cf": {
                    "config": {
                        "distributionDomainName": "d111111abcdef8.cloudfront.net",
                        "distributionId": "EDFDVBD6EXAMPLE",
                        "eventType": "viewer-request",
                        "requestId": "4TyzHTaYWb1GX1qTfsHhEqV6HUDd_BzoBZnwfnvQc_1oF26ClkoUSEQ=="
                    },
                    "request": {
                        "clientIp": "134.208.0.0",
                        "headers": {
                            "cloudfront-viewer-country": [
                                {
                                    "key": "country",
                                    "value": "CN"
                                }
                            ],
                            "host": [
                                {
                                    "key": "Host",
                                    "value": "d111111abcdef8.cloudfront.net"
                                }
                            ],
                            "user-agent": [
                                {
                                    "key": "User-Agent",
                                    "value": "curl/7.66.0"
                                }
                            ],
                            "accept": [
                                {
                                    "key": "accept",
                                    "value": "*/*"
                                }
                            ]
                        },
                        "method": "GET",
                        "querystring": "",
                        "uri": "/"
                    }
                }
            }
        ]
    }


def test_lambda_handler_cn(cn_access):
    ret = app.lambda_handler(cn_access, "")
    assert ret["status"] == '403'


def test_lambda_handler_hk(hk_access):
    ret = app.lambda_handler(hk_access, "")
    assert ret["headers"]["host"][0]['value'] == 'd111111abcdef8.cloudfront.net'


def test_lambda_handler_mo(mo_access):
    ret = app.lambda_handler(mo_access, "")
    assert ret["headers"]["host"][0]['value'] == 'd111111abcdef8.cloudfront.net'


def test_lambda_handler_tw(tw_access):
    ret = app.lambda_handler(tw_access, "")
    assert ret["headers"]["host"][0]['value'] == 'd111111abcdef8.cloudfront.net'
