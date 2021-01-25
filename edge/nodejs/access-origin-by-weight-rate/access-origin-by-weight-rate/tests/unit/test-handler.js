'use strict';

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
          "clientIp": "13.248.48.7",
          "headers": {
            "host": [
              {
                "key": "Host",
                "value": "abc.s3.amazonaws.com"
              }
            ],
            "x-forwarded-for": [
              {
                "key": "X-Forwarded-For",
                "value": "13.248.48.7"
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
                "value": "1.1 c04988d1502b07df372730fda32777f1.cloudfront.net (CloudFront)"
              }
            ],
            "accept-encoding": [
              {
                "key": "Accept-Encoding",
                "value": "gzip"
              }
            ]
          },
          "method": "GET",
          "origin": {
            "s3": {
              "authMethod": "none",
              "customHeaders": {},
              "domainName": "abc.s3.amazonaws.com",
              "path": ""
            }
          },
          "querystring": "",
          "uri": ""
        }
      }
    }
  ]
};
var context;

describe('Tests index', function () {
  before(function() {
    var fs = require('fs')
    fs.copyFileSync('app.js', 'appTmp.js');
    var inputFile = fs.readFileSync('app.js', 'utf8');
    var outputFile = inputFile.replace(/INPUT_ORIGIN_LIST/g, "[{ rating: 5, domain: 'mingtong-update-config.s3.amazonaws.com'}]");
    fs.writeFileSync('app.js',outputFile);
  });

  after(function() {
    var fs = require('fs')
    fs.copyFileSync('appTmp.js', 'app.js');
    fs.unlinkSync('appTmp.js');
    console.log('delete file successfully');
  });

  it('verifies successful request', async () => {
    const app = require('../../app.js');
    app.handler(event, context, function(error, data) {
      if (error) {
        console.log(error); // an error occurred
      } else {
        console.log(data); // request succeeded
        expect(data.origin.s3.domainName).to.equal('mingtong-update-config.s3.amazonaws.com');
        expect(data.headers['host'][0].value).to.equal('mingtong-update-config.s3.amazonaws.com');
      }
    });
  });
});
