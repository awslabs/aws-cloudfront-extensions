---
title: Deploy a Lambda@Edge function to authenticate with Cognito
weight: 1
---

In this step, you will find and deploy one serverless application that have been published to the AWS Serverless Application Repository. The application enables authentication with Amazon Cognito for your website.

## Deploy resources from CloudFormation

1. Launch workshop stack by clicking this [link](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=auth-at-edge&templateURL=https://do-not-delete-cloudfront-ext-workshop.s3.amazonaws.com/edge-auth-workshop.template). 
2. Keep all the default parameters for the stack and click **Deploy**.
3. Wait a few minutes for the deployment to be completed.
4. You can check the deployment status in CloudFormation Console. Go to [CloudFormation console](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#) and choose the stack named **auth-at-edge**. 
5. In the Outputs section, it lists all the resources created by the stack, find the **CloudFrontDistribution**, **CognitoUserPoolId** and **DemoUrl** in the outputs, we will use them in next steps.

![Cognito user id](/images/cognito-user-id.png)

## Deploy auth application in SAR

To find and configure an application in the AWS Serverless Application Repository

1. Open [the AWS Serverless Application Repository page](https://serverlessrepo.aws.amazon.com/applications) in the Console
2. Check **Show apps that create custom IAM roles or resource policies**
3. Search the application name **authentication-with-cognito**, choose the application and click **Deploy**.
4. On the application detail page, paste the Cognito User Pool Id which was copied from the stack outputs, check **I acknowledge that this app creates custom IAM roles**
5. Click **Deploy**. After the deployment is completed, it will redirect to application over page

## Add a CloudFront Trigger to Run the Function

To configure the CloudFront trigger for your function
1. Choose **Configuration** tab and choose **Triggers** 
2. Add Trigger and choose **CloudFront**, choose **Deploy to Lambda@Edge**
   ![CF Trigger](/images/CF_trigger.png)
3. On the **Deploy to Lambda@Edge** page, enter the following information:
   - Distribution
     The CloudFront distribution which has been created in the stack
   - Cache behavior
     Select **private/***
   - CloudFront event
     In the drop-down list, choose **Viewer Request**
   Click **Deploy**
   ![Lambda Deploy](/images/deploy_para.png)
4. Wait for the function to replicate. This typically takes several minutes.
5. You can check to see if replication status in the [CloudFront Console](https://console.aws.amazon.com/cloudfront/) and viewing your distribution. Wait for the distribution status to change from In Progress back to **Deployed**, which means that your function has been replicated.

## Test the function

1. Open the DemoUrl which is shown in the stack outputs
2. To verify that Lambda@Edge is protecting the private content and blocking unauthorized requests, click on **Retrieve Private Data** button. You should see an alert dialog popup noting that Lambda@Edge has blocked your access as you have not logged in
   ![Lambda Deploy](/images/not_login.png)
3. To gain access to private data, you have to authenticate first. Click **Authenticate with Amazon Cognito** button, you will be presented with Amazon Cognito Custom UI
   ![Lambda Deploy](/images/cognito_login_page.png)
4. Enter your username and password if you have one, or else you need to sign up
   Click on Sign up and follow instructions to register a new username, password, and verify your email address. Note that as part of the verification process, you will need to copy the one-time code sent to your email. Once authenticated, your browser will redirect back to the Private Content Viewer page, but this time you will have a JSON Web Token
5. Click on **Retrieve Private Data** button again, and the private content is shown this time
   ![Lambda Deploy](/images/login_success.png)


