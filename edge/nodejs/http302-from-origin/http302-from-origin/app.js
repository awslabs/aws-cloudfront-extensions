'use strict';

const { http, https } = require('follow-redirects');


exports.handler = (event, context, callback) => {
    const response = event.Records[0].cf.response;
    getData(function(data){
        const newResponse = {
            status: '200',
            statusDescription: 'OK',
            headers: {
                'cache-control': [{
                    key: 'Cache-Control',
                    value: 'max-age=100'
                }],
                'content-type': [{
                    key: 'Content-Type',
                    value: 'text/html'
                }]
            },
            body: data,
        };
        console.log(newResponse)
        callback(null, newResponse);
    }, response);

    
};


function getData(callbackData, response) {
    var content=[], url, isHttps;

    var callback = function(res) {
        res.on('data', chunk => {
            content.push(chunk);
        });
        res.on('end', function() {
            callbackData(content);
        });
    }

    if (response.status == 302 && response.headers['location']!=0) {
        url = response.headers['location'][0].value;
        isHttps = (url.substring(0,5)=="https");

        if (isHttps) {
            https.get(url, callback).on('error', err => {
                console.error(err);
            });
        } else {
            http.get(url, callback).on('error', err => {
                console.error(err);
            });

        }

    }
}