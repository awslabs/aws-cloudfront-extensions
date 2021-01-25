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
          "request": {
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
            "querystring": "color=red&size=large&Age=13",
            "uri": "/"
          }
        }
      }
    ]
  };
var context;

describe('Tests index', function () {
    it('verifies successful response', async () => {
        app.handler(event, context, function(error, data) {
          if (error) {
            console.log(error); // an error occurred
          } else {
            console.log(data.querystring); // request succeeded
            expect(data.querystring).to.equal('age=13&color=red&size=large');
          }
        });        

    });
});
