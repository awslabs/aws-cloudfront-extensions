# Amazon CloudFront Extensions 

Amazon CloudFront Extensions解决方案包含三个模块：Lambda@Edge和CloudFront Functions合集、基于AWS WAF与AWS Shield的CloudFront安全自动化，和CloudFront实时日志监控API，从而帮助客户更方便地使用CloudFront的拓展功能。

## Lambda@Edge & CloudFront Functions合集
本模块包含了一系列Lambda@Edge和CloudFront Functions，覆盖了如鉴权验证、预热、根据设备类型跳转和图片缩放等常用的用户场景，具体信息见下表。

#### Lambda@Edge

|    **名称**   | **描述**    | **示例** |
|------------------|--------------------|--------------------|
| [Authentication with Cognito](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/edge/nodejs/authentication-with-cognito) | Cognito是亚马逊的鉴权服务，当用户通过Cognito进行鉴权时，本Lambda可验证Cognito返回的token是否合法。  | - |
| [Add security headers](https://github.com/awslabs/aws-cloudfront-extensions/blob/main/edge/nodejs/add-security-headers) | 在响应中增加安全标头。 | 例如，通过添加`HSTS'strict-transport-security'`强制浏览器使用HTTPS，添加`'x-frame-options'`预防点击劫持。 |
| [Serve content based on device type](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/edge/nodejs/serving-based-on-device) | 根据设备类型跳转到相应链接。 | 例如，如果通过手机访问，则跳转到适配手机样式的网站。 |
| [Cross origin resource sharing](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/edge/nodejs/cross-origin-resource-sharing) | 在响应中添加CORS (Cross Origin Resource Sharing)标头。 | 例如，增加`'access-control-allow-origin'`、`'access-control-allow-headers'`的标头。 |
| [Modify response status code](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/edge/nodejs/modify-response-status-code)  | 修改响应的状态码。 | 例如，将状态码从500修改为200。 |
| [Modify response header](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/edge/nodejs/modify-response-header) | 修改响应的标头。 | - |
| [Access origin by weight rate](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/edge/nodejs/access-origin-by-weight-rate) | 根据提供的权重访问源站服务器。 | 例如，有两个源站服务器，权重分别是1和2，则会按照此权重比例进行回源。 |
| [Failover to alternative origin](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/edge/nodejs/multiple-origin-IP-retry) | 用户可提供一个源站服务器列表，当列表中的第一个源站服务器不可用时，自动切换到下一个，直到找到可用源站并发起请求。 | - |
| [Support 302 from origin](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/edge/nodejs/http302-from-origin) | 当收到302状态码时，直接请求相应的源站，而不需要返回给客户端进行302跳转。 | - |
| [Pre-warm](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/edge/python/prewarm) | 用户可指定区域进行预热。 | 例如，将100个url在美国东部进行预热。 |
| [Resize picture](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/edge/nodejs/resize-picture) | 根据提供的宽和高缩放图片，并将缩放后的图片保存到Amazon S3，提高下次相同请求的效率。 | 例如，将图片从`1000x1000`缩放为`200x300`。 |
| [Anti-hotlinking](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/edge/nodejs/anti-hotlinking) | 只允许referer白名单中的请求访问资源，从而达到防盗链的目的。目前白名单支持'*'、'?'等通配符。 | 例如，只允许referer是`www.example.com`的请求访问网站的图片。 |
| [Standardize query string](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/edge/nodejs/normalize-query-string) | 标准化query string从而提高缓存命中率（CHR），此Lambda会将query string转为小写字母并按照升序排列, 详情可参考[链接](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cache-hit-ratio.html#cache-hit-ratio-query-string-parameters)。 | 例如，原url是 https://d111111abcdef8.cloudfront.net/images/image.jpg?Type=demo&Color=red, 标准化后会变为 https://d111111abcdef8.cloudfront.net/images/image.jpg?color=red&type=demo  |
| [Authentication with Alibaba Cloud](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/edge/nodejs/authentication-with-aliyun-cdn-typeA) | 由Goclouds提供，实现基于阿里云的鉴权 | - |
| [Rewrite host for custom origin](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/edge/nodejs/rewrite-url) | 当CloudFront的源站是自定义源站时，此Lambda可以重写请求中的host字段，从而实现重定向到其他源站的功能。 | - |
| [Serverless load balancer](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/edge/python/serverless-load-balancer) | 通过Lambda@Edge实现负载均衡功能，负载会在Amazon DynamoDB表格中记录。 | - |
| [Custom response with new URL](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/edge/nodejs/custom-response-with-replaced-url) | 将响应中的body内容替换为自定义内容。 | 例如，响应返回的是个html，此Lambda可以将html中的所有'www.original.com'内容替换'www.new.com'，用户可通过此Lambda实现只维护一个S3桶，即可让两个不同的域名进行访问。 |

#### CloudFront Functions
|    **名称**   | **描述**    |**示例** |
|------------------|--------------------|--------------------|
| [Add security headers](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/function/js/add-security-headers) | 在响应中增加安全标头。 | 例如，通过添加`HSTS'strict-transport-security'`强制浏览器使用HTTPS，添加`'x-frame-options'`预防点击劫持。 |
| [Cross origin resource sharing](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/function/js/cross-origin-resource-sharing) | 在响应中添加CORS (Cross Origin Resource Sharing)标头。  | 例如，增加`'access-control-allow-origin'`、`'access-control-allow-headers'`的标头。|
| [Add cache control headers](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/function/js/add-cache-control-header) | 添加Cache-Control标头，从而允许浏览器本地缓存。 | - |
| [Add origin headers](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/function/js/add-origin-header) | 添加Origin标头。 | - |
| [Add true client IP headers](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/function/js/add-true-client-ip-header) | 添加True-Client-IP标头，此标头是真正最终连接CloudFront的客户端的IP。如果没有此标头，由CloudFront到源站服务器的连接（即源请求Origin request）只会包含CloudFront服务器的IP地址，而不是用户的客户端的IP地址。 | - |
| [Redirect based on country](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/function/js/redirect-based-on-country) | 根据用户所在地区返回相应的内容。 | - |
| [Default dir index](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/function/js/default-dir-index) | 为CloudFront的链接增加默认的结尾。 | 为所有以'/'结尾的url增加index.html。 |
| [Verify JSON web token](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/function/js/verify-jwt) | 验证query string中的JSON Web Token (JWT)，一般用于鉴权场景。 | - |
| [Customize request host](https://github.com/awslabs/aws-cloudfront-extensions/tree/main/function/js/custom-host) | 将host替换为自定义的标头的内容。 | 例如，用户可自定义一个标头awscustomhost，最终host会被替换为此标头的内容。 |

## 基于AWS WAF与AWS Shield的CloudFront安全自动化

本模块提供了一个在Amazon CloudFront上快速使用AWS WAF和AWS Shield Advanced的模板，它可以自动向您的账号中部署一套WAF规则和Shield保护组，从而为您的CloudFront提供如下保护：

- SQL注入和XSS：该解决方案配置了两个本机WAF规则，旨在防止URI、查询字符串或请求正文中出现常见的SQL注入或跨站点脚本（XSS）模式。

- HTTP泛洪：该组件可防止来自特定IP地址的大量请求构成的攻击，例如web层DDoS攻击或暴力登录尝试。

- 日志扫描器：该组件分析应用程序访问日志，搜索可疑行为，例如状态码为500。然后，它会在客户定义的一段时间内屏蔽这些可疑的源IP地址。

- IP信誉列表：定期获取第三方提供的IP信誉列表，防止信誉差的IP访问您的网站。

- 爬虫：设置一个蜜罐链接，您可将其添加到网页中，通过将其设置为隐藏，从而保证用户无法看到此链接。如果此链接被点击时则是由爬虫触发的，从而识别出爬虫并进行防御。

- IP黑名单和白名单：该组件创建两个特定的WAF规则，允许您手动插入要阻止或允许的IP地址。

## CloudFront实时日志监控API
本模块通过分析CloudFront实时日志获取Cache Hit Rate（缓存命中率）、下载速率等指标，并通过RESTful API输出。

监控API可以满足灵活的定制化需求，根据您的特定需求从实时日志中自定义指标逻辑，只需要在Amazon Athena中通过SQL语句就可以实现。以下是提供的10个参考指标：

- request: 从客户端到CloudFront的请求数量
- requestOrigin: 回源的请求数量
- statusCode: 从客户端到CloudFront的状态码
- statusCodeOrigin: 回源的状态码
- bandwidth: 从客户端到CloudFront的带宽
- bandwidthOrigin: 回源的带宽
- chr: 通过请求数量计算的缓存命中率
- chrBandWith: 通过带宽计算的缓存命中率
- downloadSpeed: 从客户端到CloudFront的下载速率
- downloadSpeedOrigin: 回源的下载速率

上述参考指标有效地补充了目前CloudWatch对CloudFront的监控指标，可以帮助您从多个维度了解CloudFront的运行情况。有关CloudFront默认内置的监控指标，可以参考[使用Amazon CloudWatch监控CloudFront](https://docs.aws.amazon.com/zh_cn/AmazonCloudFront/latest/DeveloperGuide/monitoring-using-cloudwatch.html)。

本实施指南介绍在Amazon Web Services（亚马逊云科技）云中部署CloudFront Extensions解决方案的架构信息和具体配置步骤。它包含指向[CloudFormation][cloudformation]模板的链接，这些模板使用亚马逊云科技在安全性和可用性方面的最佳实践来启动和配置本解决方案所需的亚马逊云科技服务。

本指南面向具有亚马逊云科技架构实践经验的IT架构师、开发人员等专业人士。

[cloudformation]: https://aws.amazon.com/en/cloudformation/

