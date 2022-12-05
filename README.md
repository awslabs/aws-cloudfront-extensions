<h1 align="center">
  <a name="logo" href="https://www.amazonaws.cn/solutions/amazon-cloudfront-extensions/"><img src="https://awslabs.github.io/aws-cloudfront-extensions/en/images/cfe-logo.png" alt="CFE logo" width="200"></a>
  <br>
  CloudFront Extensions
</h1>

<div align="center">
  <h4>
    <a href="https://github.com/awslabs/aws-cloudfront-extensions/stargazers"><img src="https://img.shields.io/github/stars/awslabs/aws-cloudfront-extensions.svg?style=plasticr"/></a>
    <a href="https://github.com/awslabs/aws-cloudfront-extensions/commits/main"><img src="https://img.shields.io/github/last-commit/awslabs/aws-cloudfront-extensions.svg?style=plasticr"/></a>
    <a href="https://img.shields.io/badge/stable%20docs-implementation%20guide-orange?style=plasticr&label=docs"><img src="https://img.shields.io/badge/stable%20docs-implementation%20guide-orange?style=plasticr&label=docs"/></a>

  </h4>
</div>



CloudFront Extensions GitHub project offers an open source package consisting of a set of applications and solution templates that covers various user scenarios for using [Amazon CloudFront](https://aws.amazon.com/cloudfront/), [Lambda@Edge](https://aws.amazon.com/lambda/edge/) and CloudFront Functions. 


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

## Deploy the solution

**Time to deploy:** Approximately 15 minutes.

Follow the step-by-step instructions in [implementation guide](https://awslabs.github.io/aws-cloudfront-extensions/en/deployment/) to configure and deploy CloudFront Extensions into your account.

1. Make sure you have signed in AWS Console.
2. Click the following button to launch the CloudFormation Stack in your account.

   | Region        | Launch Button  |
   | ------------- | -------------  |
   | Global Region      |    [![Launch Stack](./docs-ig/images/deploy_button.png)](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=cloudFrontExtensionsConsole&templateURL=https://aws-gcr-solutions.s3.amazonaws.com/Aws-cloudfront-extensions/latest/custom-domain/CloudFrontExtnConsoleStack.template.json) |

## Contribution

See [CONTRIBUTING](./CONTRIBUTING.md) for more information.

## License

This project is licensed under the Apache-2.0 License.

