# CloudFront Extensions



CloudFront Extensions GitHub project offers an open source package consisting of a set of applications and solution templates that covers various user scenarios for using [Lambda@Edge](https://aws.amazon.com/lambda/edge/) and [Amazon CloudFront](https://aws.amazon.com/cloudfront/). 


## Overview

Deploying CloudFront Extensions solution with the default parameters builds the following environment in the AWS Cloud.

<img src='docs/images/arch.png'>


1. Amazon CloudFront distributes the solution frontend web UI assets hosted in Amazon S3 bucket.
2. Amazon Cognito user pool provides authentication for backend.
3. Amazon AppSync provides the backend GraphQL APIs.
4. Amazon API Gateway provides the backend RESTful APIs for SSL certificates and Monitoring features.
5. Amazon DynamoDB stores the solution related information as backend database.
6. Amazon Lambda interacts with other Amazon Services to process core logic of monitoring, SSL certificates and extensions repository, and obtains information updated in DynamoDB tables.
7. AWS Step Functions orchestrate workflows for creating ACM certificates, importing existed certificates and creating CloudFront distributions. 
8. Extensions are shown in Extensions repository. AWS CloudFormation and AWS Serverless Application Repository will be triggered if you want to deploy an extension into your AWS account.
9. AWS Lambda stores CloudFront configuration changes into S3 bucket, and you can view the difference between two CloudFront configuration versions and apply the configuration.
10. Amazon Athena queries CloudFront standard logs or real-time logs to get CloudFront metrics and output it by API Gateway. You can also view the metrics by monitoring dashboard.

## Tutorial

To get started, please find more details at: https://awslabs.github.io/aws-cloudfront-extensions/

For workshop, please refer to https://awslabs.github.io/aws-cloudfront-extensions/workshop/ 

## Contribution

See [CONTRIBUTING](./CONTRIBUTING.md) for more information.

## License

This project is licensed under the Apache-2.0 License.

