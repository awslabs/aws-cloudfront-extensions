您需要承担运行解决方案时使用亚马逊云科技各项服务的成本费用。建议您通过[Amazon Web Services Cost Explorer](http://aws.amazon.com/aws-cost-management/aws-cost-explorer/)创建估算，详细费用信息请参考各亚马逊云科技服务的费用页面。

## Lambda@Edge & CloudFront Functions合集
Lambda@Edge & CloudFront Functions合集的成本费用主要包含多个Lambda@Edge函数和CloudFront Functions的使用费用。

|  服务  | 费用  | 
|  ----  | ----  | 
| Lambda@Edge | [参考链接](https://aws.amazon.com/lambda/pricing/) | 
| CloudFront Functions | [参考链接](https://aws.amazon.com/cloudfront/pricing/) | 


## 基于Amazon WAF与Amazon Shield的CloudFront安全自动化
截至2022年2月，在美国东部（弗吉尼亚北部）区域（us-east-1），使用默认设置运行基于Amazon WAF与Amazon Shield的CloudFront安全自动化用于防御HTTP泛洪、爬虫、SQL注入和XSS攻击，成本约为每月$22.84。 

|  服务  | 用量 | 费用/月 | 
|  ----  | ----  | ----  |  
| Amazon Kinesis Data Firehose | 100 GB | $2.9 |
| Amazon Lambda | 1M次请求<br>平均500毫秒的执行时间和512MB内存 | $4.37 |
| Amazon API Gateway | 1M次请求 | ~$3.5 |
| Amazon Athena | 1M次查询<br>每次查询扫描2GB数据 | $9.77 |
| Amazon S3 | 100 GB | $2.3 |
| 总计 |  | $22.84 |


## CloudFront实时日志监控API
截至2022年2月，在美国东部（弗吉尼亚北部）区域（us-east-1），使用默认设置运行CloudFront实时日志监控API，一个每秒接收60个2KB记录的CloudFront分配，为其监控10个指标，成本约为每月$88.56。

|  Service  | Dimensions | Cost/Month | 
|  ----  | ----  | ----  |  
| Amazon Kinesis Data Firehose | 60个记录(2KB)/秒<br>启用动态分区 | $36.9 |
| Amazon Kinesis Data Stream | 1个分区<br>60个记录(2KB)/秒<br>数据保留168小时 | $27.76 |
| Amazon Lambda | 86K次请求<br>平均500毫秒的执行时间和512MB内存 | $0.38 |
| Amazon API Gateway | 86K次请求 | $0.09 |
| Amazon Athena | 86K次查询<br>每次查询扫描35MB数据 | $14.42 |
| Amazon Simple Storage Service (S3) | 295GB | $6.79 |
| Amazon Cognito | 30 MAU | $1.5 |
| Amazon DynamoDB | 1GB数据存储<br>每分钟2次写操作<br>每两分钟1次读操作 | $0.72 |
| Total |  | $88.56 |