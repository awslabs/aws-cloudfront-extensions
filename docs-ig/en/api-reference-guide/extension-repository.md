## Pre-warming 
- HTTP request method: `POST`

- Request body parameters

| **Name**    | **Type**                         | **Required** | **Description**                                                                                                                                       |
|-------------|----------------------------------|--------------|-------------------------------------------------------------------------------------------------------------------------------------------------------|
| url_list    | *List*                           | yes          | The list of urls for prewarm.                                                                                                                         |
| cf_domain   | *String*                         | yes          | CloudFront domain name which ends with [cloudfront.net](http://cloudfront.net/). If not set, it will find cf_domain according to CNAME in the url list. |
| protocol    | *String*                         | false        | Accept "http" or "https", if not specified the default protocol is http.                                                                              |
| target_type | *String*                         | yes          | The target type for prewarm. You can specify 3 types of value. The region field should change according to this field, please details below.          |
| region      | *List or String* | yes          | The region for prewarm. This field should change according to the target_type field, please details below.                                            |

- Including:
  - target_type: You can specify 3 types of value.
      * pop：pre-warm by PoP (Points of Presence)
      * country：pre-warm by country
      * region：pre-warm by region
  - region: This field should change according to the target_type field.
      * target_type = "pop": this field accept a PoP list, pre-warm in the PoP location in the list,for example:["ATL56-C1", "DFW55-C3"]
      * target_type = "region": this field  accept "all"(best to use after opening Origin Shield,[link](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/origin-shield.html#enable-origin-shield) for details) or a region list, pre-warm in all regions or a specific region,for example:"all" or ["apac", "au"], the supported values are：
        * apac： Asia-Pacific
        * au： Australia
        * ca： Canada
        * sa： South Africa
        * eu： Europe
        * jp： Japan
        * us： United States
        * cn： China (Chinese mainland prewarm can only be used by deploying this solution in Beijing or Ningxia region, otherwise it will always fail.)
      * target_type = "country": this field accept "all"(best to use after opening Origin Shield,[link](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/origin-shield.html#enable-origin-shield) for details) or a country list: pre-warm in all countries or a specific country,for example:"all"|["india", "new_zealand"], the supported values are：
        * india： India
        * japan： Japan
        * new_zealand： New Zealand
        * australia：Australia
        * malaysia： Malaysia
        * china： China (Chinese mainland prewarm can only be used by deploying this solution in Beijing or Ningxia region)
        * indonesia：Indonesia
        * philippines：Philippines
        * singapore：Singapore
        * thailand： Thailand
        * vietnam：Vietnam
        * south_korea： South Korea


- Request example:
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
### Response
- Response parameters

| **Name** | **Type** | **Description**                                                                 |
|----------|-----------|---------------------------------------------------------------------------------|
|requestID    |*String*   | The request id, which you can use it in PrewarmStatus API to get the pre-warm status. |

- Response example

``` json
{
  "requestID": "4f780687-9774-48cd-bd7d-db836abf45af"
}
```

## PrewarmStatus 
### Request

- HTTP request method: `GET`
- Request parameters

| **Name** | **Type** | **Description**                                                                    |
|----------|-----------|------------------------------------------------------------------------------------|
|requestID    |*String*   | The request id generated after a pre-warm is scheduled, it is in the query string. |

- Request example

``` json
{
  "requestID": "4f780687-9774-48cd-bd7d-db836abf45af"
}
```

### Response
- Response parameters

| **Name** | **Type**  | **Description**                                                        |
|----------|-----------|------------------------------------------------------------------------|
|status    | *String*  | The overall pre-warm status. COMPLETED, IN_PROGRESS, TIMEOUT or FAILED |
|total    | *Number*  | Total url count to pre-warm.                                           |
|completed    | *Number* | The count of urls which are pre-warmed.                                |
|inProgress    | *Number* | The count of urls which are being pre-warmed.                          |
|failedUrl    | *List*    | The list of urls which are failed to pre-warm.                         |


- Response example

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






