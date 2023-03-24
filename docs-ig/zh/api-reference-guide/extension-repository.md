## Pre-warming 
- HTTP方法: `POST`
- 请求

``` json
{
    "url_list": [
        "https://{host}/index.html",
        "https://{host}/images/demo.png"
    ],
    "target_type":"pop"｜"region"｜"country",
    "cf_domain": "d3hvi5wvyqg3lv.cloudfront.net", // Optional, if not set cf_domain, it will find cf_domain according to CName in the url list
    "region": "all"|["ATL56-C1", "DFW55-C3"]|["apac","au","ca","sa","eu","jp","us"]|["china","india","japan","new_zealand","australia","malaysia","indonesia","philippines","singapore","thailand","vietnam","south_korea"], // "all" to prewarm all established pop node
    "protocol": "http|https"
}
```

- 请求参数

    - url_list： 预热的url列表
    - cf_domain： 以[cloudfront.net](http://cloudfront.net/)结尾的CloudFront域名。如果未设置，它将根据url列表中的CNAME查找cf_domain
    - protocol: 可选字段，可传 "http" 或者 "https"，如不指定，默认是 "http"
    - target_type 预热区域目标类型。您可以指定3种类型的值，region字段依据此字段类型的不同而值不同
      * pop：根据节点预热
      * country：根据国家预热
      * region：根据区域预热
    - region： 预热区域。依据不同的target_type,选择不同的值
      * target_type = "pop"时，此字段传pop id列表: 在列表中指定的边缘节点进行预热，例如["ATL56-C1", "DFW55-C3"]
      * target_type = "region"时，此字段传"all"或者区域代码列表: 在特定区域进行预热，"all"代表预热全部区域列表(需配合开启CloudFront源护盾使用，具体操作详见：https://aws.amazon.com/cn/blogs/china/configure-amazon-cloudfront-to-accelerate-the-whole-site/)，例如"all"|["apac", "au"]，可用区域为：
        * apac： Asia-Pacific
        * au： Australia
        * ca： Canada
        * sa： South Africa
        * eu： Europe
        * jp： Japan
        * us： United States
        * cn: China(注：在中国区预热之前需要在中国大陆区域部署此解决方案，否则在中国区预热会失败)
      * target_type = "country"时，此字段传"all"或者国家代码列表: 在特定国家进行预热，"all"代表预热全部国家列表(需配合开启CloudFront源护盾使用，具体操作详见：https://aws.amazon.com/cn/blogs/china/configure-amazon-cloudfront-to-accelerate-the-whole-site/)，例如"all"|["india", "new_zealand"]，可用国家为：
        * india： India
        * japan： Japan
        * new_zealand： New Zealand
        * australia：Australia
        * malaysia： Malaysia
        * china： China(大陆区域预热需要在中国区部署此解决方案)
        * indonesia：Indonesia
        * philippines：Philippines
        * singapore：Singapore
        * thailand： Thailand
        * vietnam：Vietnam
        * south_korea： South Korea

- 响应

``` json
{
  "requestID": "4f780687-9774-48cd-bd7d-db836abf45af"
}
```

- 响应参数

  `requestID`: The request ID, which you can use in PrewarmStatus API to get the prewarm status.

## PrewarmStatus 
- HTTP方法: `GET`
- 请求

``` json
{
  "requestID": "4f780687-9774-48cd-bd7d-db836abf45af"
}
```

- 请求参数

  `requestID`: a unique ID for each request.

- 响应

``` json
{
    "status": "COMPLETED" | "IN_PROGRESS" | "TIMEOUT" | "FAILED",
    "total": 20,
    "completed": 17,
    "inProgress": 3,
    "failedUrl": ["https://www.example.com/images/demo.png"]
    "inProgressUrl": ["https://www.example.com/images/demo1.png"]
    "successUrl": ["https://www.example.com/images/xx.png"]
}
```
- 响应参数

  `status`：整体预热状态

  `total`： 预热的URL总数

  `completed`：已预热的URL的计数

  `inProgress`：正在预热的URL的计数

  `failedUrl`： 未能预热的URL列表

  `inProgressUrl`：正在预热的URL列表

  `successUrl`：已成功预热的URL列表


