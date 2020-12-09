# Lambda@Edge

## Authentication
|    **Name**   | **Description**    | **Version**    |**Release**    |
|------------------|--------------------|----------------|----------------|
| Authentication by Cognito | Integrate with Cognito to provide authentication service. | v1.0.0 | Progress |
| Authentication by native library | Integrate the native library, in this case using C library and include file, which's acting authentication function. | v1.0.0 | Todo |
| Adding security header | Add security header into reponse after successful authentication, this function will add 'strict-transport-security' to force browser using HTTPS. | v1.0.0 | Todo |


## Validation
|    **Name**   | **Description**    | **Version**    |**Release**    |
|------------------|--------------------|----------------|----------------|
| Validating token | Validate token from HTTP header by MD5 in order to prevent violent access. | v1.0.0 | Progress |

## URL Rewrite
|    **Name**   | **Description**    | **Version**    |**Release**    |
|------------------|--------------------|----------------|----------------|
| Rewrite URL by cookie | Rewrite URL by cookie information when a viewer requests the address. | v1.0.0 | Todo |
| Rewrite URL by geolocation | Rewrite URL by the geolocation of reuquest when a viewer requests the address. | v1.0.0 | Todo |
| Rewrite URL by USER-AGENT |  Rewrite URL by USER-AGENT from HTTP header when a viewer requests the address. | v1.0.0 | Todo |

## URL Redirect
|    **Name**   | **Description**    | **Version**    |**Release**    |
|------------------|--------------------|----------------|----------------|
| Redirect URL by device | Redirect to the different version of an object based on the type of device that the user is using. | v1.0.0 | Progress |
| Redirect URL by USER-AGENT | Generate a HTTP redirect response with specific URL regarding to USER-AGENT in the header. | v1.0.0 | Todo |



## Override Request
|    **Name**   | **Description**    | **Version**    |**Release**    |
|------------------|--------------------|----------------|----------------|
| Standardize query string | Standardize the query string before CloudFront forwards requests to your origin, so that improve the cache hit ratio. | v1.0.0 | Todo |
| Convert query string | Convert the query string to key & value pairs and add into header. | v1.0.0 | Todo |
| Format key & value | Format key & value pairs from POST request into specific form. | v1.0.0 | Todo |

## Override Response
|    **Name**   | **Description**    | **Version**    |**Release**    |
|------------------|--------------------|----------------|----------------|
| Convert response status code  | Convert response status code to specific code, such as 200 to 206, based on configured parameter. | v1.0.0 | Todo |
| Modify response header | Modify response header as per configuration. | v1.0.0 | Todo |
| Modify error reponse to 302 reponse | Modify error response to 302 response as per configuration. | v1.0.0 | Todo |
| Response status code : 200 with zero sized body  | Special feature to support heartbeat function, any request will return HTTP 200 with zero sized body. | v1.0.0 | Todo |
| Generate static content  | Return generated static content based on configured parameter. | v1.0.0 | Todo |

## Origin Selection
|    **Name**   | **Description**    | **Version**    |**Release**    |
|------------------|--------------------|----------------|----------------|
| Access origin by geolocation | . | v1.0.0 | Todo |
| Access origin by customized rule | . | v1.0.0 | Todo |
| Access origin by weight rate | . | v1.0.0 | Todo |
| Failover to alternative origin | . | v1.0.0 | Todo |
| Access origin by MD5 checksum | To prevent accessing the origin site multiple times for the same video file, perform MD5 checksum for the video file and determine when return to the origin. | v1.0.0 | Todo |
| Support 302 from origin | Process 302 response from origin, then access the redirected URL and return the response. | v1.0.0 | Todo |



## Personalize Content
|    **Name**   | **Description**    | **Version**    |**Release**    |
|------------------|--------------------|----------------|----------------|
| Pre-warm cache from specified origin | Load objects from configuration list into specific PoP in order to accelerate access. | v1.0.0 | Todo |
| Resize the picture | Resize the picture to lower qualitied picture before return a viewer. | v1.0.0 | Todo |


## Security
|    **Name**   | **Description**    | **Version**    |**Release**    |
|------------------|--------------------|----------------|----------------|
| Anti-leeching | Validate the referer in the header to avoid hotlinking. | v1.0.0 | Todo |