'use strict';
const {http, https} = require('follow-redirects');

 const originIPList = 'PARA_ORIGINIPLIST';
 const originProtocol = 'PARA_ORIGINPROTOCOL';

//global varialbes for saving the retry status and body
var retrySucceed = false;
var retrybody = "";
var retryHeader ="";
var retryContentType = "";
var retryContentLength = 0;
var sentTime = 0;

exports.handler = (event, context, callback) => {
    retrySucceed = false;
    retrybody = "";
    retryHeader ="";
    retryContentType = "";
    retryContentLength = 0;
    sentTime = 0

    const request = event.Records[0].cf.request;
    const response = event.Records[0].cf.response;

    var ipList = originIPList.split(';');
    var url = request.uri;
    var queryString = request.querystring;

    //No need to try other IPs since the response is 200
    if (response.status == 200) {
        console.log("origin response is 200, just return original response");
        callback(null, response);
        return;
    }

    getData(callback, request, response, originProtocol, ipList);

};

function getResponse(url){
    var isHttps = (url.substring(0, 5) == "https");

    if (isHttps) {
        https.get(url, (response) => {
            let chunks_of_data = [];

            console.log("statusCode: ", response.statusCode);
            console.log("headers: ", response.headers);

            response.on('data', (fragments) => {
                chunks_of_data.push(fragments);
            });

            response.on('end', () => {
                let response_body = Buffer.concat(chunks_of_data);
                sentTime++;
                if (response.statusCode.toString() == '200') {
                    console.log("got 200, set the retrySucceed to true");
                    retrySucceed = true;
                    retrybody=response_body;
                    retryHeader=response.headers;
                    retryContentType = response.headers['content-type'];
                    retryContentLength = response.headers['content-length'];
                }else{
                    return;
                }
            });

            response.on('error', (error) => {
                // reject(error);
            });
        });
    } else {
        http.get(url, (response) => {
            let chunks_of_data = [];

            console.log("statusCode: ", response.statusCode);
            console.log("headers: ", response.headers);

            response.on('data', (fragments) => {
                chunks_of_data.push(fragments);
            });

            response.on('end', () => {
                let response_body = Buffer.concat(chunks_of_data);
                sentTime++;
                if (response.statusCode.toString() == '200') {
                    console.log("got 200, set the retrySucceed to true");
                    retrySucceed = true;
                    retrybody=response_body;
                    retryHeader=response.headers;
                    retryContentType = response.headers['content-type'];
                    retryContentLength = response.headers['content-length'];
                }else{
                    return;
                }
            });

            response.on('error', (error) => {
                // reject(error);
            });
        });
    }
}
function makeRetryRequest(originProtocol, url, queryString, ipList) {
    try {
        for (var i = 0; i < ipList.length; i++) {
            var http_url = originProtocol + "://" + ipList[i] + url + queryString;
            console.log(http_url);
            getResponse(http_url);
        }
    } catch (error) {
        console.log(error);
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function  getData(callbackdata, request, response, originProtocol, ipList) {

    var url = request.uri;
    var queryString = request.querystring;

    makeRetryRequest(originProtocol, url, queryString, ipList);

    console.log("########Wait start");
    while(retrySucceed !=true && sentTime<ipList.length){
        console.log("guming debug>> wait, "+sentTime);
        await sleep(100);
    }
    console.log("########Wait end");

    if (retrySucceed != true) {
        //all the IP request are not succeed, just return the original response
        console.log("All candidate fetch are fail, just return original response");
        callbackdata(null, response);
    } else {
        console.log("Found candidate fetch  succeed, just return");

        response.status = 200;
        response.statusDescription = "OK";
        response.body = retrybody.toString('base64');
        response.bodyEncoding = 'base64';
        response.headers['content-type'] = [{ key: 'Content-Type', value: retryContentType }];
        response.headers['content-length'] = [{ key: 'Content-Length', value: retryContentLength }];
        response.headers['accept-ranges'] = [{ key: 'Accept-Ranges', value: 'bytes' }];

        callbackdata(null, response);
    }
}
