Before you launch the solution, review the architecture, supported regions, and other considerations discussed in this guide. Follow the step-by-step instructions in this section to configure and deploy the solution into your account.


## CloudFront Extensions Console
 
**Time to deploy**: Approximately 15 minutes

### Deployment overview

Use the following steps to deploy this solution on AWS.

- Launch the CloudFormation template into your AWS account.
- Review the template parameters, and adjust them if necessary.

### Deployment steps

1. Sign in to the AWS Management Console and select the button to launch the CloudFormation template. You can also [download the template](https://aws-gcr-solutions.s3.amazonaws.com/Aws-cloudfront-extensions/latest/default/CloudFrontExtnConsoleStack.template.json) as a starting point for your own implementation.

      [![Deploy](../images/deploy_button.png)](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=cloudFrontExtensionsConsole&templateURL=https://aws-gcr-solutions.s3.amazonaws.com/Aws-cloudfront-extensions/latest/default/CloudFrontExtnConsoleStack.template.json)


2. The template launches in the US East (N. Virginia) Region by default. To launch the solution in a different AWS Region, use the Region selector in the console navigation bar.

3. Under Parameters, review the parameters for the template, and modify them as necessary.

      | Parameter             | Default value | Description                                                                                                                                 |
      |-----------|---------------|---------|
      | EmailAddress          | - | Email address to receive SSL certificates notification.                                                                                     |
      | ConsoleAdminEmail              | - | The initial user email for the web console.                                                                                                 |
      | ConsoleAdminUserName  | - | The initial username for the web console.                                                                                                   |
      | ConsoleAdminPassword | - | The initial user password for the web console.                                                                                              |
      | Monitoring            | no | Enable realtime or non-realtime monitoring to get CloudFront metrics such as cache hit ratio, bandwidth.                                    |
      | CloudFrontDomainList  | - | The CloudFront domain name list. Use comma as separation for multiple domain names. Use 'ALL' to monitoring all domains in your AWS account |
      | CloudFrontLogKeepDays | 120 | The number of days to keep CloudFront logs in the S3 bucket.                                                                       |
      | DeleteLog             | false | Delete original CloudFront standard logs in S3 bucket (true or false).                                                                      |
      | UseStartTime          | false | Set it to true if the Time in metric data is based on start time, set it to false if the Time in metric data is based on end time.          |
  

4. Choose **Next**.
5. On the **Configure stack options** page, you can specify tags (key-value pairs) for resources in your stack and set additional options, and then choose **Next**.
6. On the **Review** page, review and confirm the settings. Check the boxes acknowledging that the template will create AWS Identity and Access Management (IAM) resources and any additional capabilities required.
7. Choose **Create** to deploy the stack. 

You can view the status of the stack in the CloudFormation Console in the Status column. You should receive a CREATE_COMPLETE status in approximately 15 minutes.

To see details for the stack resources, choose the **Outputs** tab. 

## Lambda@Edge & CloudFront Functions collection

**Time to deploy**: Approximately 3 minutes

### Deployment overview

Click below deploy button to deploy this solution in your AWS account. As for Lambda@Edge functions, you can also find and configure them by searching aws-cloudfront-extensions in the Amazon SAR (Serverless Application Repository).



#### Lambda@Edge

|    **Name**   |  **Deploy** |
|------------------|--------------------|
| [Authentication with Cognito](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/edge/nodejs/authentication-with-cognito) |  [![Deploy](../images/deploy_button.png)](https://serverlessrepo.aws.amazon.com/applications/us-east-1/418289889111/authentication-with-cognito) |
| [Adding security header](https://github.com/awslabs/aws-cloudfront-extensions/blob/main/edge/nodejs/add-security-headers) |  [![Deploy](../images/deploy_button.png)](https://serverlessrepo.aws.amazon.com/applications/us-east-1/418289889111/add-security-headers) |
| [Serve content based on device type](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/edge/nodejs/serving-based-on-device) |  [![Deploy](../images/deploy_button.png)](https://serverlessrepo.aws.amazon.com/applications/us-east-1/418289889111/serving-based-on-device) |
| [Cross origin resource sharing](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/edge/nodejs/cross-origin-resource-sharing)  | [![Deploy](../images/deploy_button.png)](https://serverlessrepo.aws.amazon.com/applications/us-east-1/418289889111/cross-origin-resource-sharing) |
| [Modify response status code](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/edge/nodejs/modify-response-status-code)  | [![Deploy](../images/deploy_button.png)](https://serverlessrepo.aws.amazon.com/applications/us-east-1/418289889111/modify-response-status-code) |
| [Modify response header](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/edge/nodejs/modify-response-header) | [![Deploy](../images/deploy_button.png)](https://serverlessrepo.aws.amazon.com/applications/us-east-1/418289889111/modify-response-header) |
| [Access origin by weight rate](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/edge/nodejs/access-origin-by-weight-rate) | [![Deploy](../images/deploy_button.png)](https://serverlessrepo.aws.amazon.com/applications/us-east-1/418289889111/access-origin-by-weight-rate) |
| [Failover to alternative origin](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/edge/nodejs/multiple-origin-IP-retry) | [![Deploy](../images/deploy_button.png)](https://serverlessrepo.aws.amazon.com/applications/us-east-1/418289889111/multiple-origin-IP-retry) |
| [Support 302 from origin](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/edge/nodejs/http302-from-origin) |  [![Deploy](../images/deploy_button.png)](https://serverlessrepo.aws.amazon.com/applications/us-east-1/418289889111/http302-from-origin) |
| [Pre-warm](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/edge/python/prewarm) | [![Deploy](../images/deploy_button.png)](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=pre-warming&templateURL=https://aws-gcr-solutions.s3.amazonaws.com/Aws-cloudfront-extensions/latest/default/PrewarmStack.template.json) |
| [Resize picture](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/edge/nodejs/resize-picture) | [![Deploy](../images/deploy_button.png)](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=default-dir-index&templateURL=https://aws-gcr-solutions.s3.amazonaws.com/Aws-cloudfront-extensions/latest/default/ResizeImageStack.template.json) |
| [Anti-hotlinking](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/edge/nodejs/anti-hotlinking) | [![Deploy](../images/deploy_button.png)](https://serverlessrepo.aws.amazon.com/applications/us-east-1/418289889111/anti-hotlinking) |
| [Standardize query string](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/edge/nodejs/normalize-query-string) | [![Deploy](../images/deploy_button.png)](https://serverlessrepo.aws.amazon.com/applications/us-east-1/418289889111/normalize-query-string) |
| [Authentication with Alibaba Cloud](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/edge/nodejs/authentication-with-aliyun-cdn-typeA) | [![Deploy](../images/deploy_button.png)](https://serverlessrepo.aws.amazon.com/applications/us-east-1/418289889111/authentication-with-aliyun-cdn-typeA) |
| [Rewrite host for custom origin](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/edge/nodejs/rewrite-url) |  [![Deploy](../images/deploy_button.png)](https://serverlessrepo.aws.amazon.com/applications/us-east-1/418289889111/rewrite-url) |
| [Serverless load balancer](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/edge/python/serverless-load-balancer) |  [![Deploy](../images/deploy_button.png)](https://serverlessrepo.aws.amazon.com/applications/us-east-1/418289889111/serverless-load-balancer) |
| [Custom response with new URL](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/edge/nodejs/custom-response-with-replaced-url) | [![Deploy](../images/deploy_button.png)](https://serverlessrepo.aws.amazon.com/applications/us-east-1/418289889111/custom-response-with-replaced-url) |


#### CloudFront Functions
|    **Name**   |  **Deploy**     |
|------------------|--------------------|
| [Add security headers](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/function/js/add-security-headers) |[![Deploy](../images/deploy_button.png)](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=add-security-headers&templateURL=https:%2F%2Faws-cloudfront-extensions-cff.s3.amazonaws.com%2Fadd-security-headers.yaml)                   |
| [Cross origin resource sharing](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/function/js/cross-origin-resource-sharing) |  [![Deploy](../images/deploy_button.png)](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=cross-origin-resource-sharing&templateURL=https:%2F%2Faws-cloudfront-extensions-cff.s3.amazonaws.com%2Fcross-origin-resource-sharing.yaml) |
| [Add cache control headers](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/function/js/add-cache-control-header)  | [![Deploy](../images/deploy_button.png)](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=add-cache-control-header&templateURL=https:%2F%2Faws-cloudfront-extensions-cff.s3.amazonaws.com%2Fadd-cache-control-header.yaml)           |
| [Add origin headers](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/function/js/add-origin-header)  | [![Deploy](../images/deploy_button.png)](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=add-origin-header&templateURL=https:%2F%2Faws-cloudfront-extensions-cff.s3.amazonaws.com%2Fadd-origin-header.yaml)                         |
| [Add true client IP headers](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/function/js/add-true-client-ip-header) | [![Deploy](../images/deploy_button.png)](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=add-true-client-ip-header&templateURL=https:%2F%2Faws-cloudfront-extensions-cff.s3.amazonaws.com%2Fadd-true-client-ip-header.yaml)         |
| [Redirect based on country](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/function/js/redirect-based-on-country) | [![Deploy](../images/deploy_button.png)](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=redirect-based-on-country&templateURL=https:%2F%2Faws-cloudfront-extensions-cff.s3.amazonaws.com%2Fredirect-based-on-country.yaml)         |
| [Default dir index](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/function/js/default-dir-index) |  [![Deploy](../images/deploy_button.png)](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=default-dir-index&templateURL=https:%2F%2Faws-cloudfront-extensions-cff.s3.amazonaws.com%2Fdefault-dir-index.yaml)                         |
| [Verify JSON web token](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/function/js/verify-jwt) |  [![Deploy](../images/deploy_button.png)](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=verify-jwt&templateURL=https:%2F%2Faws-cloudfront-extensions-cff.s3.amazonaws.com%2Fverify-jwt.yaml)                                       |
| [Customize request host](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/function/js/custom-host) | [![Deploy](../images/deploy_button.png)](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=custom-host&templateURL=https:%2F%2Faws-cloudfront-extensions-cff.s3.amazonaws.com%2Fcustom-host.yaml)                                     |


#### Lambda@Edge Deployment in SAR


1. Access the [AWS Serverless Application Repository page](https://serverlessrepo.aws.amazon.com/applications) in the Console.
2. Check **Show apps that create custom IAM roles or resource policies**.
3. Search **aws-cloudfront-extensions** to display all extensions, and choose an application (for example, serving-based-on-device) and click **Deploy**.
4. On the application detail page, check **I acknowledge that this app creates custom IAM roles**.
5. Choose **Deploy**. After the deployment is completed, it will redirect to Lambda application page, and you can deploy it to Lambda@Edge.

