'use strict';

const chai = require('chai');
const nock = require('nock');
const expect = chai.expect;

var event = {
    "Records": [
        {
            "cf": {
                "config": {
                    "distributionId": "EXAMPLE"
                },
                "response": {
                    "status": "403",
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
                    "uri": "/code.txt",
                    "querystring": "",
                    "method": "GET",
                    "clientIp": "2001:cdba::3257:9652",
                    "headers": {
                        "host": [
                            {
                                "key": "Host",
                                "value": "d123.cf.net"
                            }
                        ]
                    }
                }
            }
        }
    ]
};
var context;

var callback = function (request, response) {
    return response
}

describe('Test Multiple IP retry', function () {

    before(function () {
        var fs = require('fs')
        fs.copyFileSync('app.js', 'appTmp.js');
        var inputFile = fs.readFileSync('app.js', 'utf8');
        var outputFile = inputFile.replace(/PARA_ORIGINIPLIST/g, '3.88.167.137;52.73.214.30')
            .replace(/PARA_ORIGINPROTOCOL/g, 'http');
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
        nock('http://3.88.167.137')
            .get('/code.txt')
            .reply(200, {
                results: [{name: 'Dominic'}],
            });

        nock('http://52.73.214.30')
            .get('/code.txt')
            .reply(200, {
                results: [{name: 'Dominic'}],
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
