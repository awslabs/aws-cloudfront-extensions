You are responsible for the cost of the AWS services used while running this solution. We recommend creating a budget through [AWS Cost Explorer](http://aws.amazon.com/aws-cost-management/aws-cost-explorer/) to help manage costs. For full details, refer to the pricing webpage for each service used in this solution.


##  CloudFront configuration snapshot
 
As of March 2023, if the configuration of CloudFront distributions are changed 30 times and create 10 snapshots, the estimated cost of using this solution is $0.63 per month in the US East (N. Virginia) Region (excludes free tier).

|  Service  | Dimensions | Cost/Month | 
|  ----  | ----  | ----  |  
| AWS Lambda | 200 invocations<br>average 60 seconds and 256MB memory | $0.01 |
| AWS Appsync | 100 requests | $0.0004 |
| Amazon Simple Storage Service (S3) |  5GB | $0.12 |
| Amazon DynamoDB | 2GB data storage | $0.50 |
| Total |  | ~$0.63 |


##  SSL certificates
 
As of March 2023, if user create 2000 ACM certificates and 2000 CloudFront distribution per month, the estimated cost of using this solution is $26.68 per month in the US East (N. Virginia) Region (excludes free tier).

| Service            | Dimensions                                                    | Cost/Month | 
|--------------------|---------------------------------------------------------------|------------|  
| AWS Lambda         | 11140 invocations<br>average 500 millisecond and 256MB memory | $0         |
| Amazon API Gateway | 5000 requests                                                 | $0         |
| AWS Appsync        | 5000 requests                                                 | $0.02      |
| Step Functions     | 8 x 500 = 4000 states transitions                             | $0         |
| Amazon DynamoDB    | 1000MB data storage                                           | $26.64     |
| Amazon Simple Storage Service (S3) | 1GB storage                                   | $0.02      |
| Total              |                                                               | $26.68     |


##  Non-real time monitoring with CloudFront standard logs
 
As of March 2023, to monitor 10 metrics for one CloudFront distribution which has 60 records (2KB) every second, the estimated cost of using this solution is $22.40 per month in the US East (N. Virginia) Region (excludes free tier).

|  Service  | Dimensions | Cost/Month | 
|  ----  | ----  | ----  |  
| AWS Lambda | 86K invocations<br>average 500 millisecond and 512MB memory | $0.38 |
| Amazon API Gateway | 86K requests | $0.09 |
| Amazon Athena | 86K queries<br>35MB data scanned per query | ~$14.42 |
| Amazon Simple Storage Service (S3) |  295GB | $6.79 |
| Amazon DynamoDB | 1GB data storage<br>2 writes per minute<br>1 read every 2 minutes | $0.72 |
| Total |  | $22.40 |


## Real time monitoring with CloudFront real-time logs
 
 As of March 2023, to monitor 10 metrics for one CloudFront distribution which has 60 records (2KB) every second, the estimated cost of using this solution is $88.56 per month in the US East (N. Virginia) Region (excludes free tier).


|  Service  | Dimensions | Cost/Month | 
|  ----  | ----  | ----  |  
| Amazon Kinesis Data Firehose | 60 records(2KB)/second<br>Dynamic Partitioning enabled | $36.9 |
| Amazon Kinesis Data Stream | 1 shard<br>60 records(2KB)/second<br>168 hours data retention | $27.76 |
| AWS Lambda | 86K invocations<br>average 500 millisecond and 512MB memory | $0.38 |
| Amazon API Gateway | 86K requests | $0.09 |
| Amazon Athena | 86K queries<br>35MB data scanned per query | $14.42 |
| Amazon Simple Storage Service (S3) | 295GB | $6.79 |
| Amazon Cognito | 30 MAU | $1.5 |
| Amazon DynamoDB | 1GB data storage<br>2 writes per minute<br>1 read every 2 minutes | $0.72 |
| Total |  | $88.56 |


## Pre-warming

### Example 1: Pre-warm 500 resources daily, the size of each resource is 500MB

As of March 2023, the estimated cost of using this solution is $171.27 per month in the US East (N. Virginia) Region (excludes free tier).

|  Service  | Dimensions | Cost/Month | 
|  ----  | ----  | ----  |  
| Amazon EC2 | Launch 50 EC2 spot instance (c6g.large), run 2 hours to pre-warm 500 URI daily<br>150GB EBS | $165.97 |
| Amazon Lambda | 45K requests<br>256MB memory<br>ARM64 | $3.67 |
| Amazon API Gateway | 30K requests<br>REST API | $0.03 |
| Amazon Simple Queue Service | Standard queue<br>2GB DTO | $0.18 |
| Amazon DynamoDB | 2GB data storage<br>15K writes<br>15K reads | $0.52 |
| Amazon CloudWatch | 1 metric and alarm | $0.90 |
| Total |  | $171.27 |

### Example 2: Pre-warm 200 resources in one month, the size of each resource is 1GB

As of March 2023, the estimated cost of using this solution is $11.78 per month in the US East (N. Virginia) Region (excludes free tier).

|  Service  | Dimensions | Cost/Month | 
|  ----  | ----  | ----  |  
| Amazon EC2 | m5dn.xlarge Spot instance<br>150GB EBS | $10.59 |
| Amazon Lambda | 28 requests<br>256MB memory<br>ARM64 | $0.01 |
| Amazon API Gateway | 24 requests<br>REST API | $0.0001 |
| Amazon Simple Queue Service | Standard queue<br>1GB DTO | $0.02 |
| Amazon DynamoDB | 1GB data storage<br>2K writes<br>200 reads | $0.25 |
| Amazon CloudWatch | 1 metric and alarm | $0.90 |
| Total |  | $11.78 |

## Pre-warming

### Example 1: Pre-warm 500 resources daily, the size of each resource is 500MB

As of March 2023, the estimated cost of using this solution is $171.27 per month in the US East (N. Virginia) Region (excludes free tier).

|  Service  | Dimensions | Cost/Month | 
|  ----  | ----  | ----  |  
| Amazon EC2 | Launch 50 EC2 spot instance (c6g.large), run 2 hours to pre-warm 500 URI daily<br>150GB EBS | $165.97 |
| Amazon Lambda | 45K requests<br>256MB memory<br>ARM64 | $3.67 |
| Amazon API Gateway | 30K requests<br>REST API | $0.03 |
| Amazon Simple Queue Service | Standard queue<br>2GB DTO | $0.18 |
| Amazon DynamoDB | 2GB data storage<br>15K writes<br>15K reads | $0.52 |
| Amazon CloudWatch | 1 metric and alarm | $0.90 |
| Total |  | $171.27 |

### Example 2: Pre-warm 200 resources in one month, the size of each resource is 1GB

As of March 2023, the estimated cost of using this solution is $11.78 per month in the US East (N. Virginia) Region (excludes free tier).

|  Service  | Dimensions | Cost/Month | 
|  ----  | ----  | ----  |  
| Amazon EC2 | m5dn.xlarge Spot instance<br>150GB EBS | $10.59 |
| Amazon Lambda | 28 requests<br>256MB memory<br>ARM64 | $0.01 |
| Amazon API Gateway | 24 requests<br>REST API | $0.0001 |
| Amazon Simple Queue Service | Standard queue<br>1GB DTO | $0.02 |
| Amazon DynamoDB | 1GB data storage<br>2K writes<br>200 reads | $0.25 |
| Amazon CloudWatch | 1 metric and alarm | $0.90 |
| Total |  | $11.78 |