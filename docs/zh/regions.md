## 区域支持

截至2022年8月，本解决方案支持部署在以下亚马逊云科技区域：

| Region Name | Region ID |
|----------|--------|
| 美国东部（弗吉尼亚北部）区域 | us-east-1
| 美国东部（俄亥俄）区域 | us-east-2
| 美国西部（加利福尼亚北部）区域 | us-west-1
| 美国西部（俄勒冈）区域 | us-west-2
| 亚太地区（孟买）区域 | ap-south-1
| 亚太地区（东京）区域 | ap-northeast-1
| 亚太地区（首尔）区域 | ap-northeast-2
| 亚太地区（新加坡）区域 | ap-southeast-1
| 亚太地区（悉尼）区域 | ap-southeast-2
| 加拿大（中部）区域 | ca-central-1
| 欧洲（爱尔兰）区域 | eu-west-1
| 欧洲（伦敦）区域 | eu-west-2
| 欧洲（巴黎）区域 | eu-west-3
| 欧洲（米兰）区域 | eu-north-1
| 欧洲（法兰克福）区域 | eu-central-1
| 南美洲（圣保罗）区域 | sa-east-1


## 服务配额 

在配置CloudFront的SSL/TLS证书时有服务配额。请参考[documentation](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cnames-and-https-limits.html)获取更多信息。


|  名称  | 服务配额 | 说明 | 
|  ----  | ----  | ----  |  
| 每个CloudFront分配关联的最大证书数量 | 1 |  |
| 可以导入ACM的最大证书数 | 2500 |  |
| 每个AWS帐户的最大证书数（仅限专用IP地址） | 2 | 一个用于日常使用，另一个用于需要为多个分配轮换证书时 |
| 对使用不同AWS帐户创建的CloudFront分配使用相同的证书 | No |  |
| 对CloudFront和其他AWS服务使用相同的证书 | Yes |  |



