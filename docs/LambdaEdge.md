# Lambda@Edge Collection Roadmap

## Description
This solution is a collection of various Lambda@Edge extensions for using CloudFront.
Users are able to find the Lambda application in SAR(Serverless Application Repository) and deploy it with one-click. The solution covers common use scenarios, for example, authentication with Amazon Cognito on a CloudFront distribution, access relative content according to the device type.
It is an open-source project in GitHub, anyone is able to contribute to add new Lambda@Edge features

## Architecture
<img src='./images/LambdaEdgeCollectionForCloudFront.png'>

## Authentication
|    **Name**   | **Description**    | **Version**    |**Release**    |
|------------------|--------------------|----------------|----------------|
| [Authentication by Cognito](../edge/nodejs/authentication-with-cognito) | Integrate with Cognito to provide authentication service. | v1.0.0 | Done |
| Authentication by native library | Integrate the native library, in this case using C library and include file, which's acting authentication function. | - | Todo |
| [Adding security header](../edge/nodejs/add-security-headers) | Add security header into reponse after successful authentication, this function will add 'strict-transport-security' to force browser using HTTPS. | v1.0.0 | Done |


## Validation
|    **Name**   | **Description**    | **Version**    |**Release**    |
|------------------|--------------------|----------------|----------------|
| Validating token | Validate token from HTTP header by MD5 in order to prevent violent access. | - | Todo |

## URL Rewrite
|    **Name**   | **Description**    | **Version**    |**Release**    |
|------------------|--------------------|----------------|----------------|
| Rewrite URL by cookie | Rewrite URL by cookie information when a viewer requests the address. | - | Todo |
| Rewrite URL by USER-AGENT |  Rewrite URL by USER-AGENT from HTTP header when a viewer requests the address. | - | Todo |

## URL Redirect
|    **Name**   | **Description**    | **Version**    |**Release**    |
|------------------|--------------------|----------------|----------------|
| [Redirect URL by device](../edge/nodejs/serving-based-on-device) | Redirect to the different version of an object based on the type of device that the user is using. | v1.0.0 | Done |
| Redirect URL by USER-AGENT | Generate a HTTP redirect response with specific URL regarding to USER-AGENT in the header. | - | Todo |



## Override Request
|    **Name**   | **Description**    | **Version**    |**Release**    |
|------------------|--------------------|----------------|----------------|
| [Standardize query string](../edge/nodejs/normalize-query-string) | Standardize the query string before CloudFront forwards requests to your origin, so that improve the cache hit ratio. | v1.0.0 | Done |
| Convert query string | Convert the query string to key & value pairs and add into header. | - | Todo |
| Format key & value | Format key & value pairs from POST request into specific form. | - | Todo |

## Override Response
|    **Name**   | **Description**    | **Version**    |**Release**    |
|------------------|--------------------|----------------|----------------|
| [Modify response status code](../edge/nodejs/modify-response-status-code)  | Modify response status code to specific code, such as 200 to 206, based on configured parameter. | v1.0.0 | Done |
| [Modify response header](../edge/nodejs/modify-response-header) | Modify response header as per configuration. | v1.0.0 | Done |
| Modify error response to 302 response | Modify error response to 302 response as per configuration. | - | Todo |
| Response status code 200 with zero sized body  | Special feature to support heartbeat function, any request will return HTTP 200 with zero sized body. | - | Todo |
| Generate static content  | Return generated static content based on configured parameter. | - | Todo |

## Origin Selection
|    **Name**   | **Description**    | **Version**    |**Release**    |
|------------------|--------------------|----------------|----------------|
| Access origin by geolocation | Forward request to the nearest PoP as per geolocation. | - | Todo |
| Access origin by customized service| Access origin by calling customized service to get real origin address. | - | Todo |
| [Access origin by weight rate](../edge/nodejs/access-origin-by-weight-rate) | Forward request to multiple origin regarding to pre-configured weight for each origin. | v1.0.0 | Done |
| [Failover to alternative origin](../edge/nodejs/multiple-origin-IP-retry) | Failover to alternative IP from pre-configured list, return from success IP otherwise retry until last one. | v1.0.0 | Done |
| Access origin by MD5 checksum | To prevent accessing the origin site multiple times for the same video file, perform MD5 checksum for the video file and determine when return to the origin. | - | Todo |
| [Support 302 from origin](../edge/nodejs/http302-from-origin) | Process 302 response from origin, then access the redirected URL and return the response. | v1.0.0 | Done |



## Personalize Content
|    **Name**   | **Description**    | **Version**    |**Release**    |
|------------------|--------------------|----------------|----------------|
| Pre-warm cache from specified origin | Load objects from configuration list into specific PoP in order to accelerate access. | - | Todo |
| Resize the picture | Resize the picture to lower qualitied picture before return a viewer. | - | Todo |
| Change the picture format | Change picture format. | - | Todo |
| Dynamic reloading content from primary origin | Dynamic reloading content from primary origin as per defined policy, such as certain hot data regarding to metrics. | - | Todo |


## Security
|    **Name**   | **Description**    | **Version**    |**Release**    |
|------------------|--------------------|----------------|----------------|
| [Anti-hotlinking](../edge/nodejs/anti-hotlinking) | Protect against hotlinking, users need to specify a referer allow list which supports wild card, the request is rejected if the referer is not in the allow list. | v1.2.5 | Done |
| Anti-theft-chain | Customers can verify access requests with anti-theft chains either through non-symmetric key encryption. | - | Todo |
