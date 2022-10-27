---
title: Setup monitoring 
weight: 2
---

In this section, we will enable CloudFront standard log and monitor CloudFront metrics on CloudFront Extensions console.

After deployment, you will see two CloudFormation stacks.

![Console Stacks](/images/console_stack.png)

Setup monitoring by following steps:

1. Go to [CloudFormation console](https://us-east-1.console.aws.amazon.com/cloudformation/home?region=us-east-1#)
2. Switch **View nested** on.
   ![View Nested](/images/view_nested.png)
3. Choose the **Outputs** tab of the nested stack (the stack whose name contains **NonRealtimeNestedStack**).
4. You will find the S3 bucket in **S3buckettostoreCloudFrontlogs**. Copy the S3 bucket name.
   ![Nested Stacks](/images/nested_stack.png)
5. Go to [CloudFront console](https://us-east-1.console.aws.amazon.com/cloudfront/v3/home?region=us-east-1#/distributions), choose the distribution created in **CFExtSampleWorkshop** stack (refer to **DistributionID** in the Outputs tab).
  ![Console Stacks](/images/cf_dist_console.png)
  ![Console Stacks](/images/sample_stack_output.png)
  

6. In **General** tab, under **Settings**, click **Edit** button.
  ![Console Stacks](/images/cf_edit.png)

7. Under **Standard logging**, choose **On** and set the S3 bucket to the bucket that you created in the nested stack.
  ![Console Stacks](/images/turn_on_logging.png)

8. Choose **Save changes**.
9. Wait until the distribution **Last modified** field changed from deploying to a specific date time.
  ![Console Stacks](/images/last_modify.png)



