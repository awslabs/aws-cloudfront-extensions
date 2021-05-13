'use strict';
const logger = require('console-log-level')({level: 'info'});
const querystring = require('querystring');
const crypto = require('crypto');
const Response403 = {
    status: 403,
    statusDescription: 'Access Denied'
};
//Set the secret key, for example '1234567'
const privateKey = '1234567';
//Set the seconds of expiration time , for example, if you set the access time to 2020-08-15 15:00:00, the link will actually expire at 2020-08-15 15:30:00.
const expirationTime = 30 * 60

exports.handler = async (event) => {
    try {
        let request = event.Records[0].cf.request;
        let params = querystring.parse(request.querystring);
        logger.debug('request:' + JSON.stringify(request));

        //1.get the parameter 'auth_key' from uri
        let uri = request.uri;
        if (!params["auth_key"]) {
            throw {"errorMessage": "parameter auth_key doesn't exist"};
        }

        //2.get the parameter from 'auth_key' values
        let authKey = params["auth_key"];
        let authKeyParams = authKey.split("-");
        if (isNaN(authKeyParams[0])) {
            throw {"errorMessage": "parameter timestamp is error"}
        }
        let timestamp = parseInt(authKeyParams[0]);
        let rand = authKeyParams[1];
        let uid = authKeyParams[2];
        let md5hash = authKeyParams[3];

        //3.validate time
        let nowTimestamp = parseInt(new Date().getTime() / 1000);
        if (timestamp + expirationTime < nowTimestamp) {
            throw {"errorMessage": "time is expired"}
        }

        //4.validate md5
        let sString = uri + '-' + timestamp + '-' + rand + '-' + uid + '-' + privateKey;
        let hashValue = crypto.createHash('md5').update(sString).digest("hex");
        logger.debug(timestamp, nowTimestamp, rand, uid, md5hash, sString, hashValue);

        if (hashValue != md5hash) {
            throw {"errorMessage": "validate failed"};
        }
        return request;
    } catch (err) {
        logger.debug(err);
        return Response403;
    }
};