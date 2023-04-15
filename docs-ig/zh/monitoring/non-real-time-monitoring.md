如果您在部署解决方案（CloudFormation堆栈）时选择**Non-real time monitoring**，将部署以下架构，并在您的帐户中自动创建相应的云资源。

![non-real-time-monitoring](../../images/non-real-time-monitoring.png)

git commit -m
1. 启用CloudFront标准日志。您需要指定一个S3存储桶来存储CloudFront标准日志。
2. 删除CloudFront标准日志不需要的字段以及将日志在S3存储桶中进行分区。CloudFront标准日志包含30多个字段，获取CloudFront指标所需的字段不到10个。AWS Lambda函数将读取S3存储桶中的日志，并删除不需要的字段以减小日志文件的大小。它可以提高Athena查询速度并节省成本。AWS Lambda函数会把日志移动到文件夹中进行分区，例如year=2022/month=07/day=10/hour=09/。
3. 通过Athena查询S3中的标准日志。这里通过数据分区让Athena加速数据查询，Amazon EventBridge将每天创建第二天的所有分区，并删除前一天的分区。Lambda函数MetricCollector每5分钟执行一次，用于分析标准日志和收集监控指标。
4. 将查询结果保存在DynamoDB中。通过Athena查询相应的监控指标数据，如通过带宽计算CHR（缓存命中率）和下载率，最后将监控指标数据存储在DynamoDB表中。
5. 通过API Gateway调用API。当用户向API Gateway发送API请求时，将触发名为MetricManager的Lambda函数。该函数从DynamoDB表返回相应的结果。为了加强安全管理和限制API访问，API Gateway默认启用API key。用户在调用api时需要传递x-api-key标头。

## 创建标准日志记录
1. 打开CloudFront控制台，在**分配**标签下单击需要创建标准日志的分配(Distribution)ID。
2. 在**设置**中点击**编辑**按钮，打开**编辑设置**并找到**标准日志记录**。
3. 选中**打开**，并在*S3 存储桶*列表中找到包含*-cloudfrontlogbuckete*关键字的选项，将其设置为传输日志文件的 S3 存储桶。如果您没有找到对应名字的S3存储桶，请确认是否在部署解决方案时，参数*CloudFront Log Type*为*yes-Non-Realtime*，详情请参阅[部署解决方案](../deployment.md#_1)。
4. 最后请点击**保存更改**，使设置生效。

## 监控指标 

支持如下监控指标:

- request: 从客户端到 CloudFront 的请求数量
- requestOrigin: 回源的请求数量
- statusCode: 从客户端到 CloudFront 的状态码
- statusCodeOrigin: 回源的状态码
- bandwidth: 从客户端到CloudFront的带宽
- bandwidthOrigin: 回源的带宽
- chr (cache hit ratio): 通过请求数量计算的缓存命中率
- chrBandWidth: 通过带宽计算的缓存命中率
- topNUrlRequests: 根据请求数量统计的top url
- topNUrlSize: 根据流量统计的top url
- downstreamTraffic: 响应流量

