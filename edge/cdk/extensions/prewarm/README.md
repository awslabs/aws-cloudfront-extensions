[English | [中文](./README-cn.md)]

# Prewarm

## Overview

Pre-warm or prefetching is warming the CloudFront cache for the purpose of speeding up content delivery. It is especially useful in terms of delivering large files. Another benefit is origin offload, by pre-warming, the same requests will hit the CloudFront cache, so the origin server gets less requests and consequently it's less likely that the origin server will fall over or become slow.

You can click the CloudFormation link in Deployment section to automatically deploy prewarm solution. After deployment, it will create two REST API, one for triggering prewarm, the other one for getting prewarm status.

## Architecture Diagram

![Arch](./image/PrewarmAPI-arch.png)

The CloudFormation template provides the following components and workflows


1. API Handler Lambda receives requests from API Gateway, deduplicates URLs, writes them to a CSV file named with a request ID, uploads the file to S3, creates an Eventbridge timer according to the incoming shutdown event, starts EC2 instances within the ASG as per the specified parameters, and stores the request body in the Request table in DynamoDB.

2. The Request table in DynamoDB has a DynamoDB stream enabled. The stream of the Request table triggers the Get Size Lambda and Task Lambda.

3. Get Size Lambda downloads the CSV file named with the request ID from S3, iterates through the URL list, executes curl commands to determine the size of each file, summarizes the file sizes, and stores the total size in the total_size field of the Request table in bytes. It also writes back problematic URLs and successful URLs to S3.

4. The Task Lambda receives all POP points and CloudFront domain information from the DynamoDB stream, downloads the CSV file named with the request ID from S3 to obtain the URL list, iterates through the POPs to obtain IP lists using dig, stores them in the Request-Pop table in DynamoDB, iterates through the URLs, and sends tasks to the prewarm_task queue based on the matching of each URL with POP points. 

5. EC2 instances in the ASG retrieve tasks from the prewarm_task queue, execute curl commands to download files, and store download results in the Request-Task table, including file sizes and success of downloads. The EC2 instances use a standard Amazon Linux 2023 AMI, which downloads agent code from S3 and conducts pre-warming during startup.

6. The Request-Task table has a DynamoDB stream enabled, which triggers the Aggregation Lambda. The Aggregation Lambda batch processes download tasks, aggregates file sizes, and updates the downloaded_size field of the Request table, obtaining the cumulative download size.

7. The timer triggers the Shutdown Lambda at the scheduled time. The Shutdown Lambda terminates all EC2 instances in the ASG, terminating ongoing pre-warming. It also deletes all messages in the prewarm_task queue.


## Deployment

Time to deploy: Approximately 15 minutes

### Deployment overview

Use the following steps to deploy this solution on Amazon Web Services.

* Launch the CloudFormation template into your Amazon Web Services account.
* Review the template parameters, and adjust them if necessary.

### Deployment steps

1. Log in to the Amazon Web Services Management Console and select the button to launch the template. You can also choose to [download the template directly](https://aws-gcr-solutions.s3.amazonaws.com/Aws-cloudfront-extensions/latest/custom-domain/PrewarmStack.template.json) / [download the template - use existing VPC template](https://aws-gcr-solutions.s3.amazonaws.com/Aws-cloudfront-extensions/latest/custom-domain/PrewarmStack.template.json) for deployment.

      [![Deploy](../../images/deploy_button.png)](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=prewarm&templateURL=https://aws-gcr-solutions.s3.amazonaws.com/Aws-cloudfront-extensions/latest/custom-domain/PrewarmStack.template.json)
      [![Deploy](../../images/deploy_button.png)](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=prewarm&templateURL=https://aws-gcr-solutions.s3.amazonaws.com/Aws-cloudfront-extensions/latest/custom-domain/PrewarmStack.template.json)


2. The template launches in the US East (N. Virginia) Region by default. To launch the solution in a different AWS Region, use the Region selector in the console navigation bar.

3. In the Parameters section, review the template parameters and modify as necessary.
4. For the default template parameters when choosing direct deployment, they are as follows:

      | Parameter             | Default Value | Description                           |
      |-----------------------|---------------|---------------------------------------|
      | envName | prod      | The environment for deployment.                         |
5. For the parameters when choosing to deploy with an existing VPC template, they are as follows:

      | Parameter             | Default Value  | Description                     |
      |-----------------------|----------------|---------------------------------|
      | envName | prod | The environment for deployment.             |
      |     vpc         | None, required | The VPC where you want to deploy.    |
      |     subnet       | None, required | The public subnet in the VPC you want to deploy.       |
      |     sg          | None, required | The security group you want to use.        |
      |     key         | None, required | The keypair for security.            |
      |     vpce           | None, optional | The endpoint for private API when needed to deploy as private. |
6. Select **Next**.
7. On the Configure stack options page, you can specify tags (key-value pairs) for the resources in the stack and set other options, then select **Next**.
8. On the Review page, review and confirm the settings. Ensure that you select the checkbox to acknowledge that the template will create IAM resources. Select **Next**.
9. Choose **Create stack** to deploy the stack.


You can view the status of the stack in the CloudFormation Console in the Status column. You should receive a CREATE_COMPLETE status in approximately 15 minutes.

To see details for the stack resources, choose the *Outputs* tab.

## API Definition

## prewarm
### Request prewarm
- **HTTP Method:** `POST`
- **Request Parameters**

| **Name**        | **Type**  | **Required** | **Description**                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
|-----------------|-----------|--------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| url_list        | *List*    | Yes          | List of URLs to preheat                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| cf_domain       | *String*  | Yes          | CloudFront domain ending in [cloudfront.net](http://cloudfront.net/). If not set, it will be searched for cf_domain based on CNAME in the url_list                                                                                                                                                                                                                                                                                                                          |
| timeout         | *Number*  | Yes          | Represents the preheat time limit. Preheating process will automatically stop if timeout is reached                                                                                                                                                                                                                                                                                                                                                                         |
| target_type     | *String*  | Yes          | Preheating target type. You can specify 3 types of values, including: "pop", "country", "region".<br>"pop": Preheat based on nodes<br>"country": Preheat based on country<br>"region": Preheat based on region. If you choose one of the values pop country region, the corresponding pops countries regions need to be filled in with the corresponding values to be preheated. If not filled in, the system will default to preheat according to some pops of preheating. |
| pops            | *List*    | No           | List of pops to preheat. Details as follows:                                                                                                                                                                                                                                                                                                                                                                                                                                |
| countries       | *List*    | No           | List of countries to preheat. Details as follows:                                                                                                                                                                                                                                                                                                                                                                                                                           |
| regions         | *List*    | No           | List of regions to preheat. Details as follows:                                                                                                                                                                                                                                                                                                                                                                                                                             |
| instance_count  | *Number*  | Yes          | Number of instances to preheat                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| need_invalidate | *Boolean* | No           | Whether to clear cache before preheating, default false                                                                                                                                                                                                                                                                                                                                                                                                                     |

- **Different values need to be set according to different target_type**
    * When target_type is "pop", pops field needs to pass a list of pop ids, indicating preheating at the specified edge nodes in the list (it is better to cooperate with the opening of Origin Shield effect, details see [link](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/origin-shield.html#enable-origin-shield)), for example ["ATL56-C1", "DFW55-C3"], if pass empty [] will be preheated by default some pop points of system
    * When target_type is "region", regions field needs to pass the following value list range, indicating preheating in specific regions (it is better to cooperate with the opening of Origin Shield effect, details see [link](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/origin-shield.html#enable-origin-shield)), for example ["apac", "au"], if pass empty [] will be preheated by default some pop points in the following regions, available regions are:
          * apac： Asia-Pacific
          * au： Australia
          * ca： Canada
          * sa： South Africa
          * eu： Europe
          * jp： Japan
          * us： United States
          * cn： China(Ensure that you have deployed the preheating solution in Beijing or Ningxia, China region)
    * When target_type is "country", countries field needs to pass the following value list range, indicating preheating in specific countries (it is better to cooperate with the opening of Origin Shield effect, details see [link](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/origin-shield.html#enable-origin-shield)) or country code list, for example ["india", "new_zealand"], if pass empty [] will be preheated by default some pop points in the following countries, available countries are:
          * india： India
          * japan： Japan
          * new_zealand： New Zealand
          * australia：Australia
          * malaysia： Malaysia
          * china： China(Ensure that you have deployed the preheating solution in Beijing or Ningxia, China region)
          * indonesia：Indonesia
          * philippines：Philippines
          * singapore：Singapore
          * thailand： Thailand
          * vietnam：Vietnam
          * south_korea： South Korea

- **Request Example**
```json
{
    "url_list": [
        "https://www.example.com/index.html",
        "https://www.example.com/css/bootstrap-icons.css"
    ],
    "cf_domain": "www.example.com",
    "target_type": "pop",
    "countries": [],
    "regions": [],
    "pops": [
        "ATL56-C1",
        "SIN2-C1",
        "DFW55-C3"
    ],
    "timeout": 5,
    "header": [],
    "instance_count": 1,
    "need_invalidate": false
}
```


### Response
- Response parameters

| **Name**      | **Type** | **Description**                                                                                                                              |
|---------------|----------|----------------------------------------------------------------------------------------------------------------------------------------------|
| status        | *String* | Status of the pre-warm request: Success or Failed                                                                                            |
| error_message | *String* | Error message if any                                                                                                                         |
| request_id    | *String* | ID of the pre-warm request. You can use this to retrieve the latest status of the pre-warm request or adjust the instance count via the API. |
| error_urls    | *list*   | List of URLs with issues in the pre-warm request                                                                                             |
| timestamp     | *String* | Timestamp of the pre-warm request                                                                                                            |
| timeout_at    | *String* | Timeout duration                                                                                                                             |


- Response example

``` json
{
    "status": "Success",
    "error_message": "",
    "error_urls": [],
    "request_id": "e059b77b-e427-4489-a50b-4d8c652f114c",
    "timestamp": "2024-04-16 03:12:21.046535",
    "timeout_at": "2024-04-16 03:17:21.046535"
}
```

## prewarm 
### Query Prewarm Progress 

- HTTP Method: `GET`
- Request parameters

| **Name** | **Type** | **Description**                                                                    |
|----------|----------|------------------------------------------------------------------------------------|
| req_id   | *String* | The request id generated after a pre-warm is scheduled, it is in the query string. |

- Request example

``` json
{
  "req_id": "4f780687-9774-48cd-bd7d-db836abf45af"
}
```

### Response
- Response parameters

| **Name**               | **Type** | **Description**                                                        |
|------------------------|----------|------------------------------------------------------------------------|
| status                 | *String* | Status of the pre-warm process: FINISHED, IN_PROGRESS, TIMEOUT, FAILED |
| total_count            | *Number* | Total number of URLs to pre-warm                                       |
| download_count         | *Number* | Total number of URLs pre-warmed                                        |
| percentage_complete    | *Number* | Percentage of URLs pre-warmed                                          |
| in_progress_task_count | *Number* | Number of URLs currently in pre-warm process                           |
| available_task_count   | *Number* | Number of URLs yet to be pre-warmed                                    |
| download_size          | *Number* | Size of downloaded files                                               |
| total_size             | *Number* | 	Total size of files to pre-warm                                       |
| created_at             | *String* | Creation timestamp of the request                                      |
| last_update_time       | *String* | Timestamp of the last update                                           |
| timestamp              | *String* | Timestamp of the request                                               |
| request_id             | *String* | ID of the pre-warm request                                             |

- Response example

``` json
{
    "request_id": "684153cc-efab-4a53-9409-357fddc2e2bd",
    "download_size": 137368,
    "total_size": 206052,
    "percentage_complete": 66,
    "available_task_count": 0,
    "in_progress_task_count": 0,
    "download_count": 6,
    "total_count": 6,
    "created_at": "2024-04-16 03:10:21.405303",
    "last_update_time": "2024-04-16 03:11:53.531414",
    "timestamp": "2024-04-16 03:15:09.499889",
    "status": "FINISHED"
}
```

## summary
### Request Prewarm Report
- HTTP Method: `GET`
- Request Parameters

| **Name** | **Type** | **Description**                                                   |
|----------|----------|-------------------------------------------------------------------|
| req_id   | *String* | ID of the pre-warm request, specifying the ID in the query string |
- Request Example

``` json
{
  "req_id": "4f780687-9774-48cd-bd7d-db836abf45af"
}
```

### Response
- Response Parameters

| **Name**                | **Type** | **Description**                                                        |
|-------------------------|----------|------------------------------------------------------------------------|
| status                  | *String* | Status of the pre-warm process: FINISHED, IN_PROGRESS, TIMEOUT, FAILED |
| failure_pops            | *List*   | List of failed points of presence (POPs)                               |
| failure_urls            | *List*   | List of failed URLs                                                    |
| failure_pop_urls_report | *String* | Report URL for failed POPs and URLs                                    |
| created_at              | *String* | Creation timestamp of the request                                      |
| last_update_time        | *String* | Timestamp of the last update                                           |
| timestamp               | *String* | Timestamp of the request                                               |
| request_id              | *String* | ID of the pre-warm request                                             |

- Response Example
``` json
{
    "request_id": "684153cc-efab-4a53-9409-357fddc2e2bd",
    "failure_pops": [],
    "failure_urls": [
        ""
    ],
    "failure_pop_urls_report": "http://reporturl",
    "timestamp": "2024-04-16 03:12:54.605891",
    "created_at": "2024-04-16 03:10:21.405303",
    "last_update_time": "2024-04-16 03:11:53.531414",
    "status": "FINISHED"
}
```

## instances
### Change Instance Count
- HTTP Method: `POST`
- Request Parameters

| **Name**        | **Type**  | **Description**                                                   |
|-----------------|-----------|-------------------------------------------------------------------|
| req_id          | *String*  | ID of the pre-warm request, specifying the ID in the query string |
| DesiredCapacity | *Number*  | Desired number of instances to change to                          |
| force_stop      | *Boolean* | Whether to force-stop the pre-warm process                        |
- Request Example

``` json
{
    "req_id": "684153cc-efab-4a53-9409-357fddc2e2bd",
    "DesiredCapacity": 1
    // "force_stop": false
}
```

### Response
- Response Parameters

| **Name**  | **Type** | **Description**                                           |
|-----------|----------|-----------------------------------------------------------|
| status    | *String* | Status of the instance changed process: success or failed |
| timestamp | *String* | Timestamp of the request                                  |
| message   | *String* | Message                                                   |

- Response Example
``` json
{
    "status": "success",
    "timestamp": "2024-04-16 03:54:40.366685",
    "message": "Auto Scaling Group prewarm_asg_prod updated to Desired Capacity: 1"
}
```

## instances
###  Query Instance Count
- HTTP Method: `GET`

### Response
- Response Parameters

| **Name**        | **Type** | **Description**                                           |
|-----------------|----------|-----------------------------------------------------------|
| status          | *String* | Status of the instance changed process: success or failed |
| desiredcapacity | *Number* | Desired number of instances to change to                  |
| timestamp       | *String* | Timestamp of the request                                  |
| message         | *String* | Message                                                   |

- Response Example
``` json
{
    "status": "success",
    "timestamp": "2024-04-16 03:56:39.210951",
    "message": "query success",
    "desiredcapacity": 1
}
```




## Cost
As of May 2022, pre-warm 50 urls 4 times, each url has 1GB resource, the estimated cost of using this solution is $11.78 per month in the US East (N. Virginia) Region (excludes free tier).

|  Service  | Dimensions | Cost/Month | 
|  ----  | ----  | ----  |  
| Amazon EC2 | m5dn.xlarge Spot instance<br>150GB EBS | $10.59 |
| Amazon Lambda | 28 requests<br>256MB memory<br>ARM64 | $0.01 |
| Amazon API Gateway | 24 requests<br>REST API | $0.0001 |
| Amazon Simple Queue Service | Standard queue<br>1GB outbound data transfer | $0.02 |
| Amazon DynamoDB | 1GB storage<br>2000 write requests per month<br>200 read requests per month | $0.25 |
| Amazon CloudWatch | 1 CloudWatch metric and alarm | $0.90 |
| Total |  | $11.78 |

## Uninstall

To delete the application that you created, use the AWS CLI. Assuming you used your project name for the stack name, you can run the following:

```bash
aws cloudformation delete-stack --stack-name prewarm
```

