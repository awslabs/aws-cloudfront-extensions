---
title: CloudFront Extensions workshop 
chapter: true
---

# Amazon CloudFront Extensions 

Amazon CloudFront Extensions是CloudFront的拓展功能，它包含三个模块：Lambda@Edge和CloudFront Functions合集、基于Amazon WAF与Amazon Shield的CloudFront安全自动化和监控API。本方案帮助您更方便的使用CloudFront。

![What is CloudFrontExt](/images/what-is-cloudfrontext.png)



### Lambda@Edge & CloudFront Functions合集
本模块包含了一系列Lambda@Edge和CloudFront Functions，覆盖了如鉴权验证、预热、根据设备类型跳转和图片缩放等常用的用户场景。


### 基于Amazon WAF与Amazon Shield的CloudFront安全自动化

本模块提供了一个在Amazon CloudFront上快速使用Amazon WAF和Amazon Shield Advanced的模板，它可以自动向您的账号中部署一套WAF规则和Shield保护组，从而为您的CloudFront提供如下保护：

- SQL注入和XSS：该解决方案配置了两个本机WAF规则，旨在防止URI、查询字符串或请求正文中出现常见的SQL注入或跨站点脚本（XSS）模式。
- HTTP泛洪：该组件可防止来自特定IP地址的大量请求构成的攻击，例如web层DDoS攻击或暴力登录尝试。
- 日志扫描器：该组件分析应用程序访问日志，搜索可疑行为，例如状态码为500。然后，它会在客户定义的一段时间内屏蔽这些可疑的源IP地址。
- IP信誉列表：定期获取第三方提供的IP信誉列表，防止信誉差的IP访问您的网站。
- 爬虫：设置一个蜜罐链接，您可将其添加到网页中，通过将其设置为隐藏，从而保证用户无法看到此链接，那么此链接被点击时则是由爬虫触发的，从而识别出爬虫并进行防御。
- IP黑名单和白名单：该组件创建两个特定的WAF规则，允许您手动插入要阻止或允许的IP地址。

### 监控API
本模块通过分析CloudFront实时日志获取缓存命中率、下载速率等指标，并通过Restful API输出。

监控API可以满足灵活的定制化需求，根据您的特定需求从实时日志中自定义指标逻辑，只需要在Athena中通过方便的SQL语句就可以实现。本示例中提供了以下10个参考指标：

- request: 从客户端到CloudFront的请求数量
- requestOrigin: 回源的请求数量
- statusCode: 从客户端到CloudFront的状态码
- statusCodeOrigin: 回源的状态码
- bandwidth: 从客户端到CloudFront的带宽
- bandwidthOrigin: 回源的带宽
- chr (cache hit rate): 通过请求数量计算的缓存命中率
- chrBandWith: 通过带宽计算的缓存命中率
- downloadSpeed: 从客户端到CloudFront的下载速率
- downloadSpeedOrigin: 回源的下载速率

上述参考指标有效地补充了目前CloudWatch对CloudFront的监控指标，可以帮助您从多个维度了解CloudFront的运行情况。有关CloudFront默认内置的监控指标，可以参考[使用Amazon CloudWatch监控CloudFront](https://docs.aws.amazon.com/zh_cn/AmazonCloudFront/latest/DeveloperGuide/monitoring-using-cloudwatch.html)。


### 实施指南
详情请参考[实施指南](https://awslabs.github.io/aws-cloudfront-extensions/)

