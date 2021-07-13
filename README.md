# CloudFront Extensions

[中文]() | [English]()



“CloudFront Extensions” GitHub project offers an open source package consisting of a set of applications and solution templates that covers various user scenarios for using [Lambda@Edge](https://aws.amazon.com/lambda/edge/) and [Amazon CloudFront](https://aws.amazon.com/cloudfront/). 


## Overview
Ultimately, we want to provide out-of-box experience from three dimensions

<img src='docs/images/aws-cloudfront-extensions.png'>

## Lambda@Edge & CloudFront Function
* **One stop to find Lambda@Edge and CloudFront Function scripts for various use cases**

This project offers production level Lambda@Edge scripts for common CloudFront use cases, such as Redirect, Header Rewriting, Authentication, Pre-warm etc. The solution aims to optimize the user experience of CloudFront configuration in global regions (where Lambda@Edge and CloudFront Function services are available), and help you to simplify global CloudFront configuration via Lambda functions. You can directly deploy them from the [workshop](https://awslabs.github.io/aws-cloudfront-extensions/).


## CloudFront Quick Start

* **One-Click to deploy commonly used CloudFront solutions**

This project offers common solutions for using CloudFront. These solutions are provided in form of pre-baked [AWS CloudFormation](https://aws.amazon.com/cloudformation) templates. With 1-click, you can have solution launched into your own AWS console. 

|        **Name**    | **Description**      |
|------------------|--------------------|
| [WAF & Shield Deployment for CloudFront](templates/aws-cloudfront-waf/README.md) | Prepared templates to quickly launch distribution and pre-configured rules, such as AWS managed common rules, whitelist, blacklist, HTTP flood, SQL injection, XSS, Bad bot, etc.   | 



## Observability

* **Out-of-box experience when integrating with external monitoring system** 

This project also provides out-of-box monitoring solution to enhance the overall observability and simplify the integration of CloudFront and customers’ existing monitoring system.


|        *Name*    | *Description*      |
|------------------|--------------------|
| End-to-end monitoring | Centralized logs management solution and built-in dashboards on top of ElasticSearch, collecting file & real-time logs from CloudFront and related services.   | 

## Tutorial

To get started, please find the step-by-step workshop material here: https://awslabs.github.io/aws-cloudfront-extensions/

## Contribution

See [CONTRIBUTING](./CONTRIBUTING.md) for more information.

## License

This project is licensed under the Apache-2.0 License.

