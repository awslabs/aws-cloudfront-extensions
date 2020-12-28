'use strict';

const { http, https } = require('follow-redirects');

exports.handler = (event, context, callback) => {
    const response = event.Records[0].cf.response;
    
    if (response.status == 200) {
        response.headers['location']
    }
    


    callback(null, response);
};