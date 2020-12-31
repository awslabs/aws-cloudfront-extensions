---
title: Create a Lambda@Edge function 
weight: 4
---

In this step, you will create a Lambda function by AWS Serverless Application Model(SAM), the function adds code to update response headers in your CloudFront distribution.


## Download a sample AWS SAM application

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

        exports.handler = async (event, context) => {

            const response = event.Records[0].cf.response;
            const headers = response.headers;
        
            headers['workshop'] = [{key: 'cloudFrontExtensionWorkshop', value: 'Workshop demo header'}];
        
            return response;
        };
    
2. Add solution id (TBD)

## Build and deploy your application

First, change into the project directory, where the template.yaml file for the sample application is located, it is edge/nodejs/update-response-header in this workshop. Then run this command:
        
    sam build

Example output:

![SAM Build Output](/sam-build-output.png)

Run this command to deploy your application

    sam deploy --guided

Follow the on-screen prompts. To accept the default options provided in the interactive experience, respond with **Enter**

