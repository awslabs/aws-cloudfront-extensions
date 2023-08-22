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



