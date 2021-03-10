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
              "referer": [
                {
                  "key": "referer",
                  "value": "https://github.com/awslabs/aws-cloudfront-extensions"
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

    });
});
