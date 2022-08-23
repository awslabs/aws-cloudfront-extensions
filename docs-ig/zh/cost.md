您负责运行此解决方案时使用的AWS服务的成本。我们建议通过[AWS Cost Explorer](http://aws.amazon.com/aws-cost-management/aws-cost-explorer/)创建预算以帮助管理成本。有关详细信息，请参阅本解决方案中使用的每项服务的定价页面。


##  CloudFront配置快照

截至2022年8月，如果CloudFront分配的配置更改30次并创建10个快照，在美国东部（弗吉尼亚北部）区域（us-east-1），使用此解决方案的估计成本为每月0.63美元。

|  Service  | Dimensions | Cost/Month | 
|  ----  | ----  | ----  |  
| AWS Lambda | 200次请求<br>平均60秒执行时间和256MB内存 | $0.01 |
| AWS Appsync | 100次请求 | $0.0004 |
| Amazon Simple Storage Service (S3) |  5GB | $0.12 |
| Amazon DynamoDB | 2GB存储 | $0.50 |
| Total |  | ~$0.63 |


##  SSL证书
 
截至2022年8月，if user create 500 acm certificates and 500 cloudfront distribution per month, the estimated cost of using this solution is $0 per month in the US East (N. Virginia) Region (excludes free tier).

| Service            | Dimensions                                                          | Cost/Month | 
|--------------------|---------------------------------------------------------------------|------------|  
| AWS Lambda         | 11140次请求<br>average 500 millisecond and 256MB memory       | $0         |
| Amazon API Gateway | 500次请求                                                        | $0         |
| AWS Appsync        | 500次请求                                                        | $0         |
| Step Functions     | 8 x 500 = 4000 states transitions                                   | $0         |
| Amazon DynamoDB    | 100MB data storage<br>2 writes per minute<br>1 read every 2 minutes | $0         |
| Total              |                                                                     | $0         |


##  非实时监控
 
截至2022年8月，在美国东部（弗吉尼亚北部）区域（us-east-1），使用默认设置运行CloudFront实时日志监控API，一个每秒接收60个2KB记录的CloudFront分配，为其监控10个指标，成本约为每月$22.40。

|  Service  | Dimensions | Cost/Month | 
|  ----  | ----  | ----  |  
| AWS Lambda | 86K次请求<br>平均500毫秒执行时间和512MB内存 | $0.38 |
| Amazon API Gateway | 86K次请求 | $0.09 |
| Amazon Athena | 86K次查询<br>每次查询扫描35MB数据 | ~$14.42 |
| Amazon Simple Storage Service (S3) |  295GB | $6.79 |
| Amazon DynamoDB | 1GB数据存储<br>每分钟2次写操作<br>每两分钟1次读操作 | $0.72 |
| Total |  | $22.40 |


## 实时监控

截至2022年8月，在美国东部（弗吉尼亚北部）区域（us-east-1），使用默认设置运行CloudFront实时日志监控API，一个每秒接收60个2KB记录的CloudFront分配，为其监控10个指标，成本约为每月$88.56。

|  Service  | Dimensions | Cost/Month | 
|  ----  | ----  | ----  |  
| Amazon Kinesis Data Firehose | 60个记录(2KB)/秒<br>启用动态分区 | $36.9 |
| Amazon Kinesis Data Stream | 1个分区<br>60个记录(2KB)/秒<br>数据保留168小时 | $27.76 |
| AWS Lambda | 86K次请求<br>平均500毫秒执行时间和512MB内存 | $0.38 |
| Amazon API Gateway | 86K次请求 | $0.09 |
| Amazon Athena | 86K次查询<br>每次查询扫描35MB数据 | $14.42 |
| Amazon Simple Storage Service (S3) | 295GB | $6.79 |
| Amazon Cognito | 30 MAU | $1.5 |
| Amazon DynamoDB | 1GB数据存储<br>每分钟2次写操作<br>每两分钟1次读操作 | $0.72 |
| Total |  | $88.56 |


## 预热

### 示例1: 每天预热500个资源，每个资源大小为500MB

截至2022年8月，在美国东部（弗吉尼亚北部）区域（us-east-1），成本约为每月$171.27。

|  Service  | Dimensions | Cost/Month | 
|  ----  | ----  | ----  |  
| Amazon EC2 | 启动50 EC2 spot实例 (c6g.large)，每天运行2小时预热500个URI<br>150GB EBS | $165.97 |
| Amazon Lambda | 45K次请求<br>256MB内存<br>ARM64 | $3.67 |
| Amazon API Gateway | 30K次请求<br>REST API | $0.03 |
| Amazon Simple Queue Service | 标准队列<br>2GB DTO | $0.18 |
| Amazon DynamoDB | 2GB数据存储<br>15K次写操作<br>15K次读操作 | $0.52 |
| Amazon CloudWatch | 1个指标和警报 | $0.90 |
| Total |  | $171.27 |

### 示例2: 每月预热200个资源，每个资源大小为1GB

截至2022年8月，在美国东部（弗吉尼亚北部）区域（us-east-1），成本约为每月$11.78。

|  Service  | Dimensions | Cost/Month | 
|  ----  | ----  | ----  |  
| Amazon EC2 | m5dn.xlarge Spot实例<br>150GB EBS | $10.59 |
| Amazon Lambda | 28次请求<br>256MB memory<br>ARM64 | $0.01 |
| Amazon API Gateway | 24次请求<br>REST API | $0.0001 |
| Amazon Simple Queue Service | 标准队列<br>1GB DTO | $0.02 |
| Amazon DynamoDB | 1GB数据存储<br>2K次写操作<br>200次读操作 | $0.25 |
| Amazon CloudWatch | 1个指标和警报 | $0.90 |
| Total |  | $11.78 |
