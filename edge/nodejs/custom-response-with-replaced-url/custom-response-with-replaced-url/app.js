'use strict';
const { http, https } = require('follow-redirects');

//Url to be replaced, eg. https://www.original-domain.com
const originalUrl = 'PARA_OriginalUrl';
//CloudFront domain name, eg. https://d1y5cxh12zn4aj.cloudfront.net
const originalCFDomain = 'PARA_OriginalCFDomain';
const newUrl = 'PARA_NewUrl';


exports.handler = async (event, context, callback) => {
    const request = event.Records[0].cf.request;
    const response = event.Records[0].cf.response;
    var url = request.uri;

    //No operation is needed if the url is not a html or js
    if (!url.endsWith('.html') && !url.endsWith('.js')) {
        callback(null, request);
        return;
    }

    var isHttps = false;

    if (originalCFDomain.startsWith('https://')) {
        isHttps = true;
    } else if (originalCFDomain.startsWith('http://')) {
        isHttps = false;
    } else {
        const response400 = {
            status: '400',
            statusDescription: 'The url ' + originalCFDomain + ' is not started with http/https'
        };
        callback(null, response400);
        return;
    }

    var queryString = request.querystring;
    var targetUrl = originalCFDomain + url;
    if (queryString.length != 0) {
        targetUrl += '?' + queryString;
    }

    await getOriginalResponse(callback, response, targetUrl, isHttps);

};

async function getOriginalResponse(callback, resp, url, isHttps) {
    console.log("Get response from: " + url);
    console.log("ishttps: " + isHttps);
    
    var resp = {
        status: '200',
        statusDescription: 'OK',
        bodyEncoding: 'base64',
        headers: {
            'content-type': [{
                key: 'Content-Type',
                value: ''
            }],
            'accept-ranges': [{
                key: 'Accept-Ranges',
                value: 'bytes'
            }]
        },
        body: '',
    };

    if (isHttps) {
        return new Promise((resolve, reject) => {
            https.get(url, (response) => {
                let chunks_of_data = [];
                console.log("statusCode: ", response.statusCode);
                console.log("headers: ", response.headers);

                response.on('data', (fragments) => {
                    chunks_of_data.push(fragments);
                });

                response.on('end', () => {
                    let tempBody = Buffer.concat(chunks_of_data);
                    if (response.statusCode.toString() == '200') {
                        console.log("Get the original response successfully");

                        resp.body = updateBody(tempBody.toString('base64'));
                        resp.headers['content-type'] = [{ key: 'Content-Type', value: response.headers['content-type'] }];

                        callback(null, resp);
                    } else {
                        reject('Request failed. status: ' + response.statusCode.toString() + ', body: ' + tempBody.toString('base64'));
                    }
                });

                response.on('error', reject);
            });
        });
    } else {
        return new Promise((resolve, reject) => {
            http.get(url, (response) => {
                let chunks_of_data = [];
                console.log("statusCode: ", response.statusCode);
                console.log("headers: ", response.headers);

                response.on('data', (fragments) => {
                    chunks_of_data.push(fragments);
                });

                response.on('end', () => {
                    let tempBody = Buffer.concat(chunks_of_data);
                    if (response.statusCode.toString() == '200') {
                        console.log("Get the original response successfully");

                        resp.body = updateBody(tempBody.toString('base64'));
                        resp.headers['content-type'] = [{ key: 'Content-Type', value: response.headers['content-type'] }];

                        callback(null, resp);
                    } else {
                        reject('Request failed. status: ' + response.statusCode.toString() + ', body: ' + tempBody.toString('base64'));
                    }
                });

                response.on('error', reject);
            });
        });
    }
}

/**
 * Replace the original url with the new one
 * @param {*} oriBody 
 * @returns 
 */
function updateBody(oriBody) {
    var regex = new RegExp(originalUrl, "g");
    var newBody = oriBody.replace(regex, newUrl);

    return newBody;
}
