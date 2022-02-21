### Lambda@Edge & CloudFront Functions合集

本解决方案包含多个Lambda@Edge函数和CloudFront Functions。使用费用即为相应Lambda@Edge或CloudFront Functions的费用。

|  服务  | 费用  | 
|  ----  | ----  | 
| Lambda@Edge | [费用](https://aws.amazon.com/lambda/pricing/) | 
| CloudFront Functions | [费用](https://aws.amazon.com/cloudfront/pricing/) | 



### 基于Amazon WAF与Amazon Shield的CloudFront安全自动化
您需要承担运行此解决方案时使用亚马逊云科技服务的费用。截至2022年2月，在us-east-1使用默认设置运行此解决方案，成本约为每月$22.84。 

建议您通过[AWS Cost Explorer](http://aws.amazon.com/aws-cost-management/aws-cost-explorer/)创建估算。详细费用信息请参考各亚马逊云科技服务的费用页面。

|  服务  | 用量 | 费用/月 | 
|  ----  | ----  | ----  |  
| Amazon Kinesis Data Firehose | 100 GB | $2.9 |
| AWS Lambda | 1M次请求<br>平均500毫秒的执行时间和512MB内存 | $4.37 |
| Amazon API Gateway | 1M次请求 | ~$3.5 |
| Amazon Athena | 1M次查询<br>每次查询扫描2GB数据 | $9.77 |
| Amazon Simple Storage Service (S3) | 100 GB | $2.3 |
| Total |  | $22.84 |


### 监控API
您需要承担运行此解决方案时使用亚马逊云科技服务的费用。截至2022年2月，在us-east-1使用默认设置运行此解决方案，成本约为每月$112.89。

建议您通过[AWS Cost Explorer](http://aws.amazon.com/aws-cost-management/aws-cost-explorer/)创建估算。详细费用信息请参考各亚马逊云科技服务的费用页面。


|  Service  | Dimensions | Cost/Month | 
|  ----  | ----  | ----  |  
| Amazon Kinesis Data Firehose | 100个记录(2KB)/秒<br>启用动态分区 | $61.5 |
| Amazon Kinesis Data Stream | 1个分区<br>100个记录(2KB)/秒<br>数据保留168小时 | $29.23 |
| AWS Lambda | 1M次请求<br>平均500毫秒的执行时间和512MB内存 | $4.37 |
| Amazon API Gateway | 1M次请求 | $3.5 |
| Amazon Athena | 1M次查询<br>每次查询扫描2GB数据 | $9.77 |
| Amazon Simple Storage Service (S3) | 100 GB | $2.30 |
| Amazon Cognito | 30 MAU | $1.5 |
| Amazon DynamoDB | 1GB数据存储<br>每分钟2次写操作<br>每两分钟1次读操作 | $0.72 |
| Total |  | $112.89 |