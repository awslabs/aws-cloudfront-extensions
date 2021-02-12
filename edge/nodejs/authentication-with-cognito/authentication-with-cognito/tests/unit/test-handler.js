'use strict';

const chai = require('chai');
const expect = chai.expect;
var context;

var event = {
    "Records": [
      {
        "cf": {
          "config": {
            "distributionDomainName": "d111111abcdef8.cloudfront.net",
            "distributionId": "EDFDVBD6EXAMPLE",
            "eventType": "viewer-request",
            "requestId": "4TyzHTaYWb1GX1qTfsHhEqV6HUDd_BzoBZnwfnvQc_1oF26ClkoUSEQ=="
          },
          "request": {
            "clientIp": "203.0.113.178",
            "headers": {
              "authorization": [
                {
                  "key": "authorization",
                  "value": "Bearer eyJraWQiOiJGOEozWEwyYXNnWGQ4bkRna0hyXC9EZGp3UVJ3Y1YrQTRUbTdvSzA5TTlRVT0iLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiI3NGY4Y2ExMS1jY2M4LTQ4YWMtYmUyNy1mZmI0ZjEzNGViMGYiLCJldmVudF9pZCI6IjU5NTRhMTA1LTE1MDgtNGFlOS05OWI2LTZlYmI1YTg1NjdjNyIsInRva2VuX3VzZSI6ImFjY2VzcyIsInNjb3BlIjoiYXdzLmNvZ25pdG8uc2lnbmluLnVzZXIuYWRtaW4gb3BlbmlkIiwiYXV0aF90aW1lIjoxNjA5MzgwMjE3LCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAudXMtZWFzdC0xLmFtYXpvbmF3cy5jb21cL3VzLWVhc3QtMV9GWWxRYVplSUYiLCJleHAiOjE2MDkzODM4MTcsImlhdCI6MTYwOTM4MDIxNywidmVyc2lvbiI6MiwianRpIjoiMTRjN2I5ZjQtMzI0ZC00ZTczLTljMjEtMjgwMzc5YmU3ZDMyIiwiY2xpZW50X2lkIjoiN3E0aHBnZWNwczVvdnYzaXByajJrbGtnbzQiLCJ1c2VybmFtZSI6Im1pbmd0b25nLXRlc3QifQ.QfLCZ8ZzS9R35JvXQi_zg6dRrI-FFOBVfiBsVdQNGHPADkNPksPpEj5Rb_W2Yf6Ya1IvBKsuZlouK4M0bOhod5N-kIdO0x-hXeog5enIBVrTFE6sUjVRAczIgO3UdFmFgG930XkpAMwBN_IVMqKc1YiN81eUBby_zd2nBxUumyqx8e1HcJHSevic2BmFGUzVIYqJYD_S3GBk3tD9adtXNUaA3IA2dKXYUhlVu_1agxe8sPpKJb6KdYysYM_IimZcA9MW4cGCebcWYD1PRw6Sy3F8ov9gFNEdbGhGGVGN5rUNy2wBUa1YosTqTS83wpr8fwhwjkz3CYoJNKDnF_mi8Q"
                }
              ]
            },
            "method": "GET",
            "querystring": "",
            "uri": "/"
          }
        }
      }
    ]
  };

describe('Tests index', function () {
	before(function() {
		var fs = require('fs')
		fs.copyFileSync('app.js', 'appTmp.js');
		var inputFile = fs.readFileSync('app.js', 'utf8');
		var outputFile = inputFile.replace(/##USERPOOLID##/g, 'us-east-1_FYlQaZeIF')
						.replace(/##JWKS##/g, '{"keys":[{"alg":"RS256","e":"AQAB","kid":"lL/dZVXg7OcvxESLc5yY4VbQuX6T3d7TPfxr8MpPkhI=","kty":"RSA","n":"ichx4yK5JhWp0Gx8Rcz72m9HlU56XZWw5iEPlXph0QIWE5iieKGETrmYojD1U2Ri0LTSgUf0IyD0C8nr3UL3o_t9HHbAho8LMhBJa2OHK99y7aaellN01w6AtHVWF9uiM1WVTI7hKVzSOFiMus2w5xyQM4qAbSG00hkelTobkOUjO-2uVSvJ0hM57W-FACzCi1jJ-90DlL7m36iWuecOO6QZJxr3-cLsgNLNHjhBPUJZ6KamBd67-HfectbiRCWpGA4_IB_R7_clgANeyEll-HE1mb4ERHBPHNnE74Omos5Zrep5ZVaSY5L33ZQ-osJHjTeln3MlUxu7Gc8hGtnnBQ","use":"sig"},{"alg":"RS256","e":"AQAB","kid":"F8J3XL2asgXd8nDgkHr/DdjwQRwcV+A4Tm7oK09M9QU=","kty":"RSA","n":"l_hlG2hgEm0n6S4D1gU814WT3iwbUVvwAkSWcXa_iZXCjUCHIIKSjh0xA2IsX_QeHSkSK66LUofCDz5d4Kr4NUhP7J0B5f8dBN1iyozivphfPHXLVCIWu3b15E2zOxtTX9WkrZzfhpE3n8Zn5Jkt6DiC9t3K2ulajzJj29DPlTyJYSHc14zYE04H1jcIxetzD6pNGyrbyC9qyuncTkuxk-T5GMgd3u6QLME9Gr-izY5wNKq42sIGu1ZHop3xPONnUghIj1FYcbtPG_fPwQJF67TmUioRcp0x5InX4Bm4i4fZZyeaHhfVXd3tqMp4CqzZ5lyBXtnokANRcW-Q5pBKBw","use":"sig"}]}')
						.replace(/##COGNITOREGION##/g, 'us-east-1');
		fs.writeFileSync('app.js',outputFile);
	});

	after(function() {
		var fs = require('fs')
		fs.copyFileSync('appTmp.js', 'app.js');
		fs.unlinkSync('appTmp.js');
		console.log('delete file successfully');
	});

	it('verifies successful response', async () => {
		const app = require('../../app.js');
        // const result = await app.handler(event, context, callback)
        // console.log('result: ' + result);
        app.handler(event, context, function(error, data) {
          if (error) {
            console.log(error); // an error occurred
          } else {
            console.log(data); // request succeeded
            expect(data.status).to.equal('401');
          }
        });
    });
});