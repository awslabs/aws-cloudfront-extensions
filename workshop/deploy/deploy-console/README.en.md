---
title: Deploy CloudFront Extensions Console 
weight: 1
---

**Time to deploy**: Approximately 20 minutes

### Deployment steps

1. Sign in to the [AWS Management Console](https://console.aws.amazon.com/) and select the button to launch the CloudFormation template. You can also [download the template](https://aws-gcr-solutions.s3.amazonaws.com/Aws-cloudfront-extensions/latest/custom-domain/CloudFrontExtnConsoleStack.template.json) as a starting point for your own implementation.

      [![Deploy](../../../images/deploy_button.png)](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=cloudFrontExtensionsConsole&templateURL=https://aws-gcr-solutions.s3.amazonaws.com/Aws-cloudfront-extensions/latest/custom-domain/CloudFrontExtnConsoleStack.template.json)

2. We launch this template in US East (N. Virginia) Region, please check the region on the right-upper corner and make sure it is correct.
3. Choose **Next**.
4. On the **Specify stack details** page, keep the name unchanged. Under **Parameters**, fill in each parameter by the instruction in **Workshop** field.

      | Parameter              | Default value | Description  | Workshop  |
      |-----------|---------------------------------------------------------------------------------------------------------------------------------------------|---------|---------|
      | Initial User Email     | - | The initial user email for the web console.   | Fill in your email address.
      | Initial User Name      | - | The initial username for the web console.   | Fill in your name. |
      | Initial User Password  | - | The Initial Password for the web console.   | Fill in your password. The password should be **Length 8~16 with space, Must contain 1 uppercase, 1 lowercase, 1 number, 1 non-alpha numeric number, 1 number (0-9).** eg. CFExt@2023 |
      | Notification Email     | - | Email address to receive SSL certificates notification.   | Fill in your email address. This can be the same with Initial User Email. |
      | CloudFront Log Type    | no | You can set it to `yes-Realtime` to get monitoring metrics from realtime loge, or set it to` yes-Non-Realtime` to get monitoring metrics from standard log. By default, it is `no`, which means it will not deploy monitoring feature. See [Monitoring](./monitoring/overview.md) for more information.                                 | Choose **yes-Non-Realtime**. |
      | CloudFront Domain List | - | The CloudFront domain name list. Use comma as separation for multiple domain names. Use 'ALL' to monitoring all domains in your AWS account | Fill in the sample website you deployed in Prerequisite, eg. d1jy0foe2tk2rx.cloudfront.net. You can find the domain name in the Outputs tab of the CloudFormation stack. |
      | Log Keeping Days       | 120 | The number of days to keep CloudFront logs in the S3 bucket.  | Use the default value, no change is needed. |
      | Delete Log             | false | You can set it to `true` to delete original CloudFront standard logs in S3 bucket. By default, it is `false`. This only applies to non-realtime monitoring | Use the default value, no change is needed. |
      | Use Start Time         | false | You can set it to `true` if the Time in metric data is based on start time, or set it to `false` if the Time in metric data is based on end time. This only applies to non-realtime monitoring | Use the default value, no change is needed. |


5. Choose **Next**.
6. On the **Configure stack options** page, choose **Next**.
7. On the **Review** page, check both boxes **I acknowledge that AWS CloudFormation might create IAM resources with custom names.** and **I acknowledge that AWS CloudFormation might require the following capability: CAPABILITY_AUTO_EXPAND**.
8. Choose **Create stack** to deploy the stack. 

You can view the status of the stack in the CloudFormation Console in the Status column. You should receive a CREATE_COMPLETE status in approximately 20 minutes.


After deployment, you will see two CloudFormation stacks, **cloudFrontExtensionsConsole** and a nested stack.

![Console Stacks](../../../images/console_stack.png)

## Open CloudFront Extensions Console

This solution will deploy a CloudFront distribution that hosts CloudFront Extensions console.
1. Choose the **Outputs** tab of **cloudFrontExtensionsConsole** stack.
2. You will find CloudFront Extensions console URL in **WebConsoleCloudFrontURL**. Open the url in the browser.
  ![Console Stack Output](../../../images/console_stack_output.png)

3. In the sign-in page, type in your user name and password (Email is set in **Initial User Name**, password is set in **Initial User Password** when you deploy the stack). Choose **Sign in**.
  ![Console Login](../../../images/console_login.png)


Now you can see the CloudFront Extensions Console, keep it open since we will do further steps on it later.

![Console Home](../../../images/console_home.png)


