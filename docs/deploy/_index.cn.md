---
title: 部署CloudFront拓展功能
weight: 30
---

Lambda@Edge可在如下四个阶段修改CloudFront请求或响应:

- 在CloudFront收到查看器的请求之后 (查看器请求)
- 在CloudFront将请求转发到源之前 (源请求)
- 在CloudFront收到来自源的响应之后 (源响应)
- 在CloudFront将响应转发到查看器之前 (查看器响应)

![CloudFront Viewer Origin](/images/cloudfront-events-that-trigger-lambda-functions.png)

在本章中, 您将会通过SAR（Serverless Application Repository）部署如下两个Lambda函数，SAR是无服务器应用程序的托管存储库。

|  实验   | 描述  | CloudFront事件 |
|  ----  | ----  | ----  |
| authentication-with-cognito  | 通过Amazon Cognito实现鉴权功能，Lambda@Edge会对鉴权进行校验 | 查看器请求 | 
| serving-based-on-device  | 访问网页时会根据设备类型返回相应内容，例如在手机上访问，会返回手机端网页，在PC浏览器上访问同一网页，会返回桌面端网页 | 源请求 | 
