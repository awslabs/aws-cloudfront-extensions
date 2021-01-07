'use strict';

exports.handler = async (event, context) => {

    //Get contents of response
    const response = event.Records[0].cf.response;

    //Set new status code
    response.status = '500';

    return response;
};
