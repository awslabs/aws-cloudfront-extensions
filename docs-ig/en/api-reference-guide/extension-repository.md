## prewarm
### Request prewarm
- **HTTP Method:** `POST`
- **Request Parameters**

| **Name**        | **Type**  | **Required** | **Description**                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
|-----------------|-----------|--------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| url_list        | *List*    | Yes          | List of URLs to preheat                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| cf_domain       | *String*  | Yes          | CloudFront domain ending in [cloudfront.net](http://cloudfront.net/). If not set, it will be searched for cf_domain based on CNAME in the url_list                                                                                                                                                                                                                                                                                                                          |
| timeout         | *Number*  | Yes          | Represents the preheat time limit. Preheating process will automatically stop if timeout is reached                                                                                                                                                                                                                                                                                                                                                                         |
| target_type     | *String*  | Yes          | Preheating target type. You can specify 3 types of values, including: "pop", "country", "region".<br>"pop": Preheat based on nodes<br>"country": Preheat based on country<br>"region": Preheat based on region. If you choose one of the values pop country region, the corresponding pops countries regions need to be filled in with the corresponding values to be preheated. If not filled in, the system will default to preheat according to some pops of preheating. |
| pops            | *List*    | No           | List of pops to preheat. Details as follows:                                                                                                                                                                                                                                                                                                                                                                                                                                |
| countries       | *List*    | No           | List of countries to preheat. Details as follows:                                                                                                                                                                                                                                                                                                                                                                                                                           |
| regions         | *List*    | No           | List of regions to preheat. Details as follows:                                                                                                                                                                                                                                                                                                                                                                                                                             |
| instance_count  | *Number*  | Yes          | Number of instances to preheat                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| need_invalidate | *Boolean* | No           | Whether to clear cache before preheating, default false                                                                                                                                                                                                                                                                                                                                                                                                                     |

- **Different values need to be set according to different target_type**
    * When target_type is "pop", pops field needs to pass a list of pop ids, indicating preheating at the specified edge nodes in the list (it is better to cooperate with the opening of Origin Shield effect, details see [link](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/origin-shield.html#enable-origin-shield)), for example ["ATL56-C1", "DFW55-C3"], if pass empty [] will be preheated by default some pop points of system
    * When target_type is "region", regions field needs to pass the following value list range, indicating preheating in specific regions (it is better to cooperate with the opening of Origin Shield effect, details see [link](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/origin-shield.html#enable-origin-shield)), for example ["apac", "au"], if pass empty [] will be preheated by default some pop points in the following regions, available regions are:
          * apac： Asia-Pacific
          * au： Australia
          * ca： Canada
          * sa： South Africa
          * eu： Europe
          * jp： Japan
          * us： United States
          * cn： China(Ensure that you have deployed the preheating solution in Beijing or Ningxia, China region)
    * When target_type is "country", countries field needs to pass the following value list range, indicating preheating in specific countries (it is better to cooperate with the opening of Origin Shield effect, details see [link](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/origin-shield.html#enable-origin-shield)) or country code list, for example ["india", "new_zealand"], if pass empty [] will be preheated by default some pop points in the following countries, available countries are:
          * india： India
          * japan： Japan
          * new_zealand： New Zealand
          * australia：Australia
          * malaysia： Malaysia
          * china： China(Ensure that you have deployed the preheating solution in Beijing or Ningxia, China region)
          * indonesia：Indonesia
          * philippines：Philippines
          * singapore：Singapore
          * thailand： Thailand
          * vietnam：Vietnam
          * south_korea： South Korea

- **Request Example**
```json
{
    "url_list": [
        "https://www.example.com/index.html",
        "https://www.example.com/css/bootstrap-icons.css"
    ],
    "cf_domain": "www.example.com",
    "target_type": "pop",
    "countries": [],
    "regions": [],
    "pops": [
        "ATL56-C1",
        "SIN2-C1",
        "DFW55-C3"
    ],
    "timeout": 5,
    "header": [],
    "instance_count": 1,
    "need_invalidate": false
}
```


### Response
- Response parameters

| **Name**      | **Type** | **Description**                                                                                                                              |
|---------------|----------|----------------------------------------------------------------------------------------------------------------------------------------------|
| status        | *String* | Status of the pre-warm request: Success or Failed                                                                                            |
| error_message | *String* | Error message if any                                                                                                                         |
| request_id    | *String* | ID of the pre-warm request. You can use this to retrieve the latest status of the pre-warm request or adjust the instance count via the API. |
| error_urls    | *list*   | List of URLs with issues in the pre-warm request                                                                                             |
| timestamp     | *String* | Timestamp of the pre-warm request                                                                                                            |
| timeout_at    | *String* | Timeout duration                                                                                                                             |


- Response example

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
### Query Prewarm Progress 

- HTTP Method: `GET`
- Request parameters

| **Name** | **Type** | **Description**                                                                    |
|----------|----------|------------------------------------------------------------------------------------|
| req_id   | *String* | The request id generated after a pre-warm is scheduled, it is in the query string. |

- Request example

``` json
{
  "req_id": "4f780687-9774-48cd-bd7d-db836abf45af"
}
```

### Response
- Response parameters

| **Name**               | **Type** | **Description**                                                        |
|------------------------|----------|------------------------------------------------------------------------|
| status                 | *String* | Status of the pre-warm process: FINISHED, IN_PROGRESS, TIMEOUT, FAILED |
| total_count            | *Number* | Total number of URLs to pre-warm                                       |
| download_count         | *Number* | Total number of URLs pre-warmed                                        |
| percentage_complete    | *Number* | Percentage of URLs pre-warmed                                          |
| in_progress_task_count | *Number* | Number of URLs currently in pre-warm process                           |
| available_task_count   | *Number* | Number of URLs yet to be pre-warmed                                    |
| download_size          | *Number* | Size of downloaded files                                               |
| total_size             | *Number* | 	Total size of files to pre-warm                                       |
| created_at             | *String* | Creation timestamp of the request                                      |
| last_update_time       | *String* | Timestamp of the last update                                           |
| timestamp              | *String* | Timestamp of the request                                               |
| request_id             | *String* | ID of the pre-warm request                                             |

- Response example

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
### Request Prewarm Report
- HTTP Method: `GET`
- Request Parameters

| **Name** | **Type** | **Description**                                                   |
|----------|----------|-------------------------------------------------------------------|
| req_id   | *String* | ID of the pre-warm request, specifying the ID in the query string |
- Request Example

``` json
{
  "req_id": "4f780687-9774-48cd-bd7d-db836abf45af"
}
```

### Response
- Response Parameters

| **Name**                | **Type** | **Description**                                                        |
|-------------------------|----------|------------------------------------------------------------------------|
| status                  | *String* | Status of the pre-warm process: FINISHED, IN_PROGRESS, TIMEOUT, FAILED |
| failure_pops            | *List*   | List of failed points of presence (POPs)                               |
| failure_urls            | *List*   | List of failed URLs                                                    |
| failure_pop_urls_report | *String* | Report URL for failed POPs and URLs                                    |
| created_at              | *String* | Creation timestamp of the request                                      |
| last_update_time        | *String* | Timestamp of the last update                                           |
| timestamp               | *String* | Timestamp of the request                                               |
| request_id              | *String* | ID of the pre-warm request                                             |

- Response Example
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
### Change Instance Count
- HTTP Method: `POST`
- Request Parameters

| **Name**        | **Type**  | **Description**                                                   |
|-----------------|-----------|-------------------------------------------------------------------|
| req_id          | *String*  | ID of the pre-warm request, specifying the ID in the query string |
| DesiredCapacity | *Number*  | Desired number of instances to change to                          |
| force_stop      | *Boolean* | Whether to force-stop the pre-warm process                        |
- Request Example

``` json
{
    "req_id": "684153cc-efab-4a53-9409-357fddc2e2bd",
    "DesiredCapacity": 1
    // "force_stop": false
}
```

### Response
- Response Parameters

| **Name**  | **Type** | **Description**                                           |
|-----------|----------|-----------------------------------------------------------|
| status    | *String* | Status of the instance changed process: success or failed |
| timestamp | *String* | Timestamp of the request                                  |
| message   | *String* | Message                                                   |

- Response Example
``` json
{
    "status": "success",
    "timestamp": "2024-04-16 03:54:40.366685",
    "message": "Auto Scaling Group prewarm_asg_prod updated to Desired Capacity: 1"
}
```

## instances
###  Query Instance Count
- HTTP Method: `GET`

### Response
- Response Parameters

| **Name**        | **Type** | **Description**                                           |
|-----------------|----------|-----------------------------------------------------------|
| status          | *String* | Status of the instance changed process: success or failed |
| desiredcapacity | *Number* | Desired number of instances to change to                  |
| timestamp       | *String* | Timestamp of the request                                  |
| message         | *String* | Message                                                   |

- Response Example
``` json
{
    "status": "success",
    "timestamp": "2024-04-16 03:56:39.210951",
    "message": "query success",
    "desiredcapacity": 1
}
```




