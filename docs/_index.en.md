---
title: CloudFront Extensions workshop 
chapter: true
---

# Amazon CloudFront Extensions 

Amazon CloudFront Extensions is an extension for using CloudFront. CloudFront Extensions includes rich set of featured Lambda@Edge, CDK templates for various user scenarios and an out-of-box monitoring solution. It is an open-source project in GitHub, anyone can contribute to add Lambda@Edge features or adding more CloudFront related solutions.

![What is CloudFrontExt](/images/what-is-cloudfrontext.png)

![High Level Design](/images/high-level-arch.png)

### One stop to find Lambda@Edge scripts for different use cases

CloudFront Extensions offers production level Lambda@Edge scripts for common CloudFront use cases, such as Redirect, Header Rewriting, Authentication, Prewarm etc. The solution aims to optimize the customer experience of CloudFront configuration in the global region, and enables customers to simplify global CloudFront configuration via Lambda function scripts, through which they can enjoy AWS CloudFront service and switch more CDN traffic to CloudFront. Customers can not only checkout Lambda@Edge scripts from CloudFront Extensions GitHub repo, but also can deploy them from SAR directly into AWS Console without coding.

### One-Click to deploy commonly used CloudFront solutions

CloudFront Extensions offers common solutions for using CloudFront, such as CloudFront with Security Automation, CloudFront with Automated WAF, etc. These solutions are provided in pre-baked CloudFormation templates. Customers can have solution launched into their own AWS consoles with just a simple click and then use the corresponding Lambda@Edge scripts use CloudFront.

### Out-of-box experience when integrating with external monitoring system

The fact that metrics and events are retrieved from different AWS services (for example, events are from Evert Bridge, access logs are from s3, etc.), make it a big challenge for improvement of monitor experience when using CloudFront. Customers have wanted to a universal place to handle those logs/events with generic monitoring capability. CloudFront Extensions has provided out-of-box monitoring solution to enhance the overall observability and simplify the integration of CloudFront and customers’ existing monitoring system.

