'use strict';

const chai = require('chai');
const nock = require('nock');
const expect = chai.expect;

var event = {
    "Records": [
        {
            "cf": {
                "config": {
                    "distributionDomainName": "d1suubh45p2j23.cloudfront.net",
                    "distributionId": "E47R6YG117AJG8",
                    "eventType": "origin-request",
                    "requestId": "EGB0MM8wDDvfNdn_hgOmTji75-yw31g4eX1LWVKLVT29y_H7RjjDzQ=="
                },
                "request": {
                    "clientIp": "73.22.198.65",
                    "headers": {
                        "host": [
                            {
                                "key": "Host",
                                "value": "aws-test-bucket.s3.us-east-1.amazonaws.com"
                            }
                        ],
                        "x-forwarded-for": [
                            {
                                "key": "X-Forwarded-For",
                                "value": "10.118.195.44, 10.43.8.6, 72.21.198.65"
                            }
                        ],
                        "user-agent": [
                            {
                                "key": "User-Agent",
                                "value": "Amazon CloudFront"
                            }
                        ],
                        "accept-encoding": [
                            {
                                "key": "Accept-Encoding",
                                "value": "gzip"
                            }
                        ],
                        "upgrade-insecure-requests": [
                            {
                                "key": "Upgrade-Insecure-Requests",
                                "value": "1"
                            }
                        ],
                        "cache-control": [
                            {
                                "key": "Cache-Control",
                                "value": "max-age=0"
                            }
                        ]
                    },
                    "method": "GET",
                    "origin": {
                        "s3": {
                            "authMethod": "none",
                            "customHeaders": {},
                            "domainName": "aws-test-bucket.s3.us-east-1.amazonaws.com",
                            "path": ""
                        }
                    },
                    "querystring": "para1=123&para2=test",
                    "uri": "/index.html"
                }
            }
        }
    ]
};

var context;

var callback = function (request, response) {
    return response
}

describe('Test Custom Response', function () {

    before(function () {
        var fs = require('fs')
        fs.copyFileSync('app.js', 'appTmp.js');
        var inputFile = fs.readFileSync('app.js', 'utf8');
        var outputFile = inputFile.replace(/PARA_OriginalUrl/g, 'https://www.original-domain.com')
            .replace(/PARA_NewUrl/g, 'https://www.new-domain.com')
            .replace(/PARA_OriginalCFDomain/g, 'https://3.88.167.137');
        fs.writeFileSync('app.js', outputFile);
    });

    after(function () {
        var fs = require('fs')
        fs.copyFileSync('appTmp.js', 'app.js');
        fs.unlinkSync('appTmp.js');
        console.log('delete file successfully');
    });

    it('verifies successful response', async () => {
        const app = require('../../app.js');
        nock('https://3.88.167.137')
            .get('/index.html?para1=123&para2=test')
            .reply(200, {
                results: [{ name: 'Dominic' }],
            });

        app.handler(event, context, function (error, data) {
            if (error) {
                console.log(error); // an error occurred
            } else {
                console.log(data); // request succeeded
                expect(data.status).to.equal('200');
            }
        });
    });
});
