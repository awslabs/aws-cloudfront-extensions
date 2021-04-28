'use strict';

const ALLOW_ORIGIN = 'PARA_ORIGIN';

exports.handler = (event, context, callback) => {

    const response = event.Records[0].cf.response;
    const headers = response.headers;
    headers['access-control-allow-origin'] = [{
        key: 'Access-Control-Allow-Origin',
        value: ALLOW_ORIGIN
    }];
    headers['access-control-allow-headers'] = [{
        key: 'Access-Control-Allow-Headers',
        value: 'Content-Type'
    }];
    headers['access-control-allow-methods'] = [{
        key: 'Access-Control-Allow-Methods',
        value: 'OPTIONS,POST,GET'
    }];

    callback(null, response);
};
