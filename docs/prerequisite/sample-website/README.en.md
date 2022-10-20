---
title: Deploy Sample Website
weight: 1
---

**Time to deploy**: Approximately 15 minutes

## Launch Stack
1. Sign in to the [AWS Management Console](https://console.aws.amazon.com/) and select the button to launch the CloudFormation template. You can also [download the template](https://aws-cloudfront-extensions-cff.s3.amazonaws.com/asset/workshop/CloudFrontExtensionsWorkshopStack.template.json) as a starting point for your own implementation.

      [![Deploy](./images/deploy_button.png)](https://console.aws.amazon.com/cloudformation/home#/stacks/create/template?stackName=CFExtSampleWorkshop&templateURL=https://aws-cloudfront-extensions-cff.s3.amazonaws.com/asset/workshop/CloudFrontExtensionsWorkshopStack.template.json)


    !!! Note "Note" 
       This template is created for us-east-1 region (N. Virginia) and will not work in other regions.    


2. The template can only be launched in US East (N. Virginia) Region, please check the region on the right-upper corner and make sure it is correct.
3. Choose **Next**.
4. On the **Specify stack details** page, keep the name unchanged, and choose **Next**.
5. On the **Configure stack options** page, choose **Next**.
6. On the **Review** page, review and confirm the settings. Check the boxes **I acknowledge that AWS CloudFormation might create IAM resources**.
7. Choose **Create stack** to deploy the stack. 

You can view the status of the stack in the CloudFormation Console in the Status column. You will receive a CREATE_COMPLETE status in approximately 15 minutes. 

This Cloudformation Stack will automatically deploy a CloudFront distribution and an S3 bucket with web pages for PC/Android/iOS browsers.

The architecture diagram is as shown below:

![CloudFrontExt Arch](../images/sample_arch.png)

