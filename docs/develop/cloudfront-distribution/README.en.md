---
title: Create a CloudFront Distribution 
weight: 1
---

Before you create the example Lambda@Edge function, you need to have a CloudFront environment to work with that includes an origin to serve content from. If you already have an environment to use, you can skip this step.

To create a CloudFront distribution with an Amazon S3 origin, you will do the following steps

## Create an S3 bucket

1. Sign in to the AWS Management Console and open the Amazon S3 console at https://console.aws.amazon.com/s3/.
2. On the Amazon S3 console, click **Create bucket**
3. In the Create bucket dialog box, enter a unique bucket name and choose **US East (N. Virginia)** Region
   ![S3 Bucket Name](/S3-bucket-name.png)
4. Clear **Block all public access** check box to allow public access
   ![S3 Public Access](/S3-public.png)
   {{% notice note %}}
   You need to allow public read access to the bucket and files so that CloudFront URLs can serve content from the bucket. However, you can restrict access to specific content by using signed URLs or signed cookies
   {{% /notice %}}
5. Leave other options as default and click **Create bucket** 

## Upload your content to Amazon S3
1. In the Buckets pane, choose the bucket you just created, and then choose **Upload**
2. Choose **Add files**, and choose a file that you want to upload, then click **Upload**
3. Choose **Make public** to allow public read access
   ![S3 Public Access on File](/S3-public-file.png)

## Create a CloudFront distribution and add your S3 bucket as an origin 
1. Open the CloudFront console at https://console.aws.amazon.com/cloudfront/
2. Choose **Create Distribution**
3. On the Select a delivery method for your content page, in the **Web** section, choose Get Started
   ![CloudFront Web](/cf-web.png)
4. On the Create Distribution page, for Origin Domain Name, choose the Amazon S3 bucket that you created earlier. For the other settings under Origin Settings, accept the default values. Choose **Create Distribution**
   ![Origin Domain](/cf-origin-domain.png)
5. After CloudFront creates your distribution, the value of the Status column for your distribution changes from In Progress to Deployed. This typically takes a few minutes
   ![CloudFront Deployed](/cf-deployed.png)
6. To test your link, open your link in a browser
   
   The link is in this format: https://\<domain name>/\<object name>
   {{% notice note %}}
   For example, if the domain name is d1v2jstg89nnob.cloudfront.net, the object name is CloudFrontIcon.png, the link will be https://d1v2jstg89nnob.cloudfront.net/CloudFrontIcon.png
   {{% /notice %}}

