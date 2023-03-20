# Add Cache-Control header

**CloudFront Functions event type: viewer response**

This function adds a `Cache-Control` header that is sent to the browser in the response from CloudFront. If your origin does not send a `Cache-Control` header, and you are relying on CloudFront's [cache behaviors](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Expiration.html) to control CloudFront caching, CloudFront will not send a `Cache-Control` header to the browser for browser caching. This function adds a `Cache-Control` header for the browser so that content can be cached locally in the browser. This reduces CloudFront costs, while giving users of your site better performance.

If your origin sends a `Cache-Control` header in responses to CloudFront, this header is passed to the browser. In this case, this function is not required.

**Important: Set the `max-age` directive to an appropriate value for your specific needs.**

## Deployment

To deploy the stack, go to [CloudFront Extensions Workshop](https://awslabs.github.io/aws-cloudfront-extensions/#cloudfront-function), find the CloudFront Function and click **Deploy** button.

