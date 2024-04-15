您需要承担运行解决方案时使用亚马逊云科技各个服务的成本费用。我们建议通过[AWS Cost Explorer](http://aws.amazon.com/aws-cost-management/aws-cost-explorer/)创建预算以帮助管理成本。有关详细信息，请参阅本解决方案中使用的每项服务的定价页面。

##  CloudFront配置快照

截至2023年3月，如果CloudFront分配的配置更改30次并创建10个快照，在美国东部（弗吉尼亚北部）区域（us-east-1），使用此解决方案的估计成本为每月0.63美元。

|  服务  | 用量 | 费用/每月 | 
|  ----  | ----  | ----  |  
| AWS Lambda | 200次请求<br>平均60秒执行时间和256MB内存 | $0.01 |
| AWS Appsync | 100次请求 | $0.0004 |
| Amazon Simple Storage Service (S3) |  5GB | $0.12 |
| Amazon DynamoDB | 2GB存储 | $0.50 |
| 总计 |  | ~$0.63 |


##  SSL证书
 
截至2023年3月，如果创建2000个ACM证书和2000个CloudFront分配，在美国东部（弗吉尼亚北部）区域（us-east-1），使用此解决方案的估计成本为每月26.68美元。

| 服务            | 用量                          | 费用/每月 | 
|--------------------|-------------------------------------|------------|  
| AWS Lambda         | 11140 次调用平均 500 毫秒和 256MB 内存  | $0         |
| Amazon API Gateway | 5000 次请求                            | $0         |
| AWS Appsync        | 5000 次请求                            | $0.02      |
| Step Functions     | 8 x 500 = 4000 状态变化                 | $0         |
| Amazon DynamoDB    | 1000MB 数据存储量                        | $26.64     |
| Amazon Simple Storage Service (S3) | 1GB 存储                              | $0.02      |
| 总计              |                                     | $26.68     |


##  非实时监控
 
截至2023年3月，在美国东部（弗吉尼亚北部）区域（us-east-1），使用默认设置运行CloudFront实时日志监控API，一个每秒接收60个2KB记录的CloudFront分配，为其监控10个指标，成本约为每月$22.40。

|  服务  | 用量 | 费用/每月 | 
|  ----  | ----  | ----  |  
| AWS Lambda | 86K次请求<br>平均500毫秒执行时间和512MB内存 | $0.38 |
| Amazon API Gateway | 86K次请求 | $0.09 |
| Amazon Athena | 86K次查询<br>每次查询扫描35MB数据 | ~$14.42 |
| Amazon Simple Storage Service (S3) |  295GB | $6.79 |
| Amazon DynamoDB | 1GB数据存储<br>每分钟2次写操作<br>每两分钟1次读操作 | $0.72 |
| 总计 |  | $22.40 |


## 实时监控

截至2023年3月，在美国东部（弗吉尼亚北部）区域（us-east-1），使用默认设置运行CloudFront实时日志监控API，一个每秒接收60个2KB记录的CloudFront分配，为其监控10个指标，成本约为每月$88.56。

|  服务  | 用量 | 费用/每月 | 
|  ----  | ----  | ----  |  
| Amazon Kinesis Data Firehose | 60个记录(2KB)/秒<br>启用动态分区 | $36.9 |
| Amazon Kinesis Data Stream | 1个分区<br>60个记录(2KB)/秒<br>数据保留168小时 | $27.76 |
| AWS Lambda | 86K次请求<br>平均500毫秒执行时间和512MB内存 | $0.38 |
| Amazon API Gateway | 86K次请求 | $0.09 |
| Amazon Athena | 86K次查询<br>每次查询扫描35MB数据 | $14.42 |
| Amazon Simple Storage Service (S3) | 295GB | $6.79 |
| Amazon Cognito | 30 MAU | $1.5 |
| Amazon DynamoDB | 1GB数据存储<br>每分钟2次写操作<br>每两分钟1次读操作 | $0.72 |
| 总计 |  | $88.56 |


## 预热

### 示例1: 每天预热500个资源，每个资源大小为500MB

截至2023年3月，在美国东部（弗吉尼亚北部）区域（us-east-1），成本约为每月$171.27。

|  服务  | 用量 | 费用/每月 | 
|  ----  | ----  | ----  |  
| Amazon EC2 | 启动50 EC2 spot实例 (c6g.large)，每天运行2小时预热500个URI<br>150GB EBS | $165.97 |
| Amazon Lambda | 45K次请求<br>256MB内存<br>ARM64 | $3.67 |
| Amazon API Gateway | 30K次请求<br>REST API | $0.03 |
| Amazon Simple Queue Service | 标准队列<br>2GB DTO | $0.18 |
| Amazon DynamoDB | 2GB数据存储<br>15K次写操作<br>15K次读操作 | $0.52 |
| Amazon CloudWatch | 1个指标和警报 | $0.90 |
| 总计 |  | $171.27 |

### 示例2: 每月预热200个资源，每个资源大小为1GB

截至2023年3月，在美国东部（弗吉尼亚北部）区域（us-east-1），成本约为每月$11.78。

|  服务  | 用量 | 费用/每月 | 
|  ----  | ----  | ----  |  
| Amazon EC2 | m5dn.xlarge Spot实例<br>150GB EBS | $10.59 |
| Amazon Lambda | 28次请求<br>256MB memory<br>ARM64 | $0.01 |
| Amazon API Gateway | 24次请求<br>REST API | $0.0001 |
| Amazon Simple Queue Service | 标准队列<br>1GB DTO | $0.02 |
| Amazon DynamoDB | 1GB数据存储<br>2K次写操作<br>200次读操作 | $0.25 |
| Amazon CloudWatch | 1个指标和警报 | $0.90 |
| 总计 |  | $11.78 |

## 预热

### 示例1: 每天预热500个资源，每个资源大小为500MB

截至2023年3月，在美国东部（弗吉尼亚北部）区域（us-east-1），成本约为每月$171.27。

|  服务  | 用量 | 费用/每月 | 
|  ----  | ----  | ----  |  
| Amazon EC2 | 启动50 EC2 spot实例 (c6g.large)，每天运行2小时预热500个URI<br>150GB EBS | $165.97 |
| Amazon Lambda | 45K次请求<br>256MB内存<br>ARM64 | $3.67 |
| Amazon API Gateway | 30K次请求<br>REST API | $0.03 |
| Amazon Simple Queue Service | 标准队列<br>2GB DTO | $0.18 |
| Amazon DynamoDB | 2GB数据存储<br>15K次写操作<br>15K次读操作 | $0.52 |
| Amazon CloudWatch | 1个指标和警报 | $0.90 |
| 总计 |  | $171.27 |

### 示例2: 每月预热200个资源，每个资源大小为1GB

截至2023年3月，在美国东部（弗吉尼亚北部）区域（us-east-1），成本约为每月$11.78。

|  服务  | 用量 | 费用/每月 | 
|  ----  | ----  | ----  |  
| Amazon EC2 | m5dn.xlarge Spot实例<br>150GB EBS | $10.59 |
| Amazon Lambda | 28次请求<br>256MB memory<br>ARM64 | $0.01 |
| Amazon API Gateway | 24次请求<br>REST API | $0.0001 |
| Amazon Simple Queue Service | 标准队列<br>1GB DTO | $0.02 |
| Amazon DynamoDB | 1GB数据存储<br>2K次写操作<br>200次读操作 | $0.25 |
| Amazon CloudWatch | 1个指标和警报 | $0.90 |
| 总计 |  | $11.78 |
