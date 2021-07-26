# URL redirects to the county-specific version of a site

**CloudFront Functions event type: viewer request**

This function redirects a user to a country-specific version of a site based on the country of the user. For example, if the user is in Germany, the function redirects the user to the `/de/index.html` page which is the Germany-specific version of the site. If the user is not in Germany, the request passes through with no modification to the URL.

This function makes use of the `Cloudfront-Viewer-Country` [geo-location header](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-cloudfront-headers.html#cloudfront-headers-viewer-location) which performs a lookup on the request to determine the user's country and includes that value in the `Cloudfront-Viewer-Country` request header. You can use any of the geo-location or [device detection](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-cloudfront-headers.html#cloudfront-headers-device-type) headers that are available from CloudFront. For the geo-location or device detection headers to appear in the request object within a function, you must allow these headers (or allow all viewer headers) in a CloudFront [origin request policy](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/controlling-origin-requests.html#origin-request-understand-origin-request-policy) or [cache policy](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/controlling-the-cache-key.html#cache-key-understand-cache-policy).

## Deployment

To deploy the stack, go to [CloudFront Extensions Workshop](https://awslabs.github.io/aws-cloudfront-extensions/#cloudfront-function), find the CloudFront Function and click **Deploy** button.

