## Pre-warming 
### 请求
- HTTP方法: `POST`
- 请求参数

| **名称**      | **类型**   | **是否必传** | **描述**                                                                                                                          |
|-------------|----------|----------|---------------------------------------------------------------------------------------------------------------------------------|
| url_list    | *列表*     | 是        | 需要预热的url列表                                                                                                                      |
| cf_domain   | *字符串*    | 是        | 以[cloudfront.net](http://cloudfront.net/)结尾的CloudFront域名。如果未设置，它将根据url列表中的CNAME查找cf_domain                                      |
| protocol    | *字符串*    | 否        | 可选字段，可传 "http" 或者 "https"，如不指定，默认是 "http"                                                                                       |
| target_type | *字符串*    | 是        | 预热目标类型。您可以指定3种类型的值，region字段依据此字段类型的不同而值不同，可传值包括："pop"，"country"，"region"<br>"pop"：根据节点预热<br>"country"：根据国家预热<br>"region"：根据区域预热 |
| region      | *列表或字符串* | 是        | 预热区域。详情如下:                                                                                              |

- region： 依据不同的target_type,需设置不同的值
    * 当 target_type 为 "pop"时，此字段传pop id列表，表示在列表中指定的边缘节点进行预热，例如["ATL56-C1", "DFW55-C3"]
    * 当 target_type 为 "region"时，此字段传"all"(配合开启Origin Shield效果更好，详情见[链接](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/origin-shield.html#enable-origin-shield))或者区域代码列表，表示在特定区域进行预热，"all"代表预热全部区域列表，例如"all"或者["apac", "au"]，可用区域为：
      * apac： Asia-Pacific
      * au： Australia
      * ca： Canada
      * sa： South Africa
      * eu： Europe
      * jp： Japan
      * us： United States
      * cn： China(注：在中国区预热之前需要在中国大陆区域部署此解决方案，否则在中国区预热会失败)
    * 当 target_type 为 "country"时，此字段传"all"(配合开启Origin Shield效果更好，详情见[链接](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/origin-shield.html#enable-origin-shield))或者国家代码列表，表示在特定国家进行预热，"all"代表预热全部国家列表，例如"all"或者["india", "new_zealand"]，可用国家为：
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

- 请求示例
``` json
{
    "url_list": [
        "https://{host}/index.html",
        "https://{host}/images/demo.png"
    ],
    "target_type":"country",
    "cf_domain": "d3hvi5wvyqg3lv.cloudfront.net", 
    "region": ["china","india","japan","new_zealand","australia","malaysia","indonesia","philippines","singapore","thailand","vietnam","south_korea"],
    "protocol": "http"
}
```
### 响应
- 响应参数

| **名称**    | **类型** | **描述**                                    |
|-----------|--------|-------------------------------------------|
| requestID | *字符串*  | 预热请求id，您可通过调用PrewarmStatus API获取预热请求的最新状态 |


- 响应示例

``` json
{
  "requestID": "4f780687-9774-48cd-bd7d-db836abf45af"
}
```


## PrewarmStatus 
### 请求
- HTTP方法: `GET`
- 请求参数

| **名称**    | **类型** | **描述**                                   |
|-----------|--------|------------------------------------------|
| requestID | *字符串*  |  预热请求id，标识预热请求的id，需要在query string中指定 |
- 请求示例

``` json
{
  "requestID": "4f780687-9774-48cd-bd7d-db836abf45af"
}
```

### 响应
- 响应参数

| **名称**     | **类型** | **描述**                                                     |
|------------|--------|------------------------------------------------------------|
| status     | *字符串*  | 预热状态，COMPLETED表示完成，IN_PROGRESS表示进行中，TIMEOUT表示超时，FAILED表示失败 |
| total      | *数字*   | 预热url的总数                                                   |
| completed  | *数字*   | 预热完成的url的数量                                                |
| inProgress | *数字*   | 正在预热中的url的数量                                               |
| failedUrl  | *列表*   | 失败url列表                                                    |

- 响应示例
``` json
{
    "status": "COMPLETED",
    "total": 20,
    "completed": 17,
    "inProgress": 3,
    "failedUrl": ["https://www.example.com/images/demo.png"]
    "inProgressUrl": ["https://www.example.com/images/demo1.png"]
    "successUrl": ["https://www.example.com/images/xx.png"]
}
```


