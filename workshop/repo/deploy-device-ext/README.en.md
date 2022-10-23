---
title: Deploy an extension in CloudFront Extensions console 
weight: 1
---

The solution provides a set of ready-to-use extensions (Lambda@Edge functions, CloudFront Functions, CloudFormation templates) that could be useful when you use CloudFront. You can deploy them from the solution web console. After deployment, you can use it directly without programming or customize it when needed.


1. In the navigation panel, under **Extensions**, choose **Repository**.
2. Choose **redirect-by-device**, and click **Deploy** button.
   ![Extension Repo Page](/images/ext_repo_page.png)
3. Choose the sample website distribution (you can find it in Outputs tab of **CFExtSampleWorkshop** stack) and choose **Default (*)** under Behaviors. 
  ![Step1](/images/repo_step1.png)

4. Choose **Next**.
5. In **Function associations** page, choose **viewer-request**.
  ![Step2](/images/repo_step2.png)

6. Choose **Next**.
7. In **Review** page, choose **Deploy**.
  ![Step3](/images/repo_step3.png)

8. Choose **View deployment status** to navigate to CloudFormation console for more details.
  ![Status](/images/repo_status.png)
  ![CloudFormation Stack](/images/redirect_stack.png)

You should receive a CREATE_COMPLETE status in approximately 1 minute.

