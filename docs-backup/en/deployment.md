Before you launch the solution, review the architecture, [supported regions](./regions.md), and other considerations discussed in this guide. Follow the step-by-step instructions in this section to configure and deploy the solution into your account.

## Deploy the Web Console
 
**Time to deploy**: Approximately 15 minutes

### Deployment steps

1. Sign in to the [AWS Management Console](https://console.aws.amazon.com/) and select the button to launch the CloudFormation template. You can also [download the template](https://aws-gcr-solutions.s3.amazonaws.com/Aws-cloudfront-extensions/latest/custom-domain/CloudFrontExtnConsoleStack.template.json) as a starting point for your own implementation.

      [![Deploy](../images/deploy_button.png)](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=cloudFrontExtensionsConsole&templateURL=https://aws-gcr-solutions.s3.amazonaws.com/Aws-cloudfront-extensions/latest/custom-domain/CloudFrontExtnConsoleStack.template.json)


2. The template launches in the US East (N. Virginia) Region by default. To launch the solution in a different AWS Region, use the Region selector in the console navigation bar. See [regional deployment](./regions.md) for all the supported regions. 

3. Under Parameters, review the parameters for the template, and modify them as necessary.

      | Parameter              | Default value | Description                                                                                                                                 |
      |-----------|---------------------------------------------------------------------------------------------------------------------------------------------|---------|
      | Initial User Email     | - | The initial user email for the web console.                                                                                                 |
      | Initial User Name      | - | The initial username for the web console.                                                                                                   |
      | Initial User Password  | - | The Initial Password for the web console.                                                                                             |
      | Notification Email     | - | Email address to receive SSL certificates notification.                                                                                     |
      | CloudFront Log Type    | no | You can set it to `yes-Realtime` to get monitoring metrics from realtime loge, or set it to` yes-Non-Realtime` to get monitoring metrics from standard log. By default, it is `no`, which means it will not deploy monitoring feature. See [Monitoring](./monitoring/overview.md) for more information.                                 |
      | CloudFront Domain List | - | The CloudFront domain name list. Use comma as separation for multiple domain names. Use 'ALL' to monitoring all domains in your AWS account |
      | Log Keeping Days       | 120 | The number of days to keep CloudFront logs in the S3 bucket.                                                                                |
      | Delete Log             | false | You can set it to `true` to delete original CloudFront standard logs in S3 bucket. By default, it is `false`. This only applies to non-realtime monitoring |
      | Use Start Time         | false | You can set it to `true` if the Time in metric data is based on start time, or set it to `false` if the Time in metric data is based on end time. This only applies to non-realtime monitoring |


4. Choose **Next**.
5. On the **Configure stack options** page, you can specify tags (key-value pairs) for resources in your stack and set additional options, and then choose **Next**.
6. On the **Review** page, review and confirm the settings. Check the boxes acknowledging that the template will create AWS Identity and Access Management (IAM) resources and any additional capabilities required.
7. Choose **Create** to deploy the stack. 

You can view the status of the stack in the CloudFormation Console in the Status column. You should receive a CREATE_COMPLETE status in approximately 15 minutes.


### Follow-up Actions

To see details for the stack resources, choose the **Outputs** tab.

- You will find CloudFront Extensions console URL in **WebConsoleCloudFrontURL**. The initial user name and password are defined in InitialUserName and InitialUserPassword parameters when you deploy the CloudFormation stack. The API keys of snapshot and SSL certificates can be found in **Outputs** tab, For testing your API with API key, see [test usage plans](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-create-usage-plans-with-rest-api.html#api-gateway-usage-plan-test-with-postman).
- As for monitoring API, the solution will create a nested stack whose name contains **NonRealtimeNestedStack** or **RealtimeNestedStack**, and you will find the monitoring metric API and API key in the **Outputs** tab of the nested stack.

The CloudFormation stack deploys below modules:

- Monitoring: If you set Monitoring to yes-Realtime or yes-Non-Realtime, it will deploy the monitoring feature. See [monitoring](./monitoring/overview.md) for more details. 
- Distribution management: you can manage snapshots and SSL certificates. See [distribution management](./distribution-management/overview.md) for more details. 
- Extensions repository: you can deploy a set of ready-to-use extensions (Lambda@Edge functions, CloudFront functions, CloudFormation templates). See [extensions repository](./extension-repository/overview.md) for more details.  



## Deploy Lambda@Edge & CloudFront Functions collection

**Time to deploy**: Approximately 3 minutes

### Deployment overview

Click below deploy button to deploy this solution in your AWS account. As for Lambda@Edge functions, you can also find and configure them by searching aws-cloudfront-extensions in the Amazon SAR (Serverless Application Repository).

#### Lambda@Edge

|    **Name**   |  **Deploy** |
|------------------|--------------------|
| [Authentication with Cognito](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/lambda-edges/nodejs/authentication-with-cognito) |  [![Deploy](../images/deploy_button.png)](https://serverlessrepo.aws.amazon.com/applications/us-east-1/418289889111/authentication-with-cognito) |
| [Pre-warm](https://awslabs.github.io/aws-cloudfront-extensions/en/extension-repository/pre-warming/) | [![Deploy](../images/deploy_button.png)](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=prewarm&templateURL=https://aws-gcr-solutions.s3.amazonaws.com/Aws-cloudfront-extensions/latest/custom-domain/PrewarmStack.template.json) |
| [Resize picture](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/lambda-edges/nodejs/resize-picture) | [![Deploy](../images/deploy_button.png)](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=default-dir-index&templateURL=https://aws-gcr-solutions.s3.amazonaws.com/Aws-cloudfront-extensions/latest/default/ResizeImageStack.template.json) |
| [Anti-hotlinking](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/lambda-edges/nodejs/anti-hotlinking) | [![Deploy](../images/deploy_button.png)](https://serverlessrepo.aws.amazon.com/applications/us-east-1/418289889111/anti-hotlinking) |
| [Adding security header](https://github.com/awslabs/aws-cloudfront-extensions/blob/main/lambda-edges/nodejs/add-security-headers) |  [![Deploy](../images/deploy_button.png)](https://serverlessrepo.aws.amazon.com/applications/us-east-1/418289889111/add-security-headers) |
| [Serve content based on device type](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/lambda-edges/nodejs/serving-based-on-device) |  [![Deploy](../images/deploy_button.png)](https://serverlessrepo.aws.amazon.com/applications/us-east-1/418289889111/serving-based-on-device) |
| [Cross origin resource sharing](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/lambda-edges/nodejs/cross-origin-resource-sharing)  | [![Deploy](../images/deploy_button.png)](https://serverlessrepo.aws.amazon.com/applications/us-east-1/418289889111/cross-origin-resource-sharing) |
| [Modify response status code](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/lambda-edges/nodejs/modify-response-status-code)  | [![Deploy](../images/deploy_button.png)](https://serverlessrepo.aws.amazon.com/applications/us-east-1/418289889111/modify-response-status-code) |
| [Modify response header](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/lambda-edges/nodejs/modify-response-header) | [![Deploy](../images/deploy_button.png)](https://serverlessrepo.aws.amazon.com/applications/us-east-1/418289889111/modify-response-header) |
| [Access origin by weight rate](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/lambda-edges/nodejs/access-origin-by-weight-rate) | [![Deploy](../images/deploy_button.png)](https://serverlessrepo.aws.amazon.com/applications/us-east-1/418289889111/access-origin-by-weight-rate) |
| [Failover to alternative origin](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/lambda-edges/nodejs/multiple-origin-IP-retry) | [![Deploy](../images/deploy_button.png)](https://serverlessrepo.aws.amazon.com/applications/us-east-1/418289889111/multiple-origin-IP-retry) |
| [Support 302 from origin](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/lambda-edges/nodejs/http302-from-origin) |  [![Deploy](../images/deploy_button.png)](https://serverlessrepo.aws.amazon.com/applications/us-east-1/418289889111/http302-from-origin) |
| [Standardize query string](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/lambda-edges/nodejs/normalize-query-string) | [![Deploy](../images/deploy_button.png)](https://serverlessrepo.aws.amazon.com/applications/us-east-1/418289889111/normalize-query-string) |
| [Authentication with Alibaba Cloud](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/lambda-edges/nodejs/authentication-with-aliyun-cdn-typeA) | [![Deploy](../images/deploy_button.png)](https://serverlessrepo.aws.amazon.com/applications/us-east-1/418289889111/authentication-with-aliyun-cdn-typeA) |
| [Rewrite host for custom origin](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/lambda-edges/nodejs/rewrite-url) |  [![Deploy](../images/deploy_button.png)](https://serverlessrepo.aws.amazon.com/applications/us-east-1/418289889111/rewrite-url) |
| [Serverless load balancer](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/lambda-edges/python/serverless-load-balancer) |  [![Deploy](../images/deploy_button.png)](https://serverlessrepo.aws.amazon.com/applications/us-east-1/418289889111/serverless-load-balancer) |
| [Custom response with new URL](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/lambda-edges/nodejs/custom-response-with-replaced-url) | [![Deploy](../images/deploy_button.png)](https://serverlessrepo.aws.amazon.com/applications/us-east-1/418289889111/custom-response-with-replaced-url) |


#### CloudFront Functions
|    **Name**   |  **Deploy**     |
|------------------|--------------------|
| [Add security headers](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/function/js/add-security-headers) |[![Deploy](../images/deploy_button.png)](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=add-security-headers&templateURL=https://aws-cloudfront-extensions-cff.s3.amazonaws.com/add-security-headers.yaml)                   |
| [Cross origin resource sharing](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/function/js/cross-origin-resource-sharing) |  [![Deploy](../images/deploy_button.png)](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=cross-origin-resource-sharing&templateURL=https://aws-cloudfront-extensions-cff.s3.amazonaws.com/cross-origin-resource-sharing.yaml) |
| [Add cache control headers](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/function/js/add-cache-control-header)  | [![Deploy](../images/deploy_button.png)](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=add-cache-control-header&templateURL=https://aws-cloudfront-extensions-cff.s3.amazonaws.com/add-cache-control-header.yaml)           |
| [Add origin headers](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/function/js/add-origin-header)  | [![Deploy](../images/deploy_button.png)](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=add-origin-header&templateURL=https://aws-cloudfront-extensions-cff.s3.amazonaws.com/add-origin-header.yaml)                         |
| [Add true client IP headers](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/function/js/add-true-client-ip-header) | [![Deploy](../images/deploy_button.png)](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=add-true-client-ip-header&templateURL=https://aws-cloudfront-extensions-cff.s3.amazonaws.com/add-true-client-ip-header.yaml)         |
| [Redirect based on country](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/function/js/redirect-based-on-country) | [![Deploy](../images/deploy_button.png)](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=redirect-based-on-country&templateURL=https://aws-cloudfront-extensions-cff.s3.amazonaws.com/redirect-based-on-country.yaml)         |
| [Default dir index](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/function/js/default-dir-index) |  [![Deploy](../images/deploy_button.png)](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=default-dir-index&templateURL=https://aws-cloudfront-extensions-cff.s3.amazonaws.com/default-dir-index.yaml)                         |
| [Verify JSON web token](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/function/js/verify-jwt) |  [![Deploy](../images/deploy_button.png)](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=verify-jwt&templateURL=https://aws-cloudfront-extensions-cff.s3.amazonaws.com/verify-jwt.yaml)                                       |
| [Customize request host](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/function/js/custom-host) | [![Deploy](../images/deploy_button.png)](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=custom-host&templateURL=https://aws-cloudfront-extensions-cff.s3.amazonaws.com/custom-host.yaml)                                     |


#### Lambda@Edge Deployment in SAR


1. Access the [AWS Serverless Application Repository page](https://serverlessrepo.aws.amazon.com/applications) in the Console.
2. Check **Show apps that create custom IAM roles or resource policies**.
3. Search **aws-cloudfront-extensions** to display all extensions, and choose an application (for example, serving-based-on-device) and click **Deploy**.
4. On the application detail page, check **I acknowledge that this app creates custom IAM roles**.
5. Choose **Deploy**. After the deployment is completed, it will redirect to Lambda application page, and you can deploy it to Lambda@Edge.

