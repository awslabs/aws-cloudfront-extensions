'use strict';
var weightedRandom = require('weighted-random');
 
var originList = INPUT_ORIGIN_LIST;
 
var weights = originList.map(function (originList) {
    return originList.rating;
}); 

/* This is an origin request function */
exports.handler = (event, context, callback) => {
    console.log('Handler start!');
    const request = event.Records[0].cf.request;

    //select origin according to weight rate
    var selectionIndex = weightedRandom(weights);
    var selectionDomain = originList[selectionIndex].domain;

    console.log('domain: ' + selectionDomain);
    
    //change origin domain
    request.origin.s3.domainName = selectionDomain;
    request.headers['host'] = [{key: 'Host', value: selectionDomain}];

    callback(null, request);
};