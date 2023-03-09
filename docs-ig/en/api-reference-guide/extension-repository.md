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
    
    - url_list: The list of urls for prewarm.
    - cf_domain: CloudFront domain name which ends with [cloudfront.net](http://cloudfront.net/). If not set, it will find cf_domain according to CNAME in the url list.
    - region_type: The region type for prewarm. You can specify 3 types of value. The region field should change according to this field.
      * pop：prewarm by PoP(Points of Presence)，the value of region field is a list of PoP(Points of Presence)
      * country：prewarm by country，the value of region field is a list of country
      * region：prewarm by region，the value of region field is a list of region
    - region: The region for prewarm. This field should change according to the region_type field.
      * region_type = "pop": accept a PoP(Points of Presence) list, prewarm in the PoP(Points of Presence) location in the list，for example:["ATL56-C1", "DFW55-C3"]
      * region_type = "region": accept "all" or a region list, prewarm in all regions or a specific region，for example:"all"|["apac", "au"], the supported values are：
        * apac： Asia-Pacific
        * au： Australia
        * ca： Canada
        * sa： South Africa
        * eu： Europe
        * jp： Japan
        * us： United States
        * cn:  China(Chinese mainland prewarm can only be used by deploying this solution in Chinese mainland regions, otherwise it will always fail.)
      * region_type = "country": accept "all" or a country list: prewarm in all countries or a specific country，for example:"all"|["india", "new_zealand"], the supported values are：
        * india： India
        * japan： Japan
        * new_zealand： New Zealand
        * australia：Australia
        * malaysia： Malaysia
        * china： China(Currently, Hong Kong is supported，Chinese mainland prewarm can only be used by deploying this solution in Chinese mainland regions)
        * indonesia：Indonesia
        * philippines：Philippines
        * singapore：Singapore
        * thailand： Thailand
        * vietnam：Vietnam
        * south_korea： South Korea

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








