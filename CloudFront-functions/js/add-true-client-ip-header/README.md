# Add True-Client-IP header

**CloudFront Functions event type: viewer request**

`True-Client-IP` is a request HTTP header that you can add to incoming CloudFront requests to include the IP address of a client connecting to CloudFront. Without this header, connections from CloudFront to your origin contain the IP address of the CloudFront server making the request to your origin, not the IP address of the client connected to CloudFront. This CloudFront function adds the `True-Client-IP` HTTP header to the incoming CloudFront request so your origin has access to the IP address of the client connecting to CloudFront.

**Important: You must add this header to the allowed list of headers forwarded to the origin as part of a [CloudFront origin request policy](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/controlling-origin-requests.html#origin-request-understand-origin-request-policy-settings). Otherwise, CloudFront removes this header before making the request to the origin.**

**Note:**
- You only need this header if your origin includes logic based on the client's IP address. If your origin returns the same content regardless of the client IP address, this function is likely not needed.
- You don't have to use the header name `True-Client-IP`. You can change the name to any value that your origin requires (e.g. `X-Real-IP`).
- CloudFront also sends an `X-Forwarded-For` header to your origin, which contains the client's IP address along with any HTTP proxies or load balancers that the request passed through.

## Deployment

To deploy the stack, go to [CloudFront Extensions Workshop](https://awslabs.github.io/aws-cloudfront-extensions/#cloudfront-function), find the CloudFront Function and click **Deploy** button.

