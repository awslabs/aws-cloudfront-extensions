'use strict';

exports.handler = async (event) => {
    console.log('Event: ', JSON.stringify(event, null, 2));

    const response = event.Records[0].cf.response;

    /* Add HTTP Strict Transport Security to enforce HTTPS
     * See https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security
     *
     * Strict-Transport-Security: max-age=31536000; includeSubDomains
     */
    response.headers['strict-transport-security'] = [{ value: 'max-age=31536000; includeSubDomains' }];

    /* Add Content-Security-Policy header to mitigate XSS.
     * See https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
     *
     * Content-Security-Policy: default-src https: 'self'
     */
    response.headers['content-security-policy'] = [{ value: "default-src 'self'" }];

    /* Add browser side XSS protection (for older browsers without CSP)
     * See https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-XSS-Protection
     * 
     * X-XSS-Protection: 1; mode=block
     */
    response.headers['x-xss-protection'] = [{ value: '1; mode=block' }];

    /* Add MIME-type sniffing protection (also helps with XSS)
     * See https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options
     * 
     * X-Content-Type-Options: nosniff
     */
    response.headers['x-content-type-options'] = [{ value: 'nosniff' }];

    /* Add X-Frame-Options to disable framing and mitigate clickjacking
     * See https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options
     *
     * X-Frame-Options: DENY
     */
    response.headers['x-frame-options'] = [{ value: 'DENY' }];

    return response;
};