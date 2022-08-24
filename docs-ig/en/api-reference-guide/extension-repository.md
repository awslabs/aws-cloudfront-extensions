## Pre-warming 
- HTTP request method: `POST`
- Request

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

- Request body parameters

  url_list: The list of urls for prewarm.
  cf_domain: CloudFront domain name which ends with [cloudfront.net](http://cloudfront.net/). If not set, it will find cf_domain according to CNAME in the url list.
  region: The region for prewarm. You can specify 3 types of value.

  * all: prewarm in all regions
  * pop id list such as ["ATL56-C1", "DFW55-C3"]: prewarm in the PoP location in the list
  * region code: pre-warm in a specific region, the available regions are:
    * apac: Asia-Pacific
    * au: Australia
    * ca: Canada
    * sa: South Africa
    * eu: Europe
    * jp: Japan
    * us: United States

- Response

``` json
{
  "requestID": "4f780687-9774-48cd-bd7d-db836abf45af"
}
```

- Response parameters

  `requestID`: The request ID, which you can use in PrewarmStatus API to get the prewarm status.

## PrewarmStatus 
- HTTP request method: `GET`
- Request

``` json
{
  "requestID": "4f780687-9774-48cd-bd7d-db836abf45af"
}
```

- Request body parameters

  `requestID`: a unique ID for each request.

- Response

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
- Response parameters

  `status`: the overall prewarm status

  `total`: total url count to pre-warm

  `completed`: the count of urls which are prewarmed

  `inProgress`: the count of urls which are being prewarmed

  `failedUrl`: the list of urls which are failed to prewarm

  `inProgressUrl`: the list of urls which are being prewarmed

  `successUrl`: the list of urls which are successfully prewarmed








