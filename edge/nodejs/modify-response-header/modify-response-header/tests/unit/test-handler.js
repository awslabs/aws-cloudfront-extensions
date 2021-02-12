'use strict';

const app = require('../../app.js');
const chai = require('chai');
const expect = chai.expect;

var event = {
    "Records": [
      {
        "cf": {
          "response": {
             "status": "200",
             "headers": {
             }
          }
        }
      }
    ]
  };

describe('Tests modify response headers', function () {
    it('verifies the newly added header is in the response', async () => {
        const response = await app.handler(event)
        const modifiedValue = response.headers['headerToModify'][0].value
        console.log(modifiedValue)
        expect(modifiedValue).to.equal('modified header');
    });
});
