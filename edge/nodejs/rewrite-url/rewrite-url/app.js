'use strict';

var originList = INPUT_URL_MAPPING;
 
exports.handler = (event, context, callback) => {
    const request = event.Records[0].cf.request;

    var originalDomain = request.origin.custom.domainName;
    var newDomain = originList[originalDomain];

    console.log('Original domain: ' + originalDomain + '\t New domain: ' + newDomain);
    
    request.origin.custom.domainName = newDomain;
    request.headers['host'] = [{key: 'Host', value: newDomain}];

    callback(null, request);
};