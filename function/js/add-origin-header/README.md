# Add Origin header if missing

**CloudFront Functions event type: viewer request**

This function adds an [origin](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Origin) header if it is not present in the incoming request. The `Origin` header is part of [Cross-Origin Resource Sharing](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) (CORS), a mechanism using HTTP headers to tell browsers to give a web application running at one origin access to selected resources from a different origin.

In order for your origin to receive the `Origin` header, you must specifically allow the `Origin` header (or allow all viewer headers) in a CloudFront [origin request policy](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/controlling-origin-requests.html#origin-request-understand-origin-request-policy). Without adding this header in an origin request policy, CloudFront removes the `Origin` header before sending requests to your origin.

If your origin doesn't respond with CORS headers(e.g. the Access-Control-Allow-Origin header), then this function is not required.

## Deployment

To deploy the stack, go to [CloudFront Extensions Workshop](https://awslabs.github.io/aws-cloudfront-extensions/#cloudfront-function), find the CloudFront Function and click **Deploy** button.

