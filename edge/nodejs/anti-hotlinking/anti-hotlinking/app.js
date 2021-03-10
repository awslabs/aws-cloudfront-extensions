'use strict';

const refererParaList = 'PARA_REFERERLIST';

exports.handler = (event, context, callback) => {
	console.log('Event: ', JSON.stringify(event, null, 2));

	const request = event.Records[0].cf.request;
	const headers = request.headers;
	const refererValue = (((headers.referer || [])[0]) || {'value' : ''})['value'].split('/')[2];
	console.log('Referer: ' + refererValue);
	var allowList = refererParaList.split(',');

	for (var i = 0; i < allowList.length; i++) {
		console.log(allowList[i]);
		if (matchWildCard(refererValue, allowList[i])) {
			console.log('The request is allowed');
			return callback(null, request);
		}
	}

	console.log('match wild card: ' + matchWildCard('www.example.com', '*.example.*'));

	const response = {
		status: '403',
		statusDescription: 'Forbidden',
		body: 'Access Denied\n'
	}

	callback(null, response);
};


/* Check whether the string match the pattern, it supports wild card * and ?
 * For example: (www.example.com, *.example.com) -> true, (www.example.cn, *.example.com) -> false
 */
function matchWildCard(target, pattern) {
	const targetLen = target.length;
	const pLen = pattern.length;

	const dp = new Array(targetLen + 1);
	for (let i = 0; i < targetLen + 1; i++) {
		dp[i] = new Array(pLen + 1).fill(false);
	}

	dp[0][0] = true;
	for (let j = 1; j <= pLen; j++) {
		dp[0][j] = pattern[j - 1] == '*' && dp[0][j - 1];
	}

	for (let i = 1; i <= targetLen; i++) {
		for (let j = 1; j <= pLen; j++) {
			if (pattern[j - 1] == '?' || target[i - 1] == pattern[j - 1])
				dp[i][j] = dp[i - 1][j - 1];
			else if (pattern[j - 1] == '*' && (dp[i - 1][j] || dp[i][j - 1]))
				dp[i][j] = true;
		}
	}

	return dp[targetLen][pLen];
}
