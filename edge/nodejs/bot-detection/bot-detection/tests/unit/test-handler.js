"use strict";

const app = require("../../app.js");
const chai = require("chai");
const expect = chai.expect;
var event, context;

var event200 = {
  Records: [
    {
      cf: {
        config: {
          distributionId: "EXAMPLE",
        },
        request: {
          uri: "/images/200x300/demo.jpg",
          method: "GET",
          headers: {
            host: [
              {
                key: "Host",
                value: "d123.cf.net",
              },
            ],
            "user-agent": [
              {
                key: "User-Agent",
                value: "googlebot",
              },
            ],
            "user-name": [
              {
                key: "User-Name",
                value: "aws-cloudfront",
              },
            ],
          },
        },
        response: {
          status: "200",
          statusDescription: "OK",
          headers: {
            vary: [
              {
                key: "Vary",
                value: "*",
              },
            ],
            "last-modified": [
              {
                key: "Last-Modified",
                value: "2016-11-25",
              },
            ],
            "x-amz-meta-last-modified": [
              {
                key: "X-Amz-Meta-Last-Modified",
                value: "2016-01-01",
              },
            ],
          },
        },
      },
    },
  ],
};

describe("Tests index", function () {
  it("verifies when it is a bot", async () => {
    app.handler(event200, context, function (error, data) {
      console.log(data); // request succeeded
      expect(data.headers["cache-control"]).to.not.be.null;
    });
  });
});
