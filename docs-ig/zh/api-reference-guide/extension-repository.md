## Pre-warming 
- HTTP方法: `POST`
- 请求

``` json
{
    "url_list": [
        "https://{host}/index.html",
        "https://{host}/images/demo.png"
    ],
    "cf_domain": "d3hvi5wvyqg3lv.cloudfront.net", // Optional, if not set cf_domain, it will find cf_domain according to CName in the url list
    "region": ["ATL56-C1", "DFW55-C3"]|"all"|"apac"|"au"|"ca"|"sa"|"eu"|"jp"|"us" // "all" to prewarm all pop node
}
```

- 请求参数

  - url_list： 预热的url列表
  - cf_domain： 以[cloudfront.net](http://cloudfront.net/)结尾的CloudFront域名。如果未设置，它将根据url列表中的CNAME查找cf_domain
  - region： 预热区域。您可以指定3种类型的值

    * all： 在所有区域进行预热
    * pop id列表，例如["ATL56-C1", "DFW55-C3"]: 在列表中指定的边缘节点进行预热
    * 区域代码: 在特定区域进行预热，可用区域为：
      * apac： Asia-Pacific
      * au： Australia
      * ca： Canada
      * sa： South Africa
      * eu： Europe
      * jp： Japan
      * us： United States

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


