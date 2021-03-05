---
title: Deploy a Lambda@Edge function to serve based on devices 
weight: 2
---

In this step, you will find and deploy serverless applications that have been published to the AWS Serverless Application Repository, the application serves content based on device type, for example, mobile device will be forwarded to access content for mobile devices, desktop device will be forwarded to access specific content, and so on so forth

The following diagram is a high-level architecture of this lab

![Auth Architecture](/images/cloudfront-device-arch.png)

The S3 bucket contains a demo website content, it has 4 folders:
- desktop folder: resources in this folder will be returned if the request is from a desktop browser
- mobile folder: resources in this folder will be returned if the request is from a mobile phone 
- smarttv folder: resources in this folder will be returned if the request is from a smarttv 
- tablet folder: resources in this folder will be returned if the request is from a tablet 

Here is how it works

1. The user sends viewer request to CloudFront
2. CloudFront forwards below applicable headers to the origin based on User-Agent in the viewer request, CloudFront will set below headers to true or false, for example, if the request is from a mobile phone, CloudFront will set CloudFront-Is-Mobile-Viewer to true and other three headers to false
   - CloudFront-Is-Desktop-Viewer
   - CloudFront-Is-Mobile-Viewer
   - CloudFront-Is-SmartTV-Viewer
   - CloudFront-Is-Tablet-Viewer
3. CloudFront routes the request to the nearest AWS edge location. The CloudFront distribution will launch a Lambda@Edge function on OriginRequest event
4. Lambda@Edge rewrite the URI according to the headers, for example, it will redirect to mobile resources if the request is from a mobile phone
5. The resources will be returned from the S3 bucket to the user 


## Deploy serving-based-on-device application in SAR

To find and configure an application in the AWS Serverless Application Repository

1. Open [the AWS Serverless Application Repository page](https://serverlessrepo.aws.amazon.com/applications)
2. Check **Show apps that create custom IAM roles or resource policies**
3. Search the application name **serving-based-on-device**, choose the application
   > All CloudFront extensions can be find by searching **aws-cloudfront-extensions**
4. On the application detail page, check **I acknowledge that this app creates custom IAM roles**
5. Choose **Deploy**. After the deployment is completed, it will redirect to application over page

## Deploy resources by CDK
To download CloudFront Extensions code and upload it onto CloudShell
> Skip this step if you already have the codes in CloudShell
1. Go to [CloudFront Extensions code](https://github.com/awslabs/aws-cloudfront-extensions)
2. Choose **Download ZIP**
   ![Github Download ZIP](/images/gh-download.png)
3. Upload the zip package onto CloudShell
   ![CloudShell Upload](/images/cs-upload.png)
4. Unzip the package into home folder

       unzip aws-cloudfront-extensions-main.zip
   {{% notice note %}}
   You can also clone the codes by SSH or Https.
   {{% /notice %}}
   > For SSH, you will need to setup the ssh key in your github account by following this [doc](https://docs.github.com/en/free-pro-team@latest/github/authenticating-to-github/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent)

   > For Https, you will need to enter the username and password. If you have enabled two-factor authentication(2FA), a [personal access key](https://docs.github.com/en/free-pro-team@latest/github/authenticating-to-github/creating-a-personal-access-token) is needed to download the codes


To deploy the demo website
1. Go to [CloudShell](https://console.aws.amazon.com/cloudshell/home?region=us-east-1#)
   > In the top right corner of the console, make sure you’re using this region: **N. Virginia (us-east-1)** 
    
2. Navigate to demo folder and deploy it, below commands will create an S3 bucket to store the website content, so you need to specify an unique S3 bucket name
       
       cd aws-cloudfront-extensions-main/templates/workshop-demo/
       npm install
       npm run build
       # Need to specify an unique S3 bucket name in below command, eg. cloudfront-extension-workshop 
       cdk deploy --parameters staticSiteBucketName=<your_unique_S3_bucket_name>
   Wait until the deployment is completed
   
   If this is the first time you use AWS CDK, you need to bootstrap first or else you will see below error.

       ❌  WorkshopDemoStack failed: Error: This stack uses assets, so the toolkit stack must be deployed to the environment (Run "cdk bootstrap aws://unknown-account/unknown-region")
       at Object.addMetadataAssetsToManifest (/usr/lib/node_modules/aws-cdk/lib/assets.ts:27:11)
       at Object.deployStack (/usr/lib/node_modules/aws-cdk/lib/api/deploy-stack.ts:205:29)
       at processTicksAndRejections (internal/process/task_queues.js:97:5)
       at CdkToolkit.deploy (/usr/lib/node_modules/aws-cdk/lib/cdk-toolkit.ts:180:24)
       at initCommandLine (/usr/lib/node_modules/aws-cdk/bin/cdk.ts:204:9)
       This stack uses assets, so the toolkit stack must be deployed to the environment (Run "cdk bootstrap aws://unknown-account/unknown-region")
   To bootstrap, execute this command

       cdk bootstrap aws://<replace_with_your_aws_account_id>/us-east-1   



3. Go to [CloudFormation console](https://console.aws.amazon.com/cloudformation/home?region=us-east-1), you will see a stack named **WorkshopDemoStack**
4. Choose **WorkshopDemoStack** and click **Outputs** tab, it will show S3 bucket name, demo website url and CloudFront distribution id
   ![Device output](/images/output_device.png)


## Configuration on the CloudFront distribution
1. Open the [CloudFront console](https://console.aws.amazon.com/cloudfront/home#)
2. Choose the distribution that is shown in the outputs 
3. Choose **Behaviors** tab and edit the default cache behavior
4. Do below configuration
   - For **Cache Based on Selected Request Headers**, choose **Whitelist**
   - For **Whitelist Headers**, add 4 custom headers 
     
     CloudFront-Is-Desktop-Viewer 
     
     CloudFront-Is-Mobile-Viewer

     CloudFront-Is-SmartTV-Viewer

     CloudFront-Is-Tablet-Viewer
     
     > Based on the value of the User-Agent header, CloudFront sets the value of four headers to true or false before forwarding the request to your origin

   - For **Object Caching**, choose **Customize**
     
     For Minimum TTL, enter 0
   
     For Maximum TTL, enter 0

     For Default TTL, enter 0
     > This is to disable cache in CloudFront, it will make sure that every request will be reach origin and miss from CloudFront 
    
   - Choose **Yes, Edit** to save the changes

   ![Device CF config](/images/cf-config-device.png)

5. Choose **Origins and Origin Groups** tab, check the checkbox in **Origins** and choose **Edit**
6. Do below configuration
   - Set **Restrict Bucket Access** to Yes
     {{% notice note %}}
     If you can't see **Restrict Bucket Access** options, clean **Origin Domain Name** field and set it to your S3 bucket again to refresh the page
     {{% /notice %}}
   - Set **Origin Access Identity** to **Create a New Identity**
   - Set **Grant Read Permissions on Bucket** to **Yes, Update Bucket Policy**
   - Choose **Yes, Edit** to save the changes
   ![Device Origin config](/images/device-OAI.png)
     

7. Wait until the CloudFront distribution status is Deployed



## Add a CloudFront Trigger to Run the Function

To configure the CloudFront trigger for your function
1. Go to [Lambda console](https://console.aws.amazon.com/lambda/home?region=us-east-1#/functions) and choose **ServingOnDeviceFunction** function which is deployed from SAR 
2. Choose **Action** tab and choose **Deploy to Lambda@Edge**
   ![CF Trigger](/images/CF_trigger_3.png)

3. On the **Deploy to Lambda@Edge** page, enter the following information:

    - Distribution

      The CloudFront distribution which has been created in the stack

    - CloudFront event

      In the drop-down list, choose **Origin request**

   Choose **Deploy**


4. Wait for the function to replicate. This typically takes several minutes

   You can check to see if replication is finished by going to the [CloudFront console](https://console.aws.amazon.com/cloudfront/) and viewing your distribution. Wait for the distribution status to change from In Progress back to **Deployed**, which means that your function has been replicated



## Test the function

1. Open the demo website url in your PC which is shown in the stack outputs 
   
   It will show **T-Rex Runner for Desktop** and x-cache will be **miss from cloudfront** or **refreshhit from cloudfront**

   ![Device test result desktop](/images/test_desktop.png)
   
2. Open the demo website url in your mobile phone browser or simulate it in your desktop browser
   
   It will show **T-Rex Runner for Mobile** and x-cache will be **miss from cloudfront** or **refreshhit from cloudfront**

   ![Device test result mobile](/images/test_mobile.png)

