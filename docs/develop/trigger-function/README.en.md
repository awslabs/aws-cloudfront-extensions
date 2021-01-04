---
title: Trigger from CloudFront 
weight: 6
---

## Add a CloudFront Trigger to Run the Function

Now that you have tested the Lambda function, in this step, you will configure the CloudFront trigger to run your function to add the headers in any response that CloudFront receives from the origin for your distribution.

To configure the CloudFront trigger for your function
1. Choose **Configuration** tab and choose **Triggers**, you will see there is an API Gateway trigger which is deployed by hello world SAM template, delete it since you will not need it in this workshop

   ![Api Trigger](/api_trigger.png)

2. Add Trigger and choose **CloudFront**, choose **Deploy to Lambda@Edge**

   ![CF Trigger](/CF_trigger.png)

3. On the **Deploy to Lambda@Edge** page, enter the following information:
   
   - Distribution
   
     The CloudFront distribution ID to associate with your function. In the drop-down list, choose the distribution ID.
   
   - CloudFront event

     The trigger that specifies when your function runs. We want the function to run whenever CloudFront returns a response from the origin and then the function will modify/add the response headers. So in the drop-down list, choose **Origin response**

   Choose **Deploy**
   
   ![Lambda Deploy](/lambda_deploy.png)

4. Wait for the function to replicate. This typically takes several minutes
   
   You can check to see if replication is finished by going to the [CloudFront console](https://console.aws.amazon.com/cloudfront/) and viewing your distribution. Wait for the distribution status to change from In Progress back to **Deployed**, which means that your function has been replicated

   ![CF Deployed](/cf_deployed.png)


## Trigger the function from CloudFront

Now that you've configured a trigger to run the function for a CloudFront distribution, check to make sure that the function is accomplishing what you expect it to. In this step, we will check the HTTP headers that CloudFront returns, to make sure that the workshop header is added

In **Create a CloudFront Distribution** section, you have created a CloudFront distribution which is similar with https://d1v2jstg89nnob.cloudfront.net/CloudFrontIcon.png

Open this link, you will see the workshop header is in the response header

![Resp Header](/resp_header.png)



