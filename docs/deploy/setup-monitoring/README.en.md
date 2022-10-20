---
title: Setup monitoring 
weight: 2
---

In this section, we will enable CloudFront standard log and monitor CloudFront metrics on CloudFront Extensions console.

After deployment, you will see two CloudFormation stacks.

![Console Stacks](../../images/console_stack.png)

Setup monitoring by following steps:

1. Choose the **Outputs** tab of the nested stack (the stack whose name contains **NonRealtimeNestedStack**).
2. You will find the S3 bucket in **S3buckettostoreCloudFrontlogs**. Copy the S3 bucket name.
   ![Nested Stacks](../../images/nested_stack.png)
3. Go to [CloudFront console](https://us-east-1.console.aws.amazon.com/cloudfront/v3/home?region=us-east-1#/distributions), choose the distribution created in **CFExtSampleWorkshop** stack (you can find the distribution id in the Outputs tab).
  ![Console Stacks](../../images/cf_dist_console.png)
  ![Console Stacks](../../images/sample_stack_output.png)
  

4. In **General** tab, under **Settings**, click **Edit** button.
  ![Console Stacks](../../images/cf_edit.png)

5. Under **Standard logging**, choose **On** and set the S3 bucket to the bucket that you created in the nested stack.
  ![Console Stacks](../../images/turn_on_logging.png)

6. Choose **Save changes**.
7. Wait until the distribution **Last modified** field changed from deploying to a specific date time.
  ![Console Stacks](../../images/last_modify.png)



