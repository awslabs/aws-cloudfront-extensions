'use strict';

const AWS = require('aws-sdk');
const S3 = new AWS.S3({
    signatureVersion: 'v4',
});
const Sharp = require('sharp');

// set your S3 bucket name here
const BUCKET = 'PARA_S3BUCKET';

exports.handler = (event, context, callback) => {
    let response = event.Records[0].cf.response;
    console.log("Response status code: " + response.status);

    if (response.status == 404) {
        let request = event.Records[0].cf.request;

        // URI, Eg. /images/100x100/demo.png
        let path = request.uri;

        // remove the first character to get S3 key, Eg. images/100x100/demo.png
        let key = path.substring(1);

        // parse the prefix, width, height and image name
        // Eg: URI = https://www.amazon.com/images/100x100/demo.png
        // S3 originalKey = images/demo.png
        // S3 key = images/100x100/demo.png
        let prefix, originalKey, match, width, height, imageFormat, imageName;
        let startIndex;

        match = key.match(/(.*)\/(\d+)x(\d+)\/(.*)/);
        prefix = match[1];
        width = parseInt(match[2], 10);
        height = parseInt(match[3], 10);
        imageName = match[4];
        originalKey = prefix + "/" + imageName;
        imageFormat = imageName.split(".")[1];

        if (imageFormat == "jpg") {
            // no image/jpg in media types, convert it to image/jpeg
            imageFormat = "jpeg"
        }

        S3.getObject({
                Bucket: BUCKET,
                Key: originalKey
            }).promise()
            .then(data => Sharp(data.Body)
                .resize(width, height, {
                    fit: 'fill'
                })
                .toBuffer()
            )
            .then(buffer => {
                // save the resized object to S3 bucket
                S3.putObject({
                        Body: buffer,
                        Bucket: BUCKET,
                        ContentType: 'image/' + imageFormat,
                        CacheControl: 'max-age=31536000',
                        Key: key,
                        StorageClass: 'STANDARD'
                    }).promise()
                    // even if failing to save the object it will send the generated
                    // image back to viewer below
                    .catch(() => {
                        console.log("Exception while writing resized image to bucket")
                    });
                response.status = 200;
                response.body = buffer.toString('base64');
                response.bodyEncoding = 'base64';
                response.headers['content-type'] = [{
                    key: 'Content-Type',
                    value: 'image/' + imageFormat
                }];
                callback(null, response);
            });
    } else {
        // bypass when the status code is not 404
        callback(null, response);
    }
};
