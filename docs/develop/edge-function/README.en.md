---
title: Create a Lambda@Edge function 
weight: 4
---

In this step, you will create a Lambda function by AWS Serverless Application Model(SAM), the function adds code to update response headers in your CloudFront distribution.


## Download a sample AWS SAM application

After completing **UPLOAD CLOUDFRONT+ CODE INTO CLOUDSHELL** section, you have uploaded CloudFront+ into CloudShell, go to CloudFront+ folder and perform following commands:

       cd edge/nodejs/
       sam init

   Choose **1 - AWS Quick Start Templates**
   
   ![SAM init1](/sam-init1.png)

   Choose **1 - nodejs12.x**
   
   ![SAM init2](/sam-init2.png) 

   Enter project name **update-response-header** and choose **1 - Hello World Example** template
   
   ![SAM init3](/sam-init3.png)  

   Example output

   ![SAM init output](/sam-init-output.png)

   This command creates a directory with the name that you provided as the project name. The contents of the project directory are similar to the following:

       update-response-header/
       ├── README.md
       ├── events/
       │   └── event.json        #Contains the input for local test
       ├── hello_world/
       │   ├── app.js            #Contains AWS Lambda function logic
       │   ├── package.json      #Contains Nodejs dependencies 
       │   └── tests/
       │       └── unit/         #Contains your unit test case
       └── template.yaml         #Contains the AWS SAM template defining your application's AWS resources.

   There are three especially important files:

   - **template.yaml**: Contains the AWS SAM template that defines your application's AWS resources.

   - **hello_world/app.js**: Contains your actual Lambda handler logic.

   - **hello_world/package.json**: Contains any Nodejs dependencies that the application requires, and is used for sam build.

## Create Your Function
To create a Lambda@Edge function

1. Replace hello_world/app.js with following code, this will add a workshop header into response headers

        'use strict';

        exports.lambdaHandler = async (event, context) => {

            const response = event.Records[0].cf.response;
            const headers = response.headers;
        
            headers['workshop'] = [{key: 'workshop', value: 'workshop demo header'}];
        
            return response;
        };

2. Modify template.yaml, you need to add an IAM role into the yaml file, it will be assumed by the service principals when they execute your function. The change is shown in below image, you must replace the original template.yaml with the [new one](https://drive.corp.amazon.com/documents/lvning@/Workshop/template.yaml)

   ![Yaml Changes](/yaml_changes.png)
    
3. [Optional] Add solution id

   Solution id is a unique id assigned by AWS GCR Solution team, you will need to add the solution id in template.yaml, all CloudFront+ solution id is [here](https://quip-amazon.com/nXxXAl58SGQF/2021-Solution-Progress-Tracking-Board) under CloudFront+ tab.
   {{% notice info %}}
   Add Solution id is **optional** for this workshop, you can skip this step
   {{% /notice %}}


## Build and deploy your application

First, change into the project directory, where the template.yaml file for the sample application is located, it is edge/nodejs/update-response-header in this workshop. Then run this command:
        
    sam build

Example output:

![SAM Build Output](/sam-build-output.png)

Run this command to deploy your application

    sam deploy --guided --capabilities CAPABILITY_NAMED_IAM

Follow the on-screen prompts. To accept the default options provided in the interactive experience, respond with **Enter**

Example arguments:
![SAM Deploy Args](/sam-deploy-args.png)

Example output:
![SAM Deploy Output](/sam-deploy-output.png)

