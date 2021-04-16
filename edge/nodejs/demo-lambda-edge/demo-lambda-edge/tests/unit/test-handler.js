'use strict';

const app = require('../../app.js');
const chai = require('chai');
const expect = chai.expect;
var event, context;

var callback = function(request, response) {}

describe('Tests index', function () {
    it('verifies successful response', async () => {
        const result = await app.handler(event, context, callback)
        expect(result).to.undefined;
        
        // expect(result.status).to.equal(200);
        // expect(result.body).to.be.an('string');
        // let response = JSON.parse(result.body);
        // expect(response).to.be.an('object');

    });
});
