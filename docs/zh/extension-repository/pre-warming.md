## What is Pre-warming?
Pre-warming is also known as Pre-caching or Pre-fetching. It speeds up content delivery by warming the CloudFront cache. This is very useful when delivering large files. Pre-warming helps offload origin’s traffic, as the same requests will hit the CloudFront cache, origin server receives less requests and consequently it's less likely that the origin server will fall over or become slow. 

### How does it work?
The solution deploys a CloudFormation template, that will install the below architecture in your AWS account. All the cloud resources will be automatically created. After deployed, you will get two REST APIs, one for triggering pre-warm action, the other one for getting pre-warm status.

![prewarm](../../images/prewarm-arch.png)


The CloudFormation template provides the following components and workflows:

1. Scheduler Lambda function inserts initial pre-warm status into the DynamoDB table and invokes cache invalidator.
2. Cache invalidator Lambda function invalidates CloudFront caches for all the URLs and sends messages with requestId, POP and URLs, and so on into SQS.
3. CloudWatch alarm monitors the messages in the queue and notifies the auto scaling group to scale out when messages are sent into the queue.
4. Auto scaling group contains EC2 spot instances. Each instance sends requests to the edge locations and updates the prewarm status into DynamoDB table after consuming the messages from the SQS queue.
5. StatusFetcher function gets the prewarm status from the DynamoDB table.


### Deployment on the web console (Recommended)

The steps to deploy the extensions from the web console are similar. For more information, refer to the section [True Client IP](true-client-ip.md).

### Deployment via CloudFormation
 
**Time to deploy**: Approximately 10 minutes

#### Deployment overview

Use the following steps to deploy this solution on AWS.

- Launch the CloudFormation template into your AWS account.
- Review the template parameters, and adjust them if necessary.

#### Deployment steps

1. Sign in to the AWS Management Console and select the button to launch the CloudFormation template. You can also [download the template](https://aws-gcr-solutions.s3.amazonaws.com/aws-cloudfront-extensions/latest/Prewarm.template) as a starting point for your own implementation.

      [![Deploy](../../images/deploy_button.png)](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=cloudFrontExtensionMonitoring&templateURL=https://aws-gcr-solutions.s3.amazonaws.com/aws-cloudfront-extensions/latest/Prewarm.template)


2. The template launches in the US East (N. Virginia) Region by default. To launch the solution in a different AWS Region, use the Region selector in the console navigation bar.

3. Under Parameters, review the parameters for the template, and modify them as necessary.

      | Parameter | Default value | Description |
      |-----------|---------------|---------|
      | ShowSuccessUrls | false | Show success url list in Prewarm status API (true or false). |
      | InstanceType | m6g.large | EC2 spot instance type to send pre-warm requests. |
      | ThreadNumber | 6 | Thread number to run in parallel in EC2. |
  

4. Choose **Next**.
5. On the **Configure stack options** page, you can specify tags (key-value pairs) for resources in your stack and set additional options, and then choose **Next**.
6. On the **Review** page, review and confirm the settings. Check the boxes acknowledging that the template will create AWS Identity and Access Management (IAM) resources and any additional capabilities required.
7. Choose **Create** to deploy the stack. 

You can view the status of the stack in the CloudFormation Console in the Status column. You should receive a CREATE_COMPLETE status in approximately 10 minutes.

To see details for the stack resources, choose the **Outputs** tab. 




