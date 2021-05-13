# Prewarm

## Description

This Lambda will prewarm static content in specific pop, for example, prewarm a video file in SEA19-C3

To use this Lambda, you need to input below parameters

- PARA_POP - The pop which you want to prewarm, it supports multiple value with comma as separator, eg. 'ATL56-C1, DFW55-C3, SEA19-C3'
- PARA_MAPPING - Domain name mapping, it is a json line, eg. {\"www.example.com\":\"d123456789012.cloudfront.net\", \"www.example.net\": \"d123456789013.cloudfront.net\"}, use {} if you don't need a mapping
- PARA_S3BUCKET - S3 bucket name to store the file which contains urls to pre-warm. eg. pre-warm-bucke
- PARA_S3KEY - The S3 key of the file which contains urls to pre-warm, the file should be stored in an S3 bucket. eg. Prewarm/urls.txt


## Deployment

You can deploy it in SAR(Serverless Application Repository) with one click or use SAM CLI as well

### Use SAR

- Go to https://serverlessrepo.aws.amazon.com/applications
- Check the check box "Show apps that create custom IAM roles or resource policies" and search "aws-cloudfront-extensions"
- Find the Lambda and deploy it to your AWS account


### Use SAM CLI

This project contains source code and supporting files for a serverless application that you can deploy with the SAM CLI. It includes the following files and folders.

- prewarm - Code for the application's Lambda function.
- events - Invocation events that you can use to invoke the function.
- tests - Unit tests for the application code. 
- template.yaml - A template that defines the application's AWS resources.


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


## Use the SAM CLI to build and test locally

Build your application with the `sam build --use-container` command.

```bash
prewarm$ sam build --use-container
```

The SAM CLI installs dependencies defined in `prewarm/requirements.txt`, creates a deployment package, and saves it in the `.aws-sam/build` folder.

Test a single function by invoking it directly with a test event. An event is a JSON document that represents the input that the function receives from the event source. Test events are included in the `events` folder in this project.

Run functions locally and invoke them with the `sam local invoke` command.

```bash
prewarm$ sam local invoke PrewarmFunction --event events/event.json
```

## Add a resource to your application
The application template uses AWS Serverless Application Model (AWS SAM) to define application resources. AWS SAM is an extension of AWS CloudFormation with a simpler syntax for configuring common serverless application resources such as functions, triggers, and APIs. For resources not included in [the SAM specification](https://github.com/awslabs/serverless-application-model/blob/master/versions/2016-10-31.md), you can use standard [AWS CloudFormation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-template-resource-type-ref.html) resource types.


## Tests

Tests are defined in the `tests` folder in this project. Use PIP to install the test dependencies and run tests.

```bash
prewarm$ pip install -r tests/requirements.txt --user
# unit test
prewarm$ python -m pytest tests/unit -v
# integration test, requiring deploying the stack first.
# Create the env variable AWS_SAM_STACK_NAME with the name of the stack we are testing
prewarm$ AWS_SAM_STACK_NAME=<stack-name> python -m pytest tests/integration -v
```

## Cleanup

To delete the application that you created, use the AWS CLI. Assuming you used your project name for the stack name, you can run the following:

```bash
aws cloudformation delete-stack --stack-name prewarm
```

