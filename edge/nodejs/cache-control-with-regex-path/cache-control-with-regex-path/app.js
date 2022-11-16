'use strict';

const regexPath = 'PARA_REREX';
const responseHeader = 'PARA_RESPONSE_HEADER';
const responseHeaderValue = 'PARA_RESPONSE_HEADER_VALUE';

exports.handler = (event, context, callback) => {
    const response = event.Records[0].cf.response;
    const request = event.Records[0].cf.request;
    if (request.uri.match(regexPath))
    {
        response.headers[responseHeader] = [{
        key: responseHeader,
        value: responseHeaderValue
        }];
    }
    callback(null, response);
};
