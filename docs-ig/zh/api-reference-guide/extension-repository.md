## prewarm 
### 请求预热
- HTTP方法: `POST`
- 请求参数

| **名称**      | **类型**   | **是否必传** | **描述**                                                                                                                                                                                             |
|-------------|----------|----------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| url_list    | *列表*     | 是        | 需要预热的url列表                                                                                                                                                                                         |
| cf_domain   | *字符串*    | 是        | 以[cloudfront.net](http://cloudfront.net/)结尾的CloudFront域名。如果未设置，它将根据url列表中的CNAME查找cf_domain                                                                                                         |
| timeout     | *数字*     | 是        | 表示预热时间限制 超时会自动停止预热进程                                                                                                                                                                               |
| target_type | *字符串*    | 是        | 预热目标类型。您可以指定3种类型的值，可传值包括："pop"，"country"，"region"。<br>"pop"：根据节点预热<br>"country"：根据国家预热<br>"region"：根据区域预热。如果选择了某个值pop country region中的某一个 下面对应的pops countries regions需要填写对应需要预热的值，不填系统默认选择可预热节点预热. |
| pops        | *列表* | 是        | 预热区域。详情如下:                                                                                                                                                                                         |
| countries   | *列表* | 是        | 预热区域。详情如下:                                                                                                                                                                                         |
| regions     | *列表* | 是        | 预热区域。详情如下:                                                                                                                                                                                         |
| pop         | *列表* | 是        | 预热区域。详情如下:                                                                                                                                                                                         |
| pop         | *列表* | 是        | 预热区域。详情如下:                                                                                                                                                                                         |
| pop         | *列表* | 是        | 预热区域。详情如下:                                                                                                                                                                                         |

- 依据不同的target_type，需设置不同的值
    * 当 target_type 为 "pop"时，pops字段需要传pop id列表，表示在列表中指定的边缘节点进行预热(配合开启Origin Shield效果更好，详情见[链接](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/origin-shield.html#enable-origin-shield))，例如["ATL56-C1", "DFW55-C3"]，如果传空[] 会由系统默认指定pop点预热
    * 当 target_type 为 "region"时，regions字段需要传以下值列表范围中的值，表示在特定区域进行预热(配合开启Origin Shield效果更好，详情见[链接](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/origin-shield.html#enable-origin-shield))，例如["apac", "au"]，如果传空[] 会由系统默认指定如下全部区域的某些pop点预热，可用区域为：
          * apac： Asia-Pacific
          * au： Australia
          * ca： Canada
          * sa： South Africa
          * eu： Europe
          * jp： Japan
          * us： United States
          * cn： China(确保您已在中国北京或宁夏区域部署了预热方案)
    * 当 target_type 为 "country"时，countries字段需要传以下值列表范围中的值，表示在特定国家进行预热(配合开启Origin Shield效果更好，详情见[链接](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/origin-shield.html#enable-origin-shield))或者国家代码列表，例如["india", "new_zealand"]，如果传空[] 会由系统默认指定如下全部国家的某些pop点预热，可用国家为：
          * india： India
          * japan： Japan
          * new_zealand： New Zealand
          * australia：Australia
          * malaysia： Malaysia
          * china： China(确保您已在中国北京或宁夏区域部署了预热方案)
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
          "https://www.example.com/index.html",
          "https://www.example.com/css/bootstrap-icons.css"
        ],
        "cf_domain": "www.example.com",
        "target_type":"pop",
        "countries": [
        ],
        "regions": [
        ],
        "pops": [
            "ATL56-C1",
            "SIN2-C1",
            "DFW55-C3"
        ],
        "timeout": 5,
        "header": [
        ],
        "instance_count": 1,
        "need_invalidate": false
    }
```
### 响应
- 响应参数

| **名称**    | **类型** | **描述**                                                            |
|-----------|--------|-------------------------------------------------------------------|
| status | *字符串*  | 预热请求状态 Success或者Failed                                            |
| error_message | *字符串*  | 错误信息                                                              |
| request_id | *字符串*  | 预热请求id，您可通过调用获取预热进度 API获取预热请求的最新状态 ，变更instance数量 API 调整预热的instance |
| error_urls | *列表*   | 预热请求有问题的url列表                                                     |
| timestamp | *字符串*  | 预热请求时间                                                          |
| timeout_at | *字符串*  | 超时时间                                                              |


- 响应示例

``` json
{
    "status": "Success",
    "error_message": "",
    "error_urls": [],
    "request_id": "e059b77b-e427-4489-a50b-4d8c652f114c",
    "timestamp": "2024-04-16 03:12:21.046535",
    "timeout_at": "2024-04-16 03:17:21.046535"
}
```


## prewarm
### 请求预热进度查询
- HTTP方法: `GET`
- 请求参数

| **名称** | **类型** | **描述**                                   |
|--------|--------|------------------------------------------|
| req_id | *字符串*  |  预热请求id，标识预热请求的id，需要在query string中指定 |
- 请求示例

``` json
{
  "req_id": "4f780687-9774-48cd-bd7d-db836abf45af"
}
```

### 响应
- 响应参数

| **名称**     | **类型** | **描述**                                                    |
|------------|--------|-----------------------------------------------------------|
| status     | *字符串*  | 预热状态，FINISHED表示完成，IN_PROGRESS表示进行中，TIMEOUT表示超时，FAILED表示失败 |
| total_count      | *数字*   | 请求预热url的总数                                                |
| download_count      | *数字*   | 已经预热url的总数                                                |
| percentage_complete  | *数字*   | 预热完成的url的百分比                                              |
| in_progress_task_count | *数字*   | 正在预热中的url的数量                                              |
| available_task_count  | *数字*   | 还未预热的url数量                                                |
| download_size  | *数字*   | 已预热文件大小                                                   |
| total_size  | *数字*   | 总预热文件大小                                                   |
| created_at  | *字符串*  | 创建时间                                                      |
|last_update_time | *字符串*  | 最后更新时间                                                    |
|timestamp | *字符串*  | 请求时间                                                      |
|request_id    | *字符串*  | 预热请求id                                                    |

- 响应示例
``` json
{
    "request_id": "684153cc-efab-4a53-9409-357fddc2e2bd",
    "download_size": 137368,
    "total_size": 206052,
    "percentage_complete": 66,
    "available_task_count": 0,
    "in_progress_task_count": 0,
    "download_count": 6,
    "total_count": 6,
    "created_at": "2024-04-16 03:10:21.405303",
    "last_update_time": "2024-04-16 03:11:53.531414",
    "timestamp": "2024-04-16 03:15:09.499889",
    "status": "FINISHED"
}
```
## summary
### 请求预热报告
- HTTP方法: `GET`
- 请求参数

| **名称** | **类型** | **描述**                                   |
|--------|--------|------------------------------------------|
| req_id | *字符串*  |  预热请求id，标识预热请求的id，需要在query string中指定 |
- 请求示例

``` json
{
  "req_id": "4f780687-9774-48cd-bd7d-db836abf45af"
}
```

### 响应
- 响应参数

| **名称**     | **类型** | **描述**                                                    |
|------------|--------|-----------------------------------------------------------|
| status     | *字符串*  | 预热状态，FINISHED表示完成，IN_PROGRESS表示进行中，TIMEOUT表示超时，FAILED表示失败 |
| failure_pops      | *列表*   | 失败的pop列表                                                  |
| failure_urls      | *列表*   | 失败的url劣币哦啊                                                |
| failure_pop_urls_report  | *字符串*  | 报告地址                                                      |
| created_at  | *字符串*  | 创建时间                                                      |
|last_update_time | *字符串*  | 最后更新时间                                                    |
|timestamp | *字符串*  | 请求时间                                                      |
|request_id    | *字符串*  | 预热请求id                                                    |

- 响应示例
``` json
{
    "request_id": "684153cc-efab-4a53-9409-357fddc2e2bd",
    "failure_pops": [],
    "failure_urls": [
        ""
    ],
    "failure_pop_urls_report": "http://reporturl",
    "timestamp": "2024-04-16 03:12:54.605891",
    "created_at": "2024-04-16 03:10:21.405303",
    "last_update_time": "2024-04-16 03:11:53.531414",
    "status": "FINISHED"
}
```
## instances
### 请求instance数量查询
- HTTP方法: `POST`
- 请求参数

| **名称** | **类型** | **描述**                              |
|--------|--------|-------------------------------------|
| req_id | *字符串*  | 预热请求id，标识预热请求的id，需要在query string中指定 |
| DesiredCapacity | *字符串*  | instance变更为的数量                      |
| force_stop | *字符串*  | 是否强制停止预热进程                          |
- 请求示例

``` json
{
    "req_id": "684153cc-efab-4a53-9409-357fddc2e2bd",
    "DesiredCapacity": 1
    // "force_stop": false
}
```

### 响应
- 响应参数

| **名称**     | **类型** | **描述**                      |
|------------|--------|-----------------------------|
| status     | *字符串*  | 预热状态，success表示完成，failed表示失败 |
|timestamp | *字符串*  | 请求时间                        |
|message    | *字符串*  | 消息                          |

- 响应示例
``` json
{
    "status": "success",
    "timestamp": "2024-04-16 03:54:40.366685",
    "message": "Auto Scaling Group prewarm_asg_prod updated to Desired Capacity: 1"
}
```

## instances
### 请求instance数量查询
- HTTP方法: `GET`

### 响应
- 响应参数

| **名称**     | **类型** | **描述**                      |
|------------|--------|-----------------------------|
| status     | *字符串*  | 预热状态，success表示完成，FAILED表示失败 |
| desiredcapacity  | *数字*   | 实例数                         |
|timestamp | *字符串*  | 请求时间                        |
|message    | *字符串*  | 消息                          |

- 响应示例
``` json
{
    "status": "success",
    "timestamp": "2024-04-16 03:56:39.210951",
    "message": "query success",
    "desiredcapacity": 1
}
```


