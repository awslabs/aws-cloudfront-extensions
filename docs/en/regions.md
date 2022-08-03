
## Regional deployment

As of August 2022, this solution is supported in the following AWS Regions: 

| Region Name | Region ID |
|----------|--------|
| US East (N. Virginia) | us-east-1
| US East (Ohio) | us-east-2
| US West (Oregon) | us-west-2
| Asia Pacific (Mumbai) | ap-south-1
| Asia Pacific (Tokyo) | ap-northeast-1
| Asia Pacific (Seoul) | ap-northeast-2
| Asia Pacific (Singapore) | ap-southeast-1
| Asia Pacific (Sydney) | ap-southeast-2
| Canada (Central) | ca-central-1
| Europe (Ireland) | eu-west-1
| Europe (London) | eu-west-2
| Europe (Paris) | eu-west-3
| Europe (Frankfurt) | eu-central-1
| South America (São Paulo) | sa-east-1


## Quotas

There are quotas on using SSL/TLS certificates with CloudFront. Refer to the [documentation](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cnames-and-https-limits.html) for more details. 


|  Item  | Quota | Remarks | 
|  ----  | ----  | ----  |  
| Maximum number of certificates per CloudFront distribution | 1 |  |
| Maximum number of certificates that you can import into ACM | 2500 |  |
| Maximum number of certificates per AWS account (dedicated IP addresses only) | 2 | One for everyday use and one for when you need to rotate certificates for multiple distributions. |
| Using the same certificate for CloudFront distributions that were created by using different AWS accounts | No |  |
| Using the same certificate for CloudFront and for other AWS services | Yes |  |



