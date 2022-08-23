## What is Redirect by Country?
If you need to redirect your website user to a country-specific site based on the country of the user, you can deploy this extension. For example, if the user is located in Germany, a CloudFront function modifies the URL in request and redirects the user to the /de/index.html page, which is the Germany-specific version of the website. This function is building the whole URL (https://host/de/index.html) to redirect.

## How does it work?

This extension makes use of the [Cloudfront-Viewer-Country geo-location header](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-cloudfront-headers.html#cloudfront-headers-viewer-location) which performs a lookup on the request to determine the user's country and includes that value in the Cloudfront-Viewer-Country request header. 

You can use any of the geo-location or [device detection](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-cloudfront-headers.html#cloudfront-headers-device-type) headers that are available from CloudFront. For the geo-location or device detection headers to appear in the request object within a function, you must allow these headers (or allow all viewer headers) in a [CloudFront origin request policy](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/controlling-origin-requests.html#origin-request-understand-origin-request-policy) or [cache policy](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/controlling-the-cache-key.html#cache-key-understand-cache-policy).

The solution deploys a CloudFormation template that does the following:

* Deploy a CloudFront Functions named “redirect-by-country” on your selected CloudFront distribution’s behaviors. 
* Create a CloudFront origin request policy named "redirect-by-country" that adds "cloudfront-viewer-country" header to the allowed header list.
* Add "redirect-by-country" origin request policy automatically to the CloudFront distribution's behaviors. 

!!! Important "Important"
      
      If the CloudFront distribution already has an AWS origin request policy, then you need manually add it in the origin request policy. 

## CloudFront Stage
Viewer request

## Deployment on the web console (Recommended)

The steps to deploy the extensions from the web console are similar. For more information, refer to the section [True Client IP](true-client-ip.md).
































  



