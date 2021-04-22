'use strict';

const app = require('../../app.js');
const chai = require('chai');
const expect = chai.expect;
var event, context;

var event200 = {
    "Records": [{
        "cf": {
            "config": {
                "distributionId": "EXAMPLE"
            },
            "request": {
                "uri": "/images/200x300/demo.png",
                "method": "GET",
                "headers": {
                    "host": [{
                        "key": "Host",
                        "value": "d123.cf.net"
                    }],
                    "user-agent": [{
                        "key": "User-Agent",
                        "value": "Test Agent"
                    }],
                    "user-name": [{
                        "key": "User-Name",
                        "value": "aws-cloudfront"
                    }]
                }
            },
            "response": {
                "status": "200",
                "statusDescription": "OK",
                "headers": {
                    "vary": [{
                        "key": "Vary",
                        "value": "*"
                    }],
                    "last-modified": [{
                        "key": "Last-Modified",
                        "value": "2016-11-25"
                    }],
                    "x-amz-meta-last-modified": [{
                        "key": "X-Amz-Meta-Last-Modified",
                        "value": "2016-01-01"
                    }]
                },
                "body": "test"
            }
        }
    }]
};

var eventJPG = {
    "Records": [{
        "cf": {
            "config": {
                "distributionId": "EXAMPLE"
            },
            "request": {
                "uri": "/images/200x300/demo.jpg",
                "method": "GET",
                "headers": {
                    "host": [{
                        "key": "Host",
                        "value": "d123.cf.net"
                    }],
                    "user-agent": [{
                        "key": "User-Agent",
                        "value": "Test Agent"
                    }],
                    "user-name": [{
                        "key": "User-Name",
                        "value": "aws-cloudfront"
                    }]
                }
            },
            "response": {
                "status": "404",
                "statusDescription": "OK",
                "headers": {
                    "vary": [{
                        "key": "Vary",
                        "value": "*"
                    }],
                    "last-modified": [{
                        "key": "Last-Modified",
                        "value": "2016-11-25"
                    }],
                    "x-amz-meta-last-modified": [{
                        "key": "X-Amz-Meta-Last-Modified",
                        "value": "2016-01-01"
                    }]
                }
            }
        }
    }]
};


var callback = function(request, response) {}

describe('Tests index', function() {
    it('verifies when image suffix is jpg', async () => {
        app.handler(eventJPG, context, function(error, data) {
            console.log(data); // request succeeded
            expect(data.body).to.not.be.null;
        });
    });

    it('verifies when response status code is 200', async () => {
        app.handler(event200, context, function(error, data) {
            console.log(data); // request succeeded
            expect(data.body).to.not.be.null;
        });
    });
});
