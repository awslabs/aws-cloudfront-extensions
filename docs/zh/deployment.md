在部署解决方案之前，建议您先查看本指南中有关架构图和区域支持等信息。然后按照下面的说明配置解决方案并将其部署到您的帐户中。


## CloudFront Extensions控制台

部署时间：约15分钟


### 部署步骤

1. 登录到[AWS管理控制台](https://console.aws.amazon.com/)，选择按钮以启动模板。您还可以选择直接[下载模板](https://aws-gcr-solutions.s3.amazonaws.com/Aws-cloudfront-extensions/latest/custom-domain/CloudFrontExtnConsoleStack.template.json) 进行部署。

      [![Deploy](../images/deploy_button.png)](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=cloudFrontExtensionsConsole&templateURL=https://aws-gcr-solutions.s3.amazonaws.com/Aws-cloudfront-extensions/latest/custom-domain/CloudFrontExtnConsoleStack.template.json)


2. 默认情况下，该模板将在您登录控制台后默认的区域启动，即美国东部（弗吉尼亚北部）区域。若需在指定的区域中启动该解决方案，请在控制台导航栏中的区域下拉列表中选择。

3. 在参数部分，查看模板的参数，并根据需要进行修改。

      | 参数             | 默认值 | 说明                                                                                                                                 |
      |-----------|---------------|---------|
      | EmailAddress          | - | 接收SSL证书通知的电子邮箱地址。                                                                                    |
      | InitialUserEmail               | - | Web控制台的初始用户电子邮箱。                                                                                                 |
      | InitialUserName  | - | Web控制台的初始用户名。                                                                                                   |
      | InitialUserPassword  | - | Web控制台的初始用户密码。                                                                                              |
      | Monitoring            | no | 您可以将其设置为“yes-Realtime”以从实时日志中获取监控指标，也可以将其设为“yes-Non-Realtime”以获取标准日志中的监控指标。默认情况下，它是“no”，这意味着它不会部署监控功能。请参阅[监控](./monitoring/overview.md)以获取更多信息。                                    |
      | CloudFrontDomainList  | - | CloudFront域名列表。如需监控多个域名，使用逗号分隔多个域名。填入“ALL”监视AWS帐户中的所有域名。 |
      | CloudFrontLogKeepDays | 120 | 将CloudFront日志保存在S3存储桶中的天数。                                                                     |
      | DeleteLog   | false | 您可以将其设置为'true'以删除S3存储桶中的原始CloudFront标准日志。默认情况下，它为“false”。                                                                      |
      | UseStartTime   | false | 如果指标数据的时间基于开始时间，可以将其设置为“true”，如果指标数据的时间基于结束时间，则可以将其设置为“false” 。       |


4. 选择**下一步**。
5. 在**配置堆栈选项**页面上，您可以为堆栈中的资源指定标签（键值对）并设置其他选项，然后选择**下一步**。
6. 在**审核**页面，查看并确认设置。确保选中确认模板将创建Amazon Identity and Access Management（IAM）资源的复选框。选择**下一步**。
7. 选择**创建堆栈**以部署堆栈。

您可以在Amazon CloudFormation控制台的**状态**列中查看堆栈的状态。正常情况下，大约15分钟内可以看到状态为**CREATE_COMPLETE**。



### 部署后的操作

您还可以选择**输出**标签页查看堆栈资源的详细信息。

- 您可以在**WebConsoleCloudFrontURL**中找到CloudFront Extensions控制台的链接。登录控制台时输入初始用户名和密码，它们在您部署堆栈时通过InitialUserName和InitialUserPassword参数进行定义。
- 对于监控API，本解决方案会创建一个名字包含**NonRealtimeNestedStack**或**RealtimeNestedStack**的嵌套堆栈，您可以在此嵌套堆栈的**输出**标签页中找到监控API的链接。 

CloudFormation堆栈部署了如下模块：

- 监控：如果您在部署CloudFormation堆栈时将Monitoring参数设置为yes-Realtime或 yes-Non-Realtime，您将会部署监控模块到您的AWS账号，请参考[监控](./monitoring/overview.md)获取更多信息。
- 分配管理：您可以通过本解决方案管理快照和SSL证书，请参考[分配管理](./distribution-management/overview.md)获取更多信息。 
- 扩展存储库：该解决方案提供了一些扩展帮助您更方便的使用CloudFront。您可以从解决方案web控制台中部署它们，部署后，您可以直接使用它而无需编程，或者在需要时对其进行自定义。您可以部署一系列开箱即用的CloudFront扩展(如：Lambda@Edge函数、CloudFront Functions、CloudFormation模板），请参考[扩展存储库](./extension-repository/overview.md)获取更多信息。


## Lambda@Edge & CloudFront Functions合集
 
部署时间：约3分钟

### 部署概述

您可以点击下表中的部署链接进行部署。对于Lambda@Edge函数，您也可通过在SAR (Serverless Application Repository)中搜索关键字aws-cloudfront-extensions进行部署。


#### Lambda@Edge

|    **名称**   | **部署链接** |
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
|    **名称**   | **部署链接** |
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



#### 在SAR中部署Lambda@Edge

1. 在控制台中打开[Amazon Serverless Application Repository页面](https://serverlessrepo.aws.amazon.com/applications)。
2. 勾选**显示用于创建自定义 IAM 角色或资源策略的应用程序**。
3. 搜索**aws-cloudfront-extensions**，将显示所有扩展，选择一个应用程序（例如，serving-based-on-device）并单击**部署**。
4. 在应用详情页面，勾选**我确认此应用程序将创建自定义 IAM 角色和资源策略**。
5. 选择**部署**。部署完成后会重定向到Lambda应用页面，您可以将其部署到Lambda@Edge。
