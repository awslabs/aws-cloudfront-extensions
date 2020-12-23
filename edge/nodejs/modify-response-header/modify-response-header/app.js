'use strict';

exports.handler = async (event) => {

    //Get contents of response
    const response = event.Records[0].cf.response;
    const headers = response.headers;

    //Modify or add headers
    headers['headerToModify'] = [{key: 'headerToModify', value: 'modified header'}];

    return response;
};
