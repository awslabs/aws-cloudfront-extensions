You are responsible for the cost of the Amazon services used while running this solution. We recommend creating a budget through [Amazon Web Services Cost Explorer](http://aws.amazon.com/aws-cost-management/aws-cost-explorer/) to help manage costs. For full details, refer to the pricing webpage for each service used in this solution.
## Lambda@Edge & CloudFront Functions Collection

It contains a collection of Lambda@Edge and CloudFront Functions.

|  Service  | Cost  | 
|  ----  | ----  | 
| Lambda@Edge | [Pricing](https://aws.amazon.com/lambda/pricing/) | 
| CloudFront Functions | [Pricing](https://aws.amazon.com/cloudfront/pricing/) | 


## CloudFront Security Automations with Amazon WAF and Amazon Shield
 
As of February 2022, to protect against HTTP flood, BadBot, SQL injection and XSS attacks, the estimated cost of using this solution is $22.84 per month in the US East (N. Virginia) Region (excludes free tier).

|  Service  | Dimensions | Cost/Month | 
|  ----  | ----  | ----  |  
| Amazon Kinesis Data Firehose | 100 GB | $2.9 |
| Amazon Lambda | 1M invocations<br>average 500 millisecond and 512 MB memory | $4.37 |
| Amazon API Gateway | 1M requests | ~$3.5 |
| Amazon Athena | 1M queries<br>2GB data scanned per query | $9.77 |
| Amazon Simple Storage Service (S3) | 100 GB | $2.3 |
| Total |  | $22.84 |


### CloudFront Real-time Log Monitoring API
 
 As of February 2022, to monitor 10 metrics for one CloudFront distribution which has 60 records (2KB) every second, the estimated cost of using this solution is $88.56 per month in the US East (N. Virginia) Region (excludes free tier).


|  Service  | Dimensions | Cost/Month | 
|  ----  | ----  | ----  |  
| Amazon Kinesis Data Firehose | 60 records(2KB)/second<br>Dynamic Partitioning enabled | $36.9 |
| Amazon Kinesis Data Stream | 1 shard<br>60 records(2KB)/second<br>168 hours data retention | $27.76 |
| Amazon Lambda | 86K invocations<br>average 500 millisecond and 512MB memory | $0.38 |
| Amazon API Gateway | 86K requests | $0.09 |
| Amazon Athena | 86K queries<br>35MB data scanned per query | $14.42 |
| Amazon Simple Storage Service (S3) | 295GB | $6.79 |
| Amazon Cognito | 30 MAU | $1.5 |
| Amazon DynamoDB | 1GB data storage<br>2 writes per minute<br>1 read every 2 minutes | $0.72 |
| Total |  | $88.56 |

