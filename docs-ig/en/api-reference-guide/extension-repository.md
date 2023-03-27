## Pre-warming 
### Request
- HTTP request method: `POST`

- Request body parameters

| **Name**    | **Type**                         | **Required** | **Description**                                                                                                                                                                                                                                                                                 |
|-------------|----------------------------------|-------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| url_list    | *List*                           | yes         | The list of urls for prewarm.                                                                                                                                                                                                                                                                   |
| cf_domain   | *String*                         | yes         | CloudFront domain name which ends with [cloudfront.net](http://cloudfront.net/). If not set, it will find cf_domain according to CNAME in the url list.                                                                                                                                         |
| protocol    | *String*                         | no          | Accept "http" or "https", if not specified the default protocol is http.                                                                                                                                                                                                                        |
| target_type | *String*                         | yes         | The target type for prewarm. You can specify 3 types of value. The region field should be set base on this field. The supported values are : "pop", "country", "region". <br> "pop": pre-warm by PoP (Points of Presence) <br> "country": pre-warm by country <br> "region": pre-warm by region |
| region      | *List or String* | yes         | The region for prewarm. Please see details below.                                                                                                                                                                                                                                               |

- region: This field should be set based on the target_type field.
    * when target_type is "pop": this field should be set a PoP list. It means pre-warm in specific PoP locations, for example:["ATL56-C1", "DFW55-C3"]
    * when target_type is "region": this field can be set as "all" or a list of regions. Possible values in the list are as below:
      * apac： Asia-Pacific
      * au： Australia
      * ca： Canada
      * sa： South Africa
      * eu： Europe
      * jp： Japan
      * us： United States
      * cn： China (Making sure you deploy this solution in AWS China Regions (Beijing or Ningxia))
      
Notice:
When you choose "all", it is highly suggested to turn on Origin Shield. See more details in this [link](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/origin-shield.html#enable-origin-shield).
-
    * when target_type is "country": this field can be set as "all" or a list of countries. Possible values in the list are as below:
      * india： India
      * japan： Japan
      * new_zealand： New Zealand
      * australia：Australia
      * malaysia： Malaysia
      * china： China (Making sure you deploy this solution in AWS China Regions (Beijing or Ningxia))
      * indonesia：Indonesia
      * philippines：Philippines
      * singapore：Singapore
      * thailand： Thailand
      * vietnam：Vietnam
      * south_korea： South Korea
      
Notice:
When you choose "all", it is highly suggested to turn on Origin Shield. See more details in this [link](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/origin-shield.html#enable-origin-shield).

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

| **Name** | **Type**  | **Description**                                                                                                                                                                                                 |
|----------|-----------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|status    | *String*  | The overall pre-warm status. COMPLETED, IN_PROGRESS, TIMEOUT or FAILED                                                                                                                                          |
|total    | *Number*  | The count of urls to pre-warm.                                                                                                                                                                                  |
|completed    | *Number* | The count of urls which are pre-warmed.                                                                                                                                                                         |
|inProgress    | *Number* | The count of urls which are being pre-warmed.                                                                                                                                                                   |
|failedUrl    | *List*    | The list of urls which are failed to be pre-warmed.                                                                                                                                                             |
|inProgressUrl    | *List*    | The list of urls which are in progress to be pre-warmed.                                                                                                                                                        |
|successUrl    | *List*    | The list of urls which are succesful to be pre-warmed. This field can will be shown only if the ShowSuccessUrls is set to be true. You can set the ShowSuccessUrls by updating Prewarm CloudFormation template. |

- Response example

``` json
{
    "status": "COMPLETED",
    "total": 2,
    "completed": 2,
    "inProgress": 0,
    "failedUrl": ["https://www.example.com/images/demo.png"],
    "inProgressUrl": [],
    "successUrl": ["https://www.example.com/images/xx.png"]
}
```






