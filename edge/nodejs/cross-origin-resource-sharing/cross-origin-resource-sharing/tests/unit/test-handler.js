'use strict';

const app = require('../../app.js');
const chai = require('chai');
const expect = chai.expect;

var event = {
    "Records": [{
        "cf": {
            "response": {
                "status": "200",
                "headers": {}
            }
        }
    }]
};

describe('Tests CORS', function() {
    it('verifies the newly added header is in the response', async () => {
        app.handler(event, context, function(error, data) {
            if (error) {
                console.log(error); // an error occurred
            } else {
                expect(data.headers['access-control-allow-headers'][0].value).to.not.be.null;
            }
        });
    });

});
