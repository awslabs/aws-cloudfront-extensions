在部署解决方案之前，建议您先查看本指南中有关架构图和区域支持等信息。然后按照下面的说明配置解决方案并将其部署到您的帐户中。

## Lambda@Edge & CloudFront Functions合集
 
部署时间：约3分钟

### 部署概述

您可以通过点击下表中的部署按钮进行部署，对于Lambda@Edge函数，您也可通过在SAR(Serverless Application Repository)中搜索关键字aws-cloudfront-extensions进行部署。
Lambda@Edge和CloudFront Functions的具体描述可参考[概述](index.md)

#### Lambda@Edge

|    **名称**    | **部署** |
|------------------|--------------------|
| [Authentication with Cognito](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/edge/nodejs/authentication-with-cognito) | [![部署](../images/deploy_button.png)](https://serverlessrepo.aws.amazon.com/applications/us-east-1/418289889111/authentication-with-cognito) |
| [Adding security header](https://github.com/awslabs/aws-cloudfront-extensions/blob/main/edge/nodejs/add-security-headers) | [![部署](../images/deploy_button.png)](https://serverlessrepo.aws.amazon.com/applications/us-east-1/418289889111/add-security-headers) |
| [Serving content based on device type](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/edge/nodejs/serving-based-on-device) | [![部署](../images/deploy_button.png)](https://serverlessrepo.aws.amazon.com/applications/us-east-1/418289889111/serving-based-on-device) |
| [Cross origin resource sharing](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/edge/nodejs/cross-origin-resource-sharing) |  [![部署](../images/deploy_button.png)](https://serverlessrepo.aws.amazon.com/applications/us-east-1/418289889111/cross-origin-resource-sharing) |
| [Modify response status code](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/edge/nodejs/modify-response-status-code)  |  [![部署](../images/deploy_button.png)](https://serverlessrepo.aws.amazon.com/applications/us-east-1/418289889111/modify-response-status-code) |
| [Modify response header](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/edge/nodejs/modify-response-header) |  [![部署](../images/deploy_button.png)](https://serverlessrepo.aws.amazon.com/applications/us-east-1/418289889111/modify-response-header) |
| [Access origin by weight rate](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/edge/nodejs/access-origin-by-weight-rate) | [![部署](../images/deploy_button.png)](https://serverlessrepo.aws.amazon.com/applications/us-east-1/418289889111/access-origin-by-weight-rate) |
| [Failover to alternative origin](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/edge/nodejs/multiple-origin-IP-retry) |  [![部署](../images/deploy_button.png)](https://serverlessrepo.aws.amazon.com/applications/us-east-1/418289889111/multiple-origin-IP-retry) |
| [Support 302 from origin](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/edge/nodejs/http302-from-origin) |  [![部署](../images/deploy_button.png)](https://serverlessrepo.aws.amazon.com/applications/us-east-1/418289889111/http302-from-origin) |
| [Pre-warm](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/edge/python/prewarm) |  [![部署](../images/deploy_button.png)](https://serverlessrepo.aws.amazon.com/applications/us-east-1/418289889111/prewarm) |
| [Resize picture](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/edge/nodejs/resize-picture) |  [![部署](../images/deploy_button.png)](https://serverlessrepo.aws.amazon.com/applications/us-east-1/418289889111/resize-picture) |
| [Anti-hotlinking](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/edge/nodejs/anti-hotlinking) |  [![部署](../images/deploy_button.png)](https://serverlessrepo.aws.amazon.com/applications/us-east-1/418289889111/anti-hotlinking) |
| [Standardize query string](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/edge/nodejs/normalize-query-string) | [![部署](../images/deploy_button.png)](https://serverlessrepo.aws.amazon.com/applications/us-east-1/418289889111/normalize-query-string) |
| [Authentication with Alibaba Cloud](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/edge/nodejs/authentication-with-aliyun-cdn-typeA) |  [![部署](../images/deploy_button.png)](https://serverlessrepo.aws.amazon.com/applications/us-east-1/418289889111/authentication-with-aliyun-cdn-typeA) |
| [Rewrite host for custom origin](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/edge/nodejs/rewrite-url) |  [![部署](../images/deploy_button.png)](https://serverlessrepo.aws.amazon.com/applications/us-east-1/418289889111/rewrite-url) |
| [Serverless load balancer](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/edge/python/serverless-load-balancer) | [![部署](../images/deploy_button.png)](https://serverlessrepo.aws.amazon.com/applications/us-east-1/418289889111/serverless-load-balancer) |
| [Custom response with new URL](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/edge/nodejs/custom-response-with-replaced-url) | [![部署](../images/deploy_button.png)](https://serverlessrepo.aws.amazon.com/applications/us-east-1/418289889111/custom-response-with-replaced-url) |


#### CloudFront Functions
|    **Name**   | **Deploy** |
|------------------|----------------|
| [Add security headers](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/function/js/add-security-headers) | [![部署](../images/deploy_button.png)](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=add-security-headers&templateURL=https:%2F%2Faws-cloudfront-extensions-cff.s3.amazonaws.com%2Fadd-security-headers.yaml) |
| [Cross origin resource sharing](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/function/js/cross-origin-resource-sharing) | [![部署](../images/deploy_button.png)](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=cross-origin-resource-sharing&templateURL=https:%2F%2Faws-cloudfront-extensions-cff.s3.amazonaws.com%2Fcross-origin-resource-sharing.yaml) |
| [Add cache control headers](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/function/js/add-cache-control-header) | [![部署](../images/deploy_button.png)](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=add-cache-control-header&templateURL=https:%2F%2Faws-cloudfront-extensions-cff.s3.amazonaws.com%2Fadd-cache-control-header.yaml) |
| [Add origin headers](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/function/js/add-origin-header) | [![部署](../images/deploy_button.png)](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=add-origin-header&templateURL=https:%2F%2Faws-cloudfront-extensions-cff.s3.amazonaws.com%2Fadd-origin-header.yaml) |
| [Add true client IP headers](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/function/js/add-true-client-ip-header)  | [![部署](../images/deploy_button.png)](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=add-true-client-ip-header&templateURL=https:%2F%2Faws-cloudfront-extensions-cff.s3.amazonaws.com%2Fadd-true-client-ip-header.yaml) |
| [Redirect based on country](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/function/js/redirect-based-on-country) | [![部署](../images/deploy_button.png)](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=redirect-based-on-country&templateURL=https:%2F%2Faws-cloudfront-extensions-cff.s3.amazonaws.com%2Fredirect-based-on-country.yaml) |
| [Default dir index](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/function/js/default-dir-index) | [![部署](../images/deploy_button.png)](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=default-dir-index&templateURL=https:%2F%2Faws-cloudfront-extensions-cff.s3.amazonaws.com%2Fdefault-dir-index.yaml) |
| [Verify JSON web token](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/function/js/verify-jwt) | [![部署](../images/deploy_button.png)](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=verify-jwt&templateURL=https:%2F%2Faws-cloudfront-extensions-cff.s3.amazonaws.com%2Fverify-jwt.yaml) |
| [Customize request host](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/function/js/custom-host) | [![部署](../images/deploy_button.png)](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=custom-host&templateURL=https:%2F%2Faws-cloudfront-extensions-cff.s3.amazonaws.com%2Fcustom-host.yaml) |


#### 在SAR中部署Lambda@Edge

1. 在控制台中打开[Amazon Serverless Application Repository 页面](https://serverlessrepo.aws.amazon.com/applications)
2. 勾选**显示用于创建自定义 IAM 角色或资源策略的应用程序**
3. 搜索 **aws-cloudfront-extensions**，将显示所有扩展，选择一个应用程序（例如 serving-based-on-device）并单击 **部署**。
4. 在应用详情页面，勾选**我确认此应用程序将创建自定义 IAM 角色和资源策略**
5. 选择**部署**。部署完成后会重定向到Lambda应用页面，您可以将其部署到Lambda@Edge。

## 基于Amazon WAF与Amazon Shield的CloudFront安全自动化
 
部署时间：约15分钟

### 部署概述

使用以下步骤在Amazon Web Service上部署此解决方案。

- 在您的Amazon Web Service帐户中启动CloudFormation模板。
- 查看模板参数，并在必要时进行调整。

### 部署步骤

1. 登录到Amazon Web Services管理控制台，选择按钮以启动模板。您可以使用现有CloudFormation模板部署解决方案。[![部署](../images/deploy_button.png)](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=WAFWorkshopSampleWebApp&templateURL=https://aws-gcr-solutions.s3.amazonaws.com/aws-cloudfront-extensions/latest/AwsCloudfrontWafStack.template)
您还可以选择直接[下载模板](https://aws-gcr-solutions.s3.amazonaws.com/aws-cloudfront-extensions/latest/AwsCloudfrontWafStack.template)进行部署。

2. 默认情况下，该模板将在您登录控制台后默认的区域启动，即美国东部（弗吉尼亚北部）区域。若需在指定的区域中启动该解决方案，请在控制台导航栏中的区域下拉列表中选择。

3. 在**创建堆栈**页面上，确认Amazon S3 URL文本框中显示正确的模板URL，然后选择**下一步**。

4. 在参数标签页，查看模板的参数，并根据需要进行修改。

   | 参数 | 默认值 | 说明 |
   |-----------|---------------|---------|
   |WAFBlockPeriod| 240 | 阻止指定IP地址访问的时间（以分钟为单位） |
   | WAFScope | CLOUDFRONT | WAF是否配置在CloudFront |
   | appAccessLogBucket | access-log-bucket-cloudfront | 存储CloudFront访问日志的S3存储桶的名称 |
   | errorThreshold | 50 | 每分钟允许的错误数量  |
   | requestThreshold | 100 | 每个IP地址每五分钟可接受的最大请求数 |
   | wafLogBucketName |waf-log-bucket-cloudfront | 存储WAF日志的S3存储桶的名称 |

   !!! note 说明
         您必须选择在美国东部（弗吉尼亚北部）区域（us-east-1）中为CloudFront创建WAFv2资源。


4. 选择**下一步**。
5. 在**配置堆栈选项**页面上，您可以为您的堆栈中的资源指定标签（键值对）并设置其他选项，然后选择**下一步**。
6. 在**审核**页面，查看并确认设置。确保选中确认模板将创建Amazon Identity and Access Management（IAM）资源的复选框。选择**下一步**。
7. 选择**创建堆栈**以部署堆栈。

您可以在AWS CloudFormation控制台的**状态**列中查看堆栈的状态。正常情况下，大约15分钟内可以看到状态为**CREATE_COMPLETE**。

您还可以选择**输出**标签页查看堆栈资源的详细信息。


## 监控API

部署时间：约15分钟

### 部署概述

您可以在亚马逊云科技上部署并使用解决方案，过程如下：

- 在您的Amazon Web Service帐户中启动CloudFormation模板。
- 查看模板参数，并在必要时进行调整。

### 部署步骤

1. 模板默认在美国东部（弗吉尼亚北部）区域启动。您可以使用现有CloudFormation模板部署解决方案。[![部署](../images/deploy_button.png)](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=cloudFrontExtensionMonitoring&templateURL=https://aws-gcr-solutions.s3.amazonaws.com/aws-cloudfront-extensions/latest/CloudFrontMonitoringStack.template)
   您还可以[下载模板](https://aws-gcr-solutions.s3.amazonaws.com/aws-cloudfront-extensions/latest/CloudFrontMonitoringStack.template)并对其进行修改和拓展。

2. 模板默认在美国东部（弗吉尼亚北部）区域启动。要在不同的AWS区域中启动解决方案，请使用控制台导航栏中的区域选择器。

3. 在参数标签页，查看模板的参数，并根据需要进行修改。
   | 参数 | 默认值 | 说明 |
   |-----------|---------------|---------|
   | CloudFrontDomainList | - | 需要获取监控指标的CloudFront域名列表，若有多个域名，中间以逗号分隔 |
   | CloudFrontLogKeepDays | 120 | S3桶中保存CloudFront实时日志的时间（单位：天） |
   | deployStage | prod | API Gateway部署阶段 |
 


4. 选择**下一步**。
5. 在**配置堆栈选项**页面上，您可以为您的堆栈中的资源指定标签（键值对）并设置其他选项，然后选择**下一步**。
6. 在**审核**页面上，查看并确认设置。选中复选框“我确认，AWS CloudFormation 可能创建 IAM 资源”。
7. 选择**创建堆栈**。您可以在AWS CloudFormation控制台的状态列中查看堆栈的状态。此堆栈应该会在大约15分钟内更新为CREATE_COMPLETE状态。
8. 要查看堆栈资源的详细信息，请选择**输出**标签页。
 
