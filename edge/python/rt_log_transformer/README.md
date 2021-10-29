# Real-time Log Transformer 

## Description

This Lambda will add custom content(eg. country code, isp) into the real-time CloudFront logs, it can add partition keys as well

## Architecture Diagram

<img src='./CloudFrontMetrics.png'>

The solution will collect real-time logs by Kinesis Data Stream and store it in S3 bucket. EventBridge will trigger MetricCollector every 5 min to collect the metric data by Athena and put it into DynamoDB table. The user can invoke the API Gateway to get the metric data in DynamoDB table. The API Gateway is authorized by Cognito and the user needs to provide a valid access token to invoke it

## Deployment

You can deploy it in SAR(Serverless Application Repository) with a few clicks or use SAM CLI as well

### Use SAR

- Go to https://serverlessrepo.aws.amazon.com/applications
- Check the check box "Show apps that create custom IAM roles or resource policies" and search "rt-log-transformer"
- Find the Lambda and deploy it to your AWS account


### Use SAM CLI

The Serverless Application Model Command Line Interface (SAM CLI) is an extension of the AWS CLI that adds functionality for building and testing Lambda applications. It uses Docker to run your functions in an Amazon Linux environment that matches Lambda. It can also emulate your application's build environment and API.

To use the SAM CLI, you need the following tools.

* SAM CLI - [Install the SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
* [Python 3 installed](https://www.python.org/downloads/)
* Docker - [Install Docker community edition](https://hub.docker.com/search/?type=edition&offering=community)

To build and deploy your application for the first time, run the following in your shell:

```bash
sam build --use-container
sam deploy --guided
```

## Cleanup

To delete the application that you created, use the AWS CLI. Assuming you used your project name for the stack name, you can run the following:

```bash
aws cloudformation delete-stack --stack-name rt-log-transformer
```

