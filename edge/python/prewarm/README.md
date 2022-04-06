[English | [中文](./README-cn.md)]

# Prewarm

## Description

This Lambda can prewarm static content in specific pop, for example, prewarm a video file in SEA19-C3

After pre-warming the resources, the user can access the resources with lower latency.

## Architecture Diagram

![url](./images/prewarm_arch.png)

1. The urls that need to be prewarmed are stored in a file in the S3 bucket
2. Lambda function read the urls from S3 and send prewarm requests to PoP(Points of Presence)

## Usage

To use this feature

1. Login your AWS account and go to [S3 console](https://s3.console.aws.amazon.com/s3/home)
2. Create an S3 bucket (Skip this step if you already have one)
3. Upload a txt file which contains the urls that need to be pre-warm into this S3 bucket
    
    File content
![url](./images/url.png)
    Upload the file into S3 bucket
![s3](./images/s3.png)

4. Go to [CloudFront Extensions](https://awslabs.github.io/aws-cloudfront-extensions/en/deployment/), find Pre-warm and click Launch Stack button
![deploy](./images/deployment.png)
5. Click Deploy button
6. In create function page, input the parameters. (If your website have a CName, you need to add the mapping in PARA_MAPPING, such as {\"www.example.com\":\"d123456789012.cloudfront.net\",\"www.demo.com\":\"d12dbadtwi013.cloudfront.net\"}.)
![para](./images/para.png)
  
  
   Here're the details of each parameter:

  | Parameter | Description |
  |  ----  | ----  | 
  | PARA_POP | The pop which you want to prewarm, it supports multiple value with comma as separator, eg. 'ATL56-C1, DFW55-C3, SEA19-C3'. You can get the pop node id by x-amz-cf-pop header, please refer to below screenshot |
  | PARA_MAPPING | If your website has CName, you need to specify the relationship between CName and CloudFront domain name. For example, the CName of d123456789012.cloudfront.net is www.example.com, you need to add this JSON line {\"www.example.com\":\"d123456789012.cloudfront.net\"}. Use {} if your website doesn't use CName. |
  | PARA_S3BUCKET  | S3 bucket name to store the file which contains urls to pre-warm. eg. pre-warm-bucket |
  | PARA_S3KEY | The S3 key of the file which contains urls to pre-warm, the file should be stored in an S3 bucket. eg. Prewarm/urls.txt. In this file, each line is a url which means the urls are separated by '\n' |

  PARA_POP: you can get the pop node id by x-amz-cf-pop header when accessing the resources
  
  ![pop](./images/pop.png)

7. Check "I acknowledge ..." checkbox and click Deploy button
8. Keep waiting until the prewarm function is deployed, it will show the deployed resources
  ![res](./images/res.png)
9. Click PrewarmFunction in the resources table
10. Click Test button
![test_button](./images/test_button.png)
11. As this is the first time to click test button, a dialog will be shown. Input an event name and use default values for other paramters
![test_para](./images/test_para.png)
12. Click Save button
13. Click Test button again, the urls will be prewarmed, you will see the result after prewarm is completed
![result](./images/result.png)




## Cleanup

To delete the application that you created, use the AWS CLI. Assuming you used your project name for the stack name, you can run the following:

```bash
aws cloudformation delete-stack --stack-name prewarm
```

