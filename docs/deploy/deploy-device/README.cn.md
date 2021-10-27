---
title: 部署Lambda@Edge实现根据设备类型返回相应内容
weight: 2
---

在本章中, 您将会在SAR（Serverless Application Repository）中查找并部署一个已发布的无服务器应用。此应用会根据设备类型返回相应内容，例如在手机上访问此网页，会返回手机端网页，在PC浏览器上访问同一网页，会返回桌面端网页

如下是本实验的架构图

![Auth Architecture](/images/cloudfront-device-arch.png)

S3桶包含一个实验网站的内容，桶中有如下4个文件夹：
- desktop: 如果请求是来源于PC浏览器，此文件夹的资源将会返回
- mobile: 如果请求是来源于手机，此文件夹的资源将会返回
- smarttv: 如果请求是来源于智能电视，此文件夹的资源将会返回
- tablet: 如果请求是来源于平板电脑，此文件夹的资源将会返回

实现原理如下

1. 用户向CloudFront发送查看者请求
2. CloudFront将如下请求头转发到源站服务器，此请求头通过查看者请求中的User-Agent获得。 CloudFront会将如下请求头设置为true或者false，例如，如果请求是来源于手机，CloudFront会将CloudFront-Is-Mobile-Viewer设置为true并把其他三个请求头设置为false
   - CloudFront-Is-Desktop-Viewer
   - CloudFront-Is-Mobile-Viewer
   - CloudFront-Is-SmartTV-Viewer
   - CloudFront-Is-Tablet-Viewer
3. CloudFront将请求路由到最近的AWS边缘节点。在源请求阶段，CloudFront REC（区域边缘缓存）上会触发一个Lambda@Edge函数
4. 此Lambda@Edge函数根据请求头重写URI，例如，如果请求来源于手机，那么它将会请求mobile文件夹中的资源
5. S3桶的相应文件夹中的资源将会返回给用户


## 通过SAR部署应用

本步骤中，您将通过SAR(Serverless Application Repository)部署一个Lambda函数到您的账号

1. 打开[AWS SAR(Serverless Application Repository)页面](https://serverlessrepo.aws.amazon.com/applications)
2. 勾选搜索栏下方的**Show apps that create custom IAM roles or resource policies**复选框
3. 在搜索栏中输入**serving-based-on-device**并搜索, 点击应用链接进入应用详情页面，点击**Deploy**按钮
   > 您可通过搜索关键字**aws-cloudfront-extensions**找到所有CloudFront extensions
4. 在应用详情页面中，勾选**I acknowledge that this app creates custom IAM roles**
5. 点击**Deploy**按钮。等待直到部署成功，部署完成后会自动跳转到无服务器应用页面


接下来，您将开始部署网站，您可选择通过CDK或者CloudFormation部署网站

## 通过CloudFormation部署网站

本步骤中，您将会通过CloudFormation部署实验网站

1. 点击如下部署按钮开始部署
   [![部署](/images/deploy_button.png)](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=cf-ext-workshop-serving-on-device&templateURL=https://aws-cloudfront-extensions-workshop.s3.amazonaws.com/assets/workshopServingOnDeviceType.template)

2. 点击输入S3桶名后点击下一步
3. 使用默认选项，点击下一步
4. 勾选**我确认，AWS CloudFormation 可能创建 IAM 资源。**复选框后，点击**创建堆栈**按钮
   ![CloudFormation Agreement Checkbox](/images/cf-agree.png)
5. 等待堆栈创建完成
6. 选择**cf-ext-workshop-serving-on-device**并点击**输出**标签页，你将会在看到创建的S3桶名称，demo website url和CloudFront分配id
   ![Device output](/images/output_device.png)


## 通过CDK部署网站

{{% notice note %}}
若您已经通过CloudFormation部署过网站，可跳过此步骤
{{% /notice %}}

本步骤中，您将会通过CDK(Cloud Development Kit)部署实验网站，本实验使用CloudShell作为CDK运行环境

下载CloudFront Extensions代码并上传到CloudShell
> 如果您已经在CloudShell中有CloudFront Extensions代码，您可跳过此步骤
1. 访问[CloudFront Extensions代码](https://github.com/awslabs/aws-cloudfront-extensions)
2. 选择**Download ZIP**
   ![Github Download ZIP](/images/gh-download.png)
3. 将zip包上传到CloudShell
   ![CloudShell Upload](/images/cs-upload.png)
4. 解压到home文件夹

       unzip aws-cloudfront-extensions-main.zip
   {{% notice note %}}
   您也可通过SSH或Https下载代码
   {{% /notice %}}
   > 若使用SSH, 您需要按照链接中的操作设置您的github账号的ssh key [doc](https://docs.github.com/en/free-pro-team@latest/github/authenticating-to-github/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent)

   > 若使用Https, 您需要输入github用户名和密码。如果您已开启two-factor authentication(2FA)，下载代码时您还将需要[personal access key](https://docs.github.com/en/free-pro-team@latest/github/authenticating-to-github/creating-a-personal-access-token)


部署实验网站
1. 进入[CloudShell](https://console.aws.amazon.com/cloudshell/home?region=us-east-1#)
   > 请确保右上角的区域选择为： **弗吉尼亚北部 (us-east-1)** 
    
2. 进入demo文件夹并执行部署，如下命令会创建一个存有网站内容的S3桶，您需要在执行命令时指定一个独一无二的S3桶名字
       
       cd aws-cloudfront-extensions-main/templates/workshop-demo/
       npm install
       npm run build
       # Need to specify an unique S3 bucket name in below command, eg. cloudfront-extension-workshop 
       cdk deploy --parameters staticSiteBucketName=<your_unique_S3_bucket_name>
   等待直到部署完成
   
   如果这是您第一次使用CDK，您需要首先进行bootstrap，否则在执行CDK命令时会报如下错误

       ❌  WorkshopDemoStack failed: Error: This stack uses assets, so the toolkit stack must be deployed to the environment (Run "cdk bootstrap aws://unknown-account/unknown-region")
       at Object.addMetadataAssetsToManifest (/usr/lib/node_modules/aws-cdk/lib/assets.ts:27:11)
       at Object.deployStack (/usr/lib/node_modules/aws-cdk/lib/api/deploy-stack.ts:205:29)
       at processTicksAndRejections (internal/process/task_queues.js:97:5)
       at CdkToolkit.deploy (/usr/lib/node_modules/aws-cdk/lib/cdk-toolkit.ts:180:24)
       at initCommandLine (/usr/lib/node_modules/aws-cdk/bin/cdk.ts:204:9)
       This stack uses assets, so the toolkit stack must be deployed to the environment (Run "cdk bootstrap aws://unknown-account/unknown-region")
   执行如下命令进行bootstrap

       cdk bootstrap aws://<replace_with_your_aws_account_id>/us-east-1   



3. 进入[CloudFormation console](https://console.aws.amazon.com/cloudformation/home?region=us-east-1)，您将会看到一个名叫**WorkshopDemoStack**的堆栈
4. 选择**WorkshopDemoStack**并点击**输出**标签页，你将会在看到创建的S3桶名称，demo website url和CloudFront分配id
   ![Device output](/images/output_device.png)


## 配置CloudFront分配

本步骤中，您将配置CloudFront分配

1. 进入[CloudFront console](https://console.aws.amazon.com/cloudfront/home#)
2. 选择上面步骤部署完成的分配
3. 进入**行为**标签页，选择列表中的默认行为并点击编辑按钮
4. 按照如下进行配置
   - 在**缓存键和源请求**中，选择**Legacy cache settings**，然后在**标题**中，选择**包含以下标题**，并添加如下四个标头
     
     CloudFront-Is-Desktop-Viewer 
     
     CloudFront-Is-Mobile-Viewer

     CloudFront-Is-SmartTV-Viewer

     CloudFront-Is-Tablet-Viewer
     
     > 在请求回源前，CloudFront会根据User-Agent请求头将此四个请求头设置为true或false

   - 在**对象缓存**, 选择**Customize**
     
     将Minimum TTL、Maximum TTL、Default TTL都设置为0
     > 此操作是为了禁用CloudFront缓存，从而每次请求都会回源
    
   - 点击最下方**保存更改**按钮保存

   ![Device CF config](/images/cf-config-device.png)

5. 选择**源**标签页，勾选源并点击右上角**编辑**按钮
6. 按照如下进行配置
   - 将**S3 存储桶访问**设置为**是的，使用 OAI (存储桶可以限制只访问 CloudFront)**
     {{% notice note %}}
     如果您不能在页面上看到**S3 存储桶访问**选项，将**源域**下拉框中的内容删除，然后重新设置为您的S3桶用来刷新页面
     {{% /notice %}}
   - 在**来源访问标识**中，点击**创建新的OAI**按钮
   - 在**存储桶策略**中，选择**是，更新存储桶策略**选项
   - 点击最下方**保存更改**按钮
   ![Device Origin config](/images/device-OAI.png)
     

7. 等待直到CloudFront分配部署完成



## 配置CloudFront作为Lambda的触发器

本步骤中，您将为上面部署完成的Lambda配置触发器

1. 进入[Lambda console](https://console.aws.amazon.com/lambda/home?region=us-east-1#/functions) 并选择刚才通过SAR部署完成的**ServingOnDeviceFunction**函数
2. 点击右上角**操作**菜单并选择**部署到Lambda@Edge**
   ![CF Trigger](/images/CF_trigger_3.png)

3. 在**部署到Lambda@Edge**页面中，输入如下内容：

    - 分配

      上面步骤中通过CloudFormation堆栈创建的CloudFront分配

    - CloudFront事件

      在下拉框中，选择**源请求**

   点击**部署**按钮


4. 等待Lambda函数部署完成
5. 您可打开[CloudFront Console](https://console.aws.amazon.com/cloudfront/)查看部署进展


## 测试

1. 在浏览器中打开上面步骤中CloudFormation堆栈输出的**demo website url**
   
   网页上会显示**T-Rex Runner for Desktop**并且x-cache请求头为**miss from cloudfront**或**refreshhit from cloudfront**

   ![Device test result desktop](/images/test_desktop.png)
   
2. 在手机浏览器中打开同样的网站链接
   
   网页上会显示**T-Rex Runner for Mobile**并且x-cache请求头为**miss from cloudfront**或**refreshhit from cloudfront**

   ![Device test result mobile](/images/test_mobile.png)

