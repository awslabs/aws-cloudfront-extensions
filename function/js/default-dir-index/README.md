# URL rewrites to append index.html to the URI for single page applications

**CloudFront Functions event type: viewer request**

You can use this function to perform a URL rewrite to append `index.html` to the end of URLs that don't include a filename or extension. This is particularly useful for single page applications or statically-generated websites using frameworks like React, Angular, Vue, Gatsby, or Hugo. These sites are usually stored in an S3 bucket and served through CloudFront for caching. Typically, these applications remove the filename and extension from the URL path. For example, if a user went to `www.example.com/blog`, the actual file in S3 is stored at `<bucket-name>/blog/index.html`. In order for CloudFront to direct the request to the correct file in S3, you need to rewrite the URL to become `www.example.com/blog/index.html` before fetching the file from S3. This function intercepts incoming requests to CloudFront and checks that there is a filename and extension. If there isn't a filename and extension, or if the URI ends with a "/", the function appends index.html to the URI.

There is a feature in CloudFront called the [default root object](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/DefaultRootObject.html) that allows you to specify an index document that applies to the root object only, but not on any subfolders. For example, if you set up index.html as the default root object and a user goes to `www.example.com`, CloudFront automatically rewrites the request to `www.example.com/index.html`. But if a user goes to `www.example.com/blog`, this request is no longer on the root directory, and therefore CloudFront does not rewrite this URL and instead sends it to the origin as is. This function handles rewriting URLs for the root directory and all subfolders. Therefore, you don't need to set up a default root object in CloudFront when you use this function (although there is no harm in setting it up).

**Note:** If you are using [S3 static website hosting](https://docs.aws.amazon.com/AmazonS3/latest/dev/WebsiteHosting.html), you don't need to use this function. S3 static website hosting allows you to set up an [index document](https://docs.aws.amazon.com/AmazonS3/latest/dev/IndexDocumentSupport.html). An index document is a webpage that Amazon S3 returns when any request lacks a filename, regardless of whether it's for the root of a website or a subfolder. This Amazon S3 feature performs the same action as this function.

## Deployment

To deploy the stack, go to [CloudFront Extensions Workshop](https://awslabs.github.io/aws-cloudfront-extensions/#cloudfront-function), find the CloudFront Function and click **Deploy** button.

