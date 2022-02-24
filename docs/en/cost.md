### Lambda@Edge & CloudFront Functions Collection
Ttestest
It contains a collection of Lambda@Edge and CloudFront Functions.

|  Service  | Cost  | 
|  ----  | ----  | 
| Lambda@Edge | [Pricing](https://aws.amazon.com/lambda/pricing/) | 
| CloudFront Functions | [Pricing](https://aws.amazon.com/cloudfront/pricing/) | 


### CloudFront Security Automations with Amazon WAF and Amazon Shield
 
You are responsible for the cost of AWS services used when running this solution. As of [February] 2022, the estimated cost is $22.84 per month in the US East (N. Virginia) Region (excludes free tier).

We recommend creating a budget through [AWS Cost Explorer](http://aws.amazon.com/aws-cost-management/aws-cost-explorer/) to help manage costs. For full details, refer to the pricing webpage for each AWS service used in this solution.

|  Service  | Dimensions | Cost/Month | 
|  ----  | ----  | ----  |  
| Amazon Kinesis Data Firehose | 100 GB | $2.9 |
| AWS Lambda | 1M invocations<br>average 500 millisecond and 512 MB memory | $4.37 |
| Amazon API Gateway | 1M requests | ~$3.5 |
| Amazon Athena | 1M queries<br>2GB data scanned per query | $9.77 |
| Amazon Simple Storage Service (S3) | 100 GB | $2.3 |
| Total |  | $22.84 |


### Monitoring Solution
 
You are responsible for the cost of AWS services used when running this solution. As of [February] 2022, the estimated cost is $112.89 per month in the US East (N. Virginia) Region (excludes free tier).

We recommend creating a budget through [AWS Cost Explorer](http://aws.amazon.com/aws-cost-management/aws-cost-explorer/) to help manage costs. For full details, refer to the pricing webpage for each AWS service used in this solution.


|  Service  | Dimensions | Cost/Month | 
|  ----  | ----  | ----  |  
| Amazon Kinesis Data Firehose | 100 records(2KB)/second<br>Dynamic Partitioning enabled | $61.5 |
| Amazon Kinesis Data Stream | 1 shard<br>100 records(2KB)/second<br>168 hours data retention | $29.23 |
| AWS Lambda | 1M invocations<br>average 500 millisecond and 512 MB memory | $4.37 |
| Amazon API Gateway | 1M requests | $3.5 |
| Amazon Athena | 1M queries<br>2GB data scanned per query | $9.77 |
| Amazon Simple Storage Service (S3) | 100 GB | $2.30 |
| Amazon Cognito | 30 MAU | $1.5 |
| Amazon DynamoDB | 1GB data storage<br>2 writes per minute<br>1 read every 2 minutes | $0.72 |
| Total |  | $112.89 |

