---
title: Deploy with CloudFront Extensions 
weight: 30
---

Lambda functions can be used to change CloudFront requests and responses at the following points:

- After CloudFront receives a request from a viewer (viewer request)
- Before CloudFront forwards the request to the origin (origin request)
- After CloudFront receives the response from the origin (origin response)
- Before CloudFront forwards the response to the viewer (viewer response)

![CloudFront Viewer Origin](/images/cloudfront-events-that-trigger-lambda-functions.png)

In this step, you will deploy below two Lambda functions in AWS Serverless Application Repository(SAR), the AWS Serverless Application Repository is a managed repository for serverless applications.

|  Lab   | Description  | CloudFront Event |
|  ----  | ----  | ----  |
| authentication-with-cognito  | The Lambda@Edge is designed to authenticate user through the Amazon Cognito | Viewer Request | 
| serving-based-on-device  | The Lambda@Edge is designed to serve content based on device type, for example, mobile device will be forwarded to access content for mobile devices, desktop device will be forwarded to access specific content, and so on so forth | Origin request | 
