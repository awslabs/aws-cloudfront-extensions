'use strict';

const app = require('../../app.js');
const chai = require('chai');
const expect = chai.expect;

var event = {
    "Records": [
      {
        "cf": {
          "config": {
            "distributionDomainName": "d111111abcdef8.cloudfront.net",
            "distributionId": "EDFDVBD6EXAMPLE",
            "eventType": "viewer-request",
            "requestId": "4TyzHTaYWb1GX1qTfsHhEqV6HUDd_BzoBZnwfnvQc_1oF26ClkoUSEQ=="
          },
          "response": {
            "clientIp": "203.0.113.178",
            "headers": {
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
  };


describe('Tests index', function () {
    it('verifies successful response', async () => {
        const response = await app.handler(event)
        console.log(response.headers['strict-transport-security'][0].value )

        expect(response.headers['strict-transport-security'][0].value).to.equal('max-age=31536000; includeSubDomains');
        expect(response.headers['x-frame-options'][0].value).to.equal('DENY');
        // expect(result.body).to.be.an('string');
        // let response = JSON.parse(result.body);
        // expect(response).to.be.an('object');

    });
});
