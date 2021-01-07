'use strict';

const app = require('../../app.js');
const chai = require('chai');
const expect = chai.expect;

var event = {
    "Records": [
      {
        "cf": {
          "response": {
             "status": "200"
          }
        }
      }
    ]
  };

describe('Tests modify response status code', function () {
    it('verifies the status code is 500 in the response', async () => {
        const response = await app.handler(event)
        const modifiedValue = response.status
        console.log(modifiedValue)
        expect(modifiedValue).to.equal('500');
    });
});
