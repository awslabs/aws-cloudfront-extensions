# CloudFront Monitoring Solution 

## Description
The solution provide an alternative way to get CloudFront performance metrics other than CloudWatch. It can be deployed easily by the CloudFormation template. 

The solution can get below metrics:

1. Request: the number of requests from the client to CloudFront
2. Back-to-origin request: the number of requests which go to the origin
3. Bandwidth: the bandwidth from the client to CloudFront
4. Back-to-origin bandwidth: the bandwidth which goes to the origin
5. Status code: HTTP status codes which include 000, 2xx, 3xx, 4xx and 5xx
6. Back-to-origin status code: HTTP status codes(000, 2xx, 3xx, 4xx and 5xx) that are returned from the origin
7. CHR (Cache Hit Ratio calculated by request)
8. CHR (Cache Hit Ratio calculated by bandwidth)
9. Download speed: the download speed of the resources from CloudFront. It will be separated by country code and ISP (This product includes GeoLite2 Data created by MaxMind, available from https://www.maxmind.com")
10. Back-to-origin download speed: the download speed of the resources from the origin 


## Architecture
<img src='../../docs/images/cloudfront-monitoring-arch.png'>


## Deployment

The solution can be deployed by click [Deploy](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=cloudfront-monitoring&templateURL=https://aws-gcr-solutions.s3.amazonaws.com/aws-cloudfront-extensions/v2.0.0/CloudFrontMonitoringStack.template) link.


### Parameters
This solution uses the following default values during deployment.

|  Parameter   |  Default |  Description |
|  ----------  | ---------| -----------  |
| **CloudFrontDomainList**  | - | The domain name of CloudFront distribution which needs to get the metric data. eg. example.cloudfront.net|
| **deployStage**    | prod | The stage where you would like to deploy API Gateway. eg. prod, beta, dev, qa |
| **CloudFrontLogKeepDays**      | 120 | How many days that AWs keeps CloudFront logs in the S3 bucket |

## Example API

### URI Format

https://domain-name.com/prod/metric?StartTime=2021-10-21%2011:00:00&EndTime=2021-10-21%2011:30:00&Metric=all&Domain=example.cloudfront.net

### Response

The metric data are collected every 5 minutes, you can customize it by update the metricCollector Lambda functions

#### Request

```json
{
    "Response": {
        "Data": [
            {
                "CdnData": [
                    {
                        "Metric": "request",
                        "DetailData": [
                            {
                                "Time": "2021-10-21 11:05:00",
                                "Value": "430"
                            },
                            {
                                "Time": "2021-10-21 11:10:00",
                                "Value": "124"
                            },
                            {
                                "Time": "2021-10-21 11:15:00",
                                "Value": "355"
                            },
                            {
                                "Time": "2021-10-21 11:20:00",
                                "Value": "65"
                            },
                            {
                                "Time": "2021-10-21 11:25:00",
                                "Value": "361"
                            },
                            {
                                "Time": "2021-10-21 11:30:00",
                                "Value": "83"
                            }
                        ]
                    }
                ]
            }
        ],
        "RequestId": "7569bbc3-a3ec-4ff3-94ec-f81a63ff5587",
        "Interval": "5min"
    }
}

```

#### Bandwidth

```json
{
    "Response": {
        "Data": [
            {
                "CdnData": [
                    {
                        "Metric": "bandwidth",
                        "DetailData": [
                            {
                                "Time": "2021-10-21 11:05:00",
                                "Value": "3434275"
                            },
                            {
                                "Time": "2021-10-21 11:10:00",
                                "Value": "1385221"
                            },
                            {
                                "Time": "2021-10-21 11:15:00",
                                "Value": "2248372"
                            },
                            {
                                "Time": "2021-10-21 11:20:00",
                                "Value": "410043"
                            },
                            {
                                "Time": "2021-10-21 11:25:00",
                                "Value": "2261034"
                            },
                            {
                                "Time": "2021-10-21 11:30:00",
                                "Value": "522360"
                            }
                        ]
                    }
                ]
            }
        ],
        "RequestId": "7569bbc3-a3ec-4ff3-94ec-f81a63ff5587",
        "Interval": "5min"
    }
}

```

#### Download Speed

```json
{
    "Response": {
        "Data": [
            {
                "CdnData": [
                    {
                        "Metric": "downloadSpeed",
                        "DetailData": [
                            {
                                "Time": "2021-10-21 11:05:00",
                                "Value": {
                                    "CN": {
                                        "Beijing Guanghuan Xinwang Digital": {
                                            "750K": "0",
                                            "250K": "0.25",
                                            "4M": "0",
                                            "3M": "0",
                                            "2M": "0",
                                            "1M": "0",
                                            "500K": "0.75",
                                            "Other": "0"
                                        }
                                    },
                                    "IT": {
                                        "G-Core Labs S.A.": {
                                            "750K": "0",
                                            "250K": "0",
                                            "4M": "1",
                                            "3M": "0",
                                            "2M": "0",
                                            "1M": "0",
                                            "500K": "0",
                                            "Other": "0"
                                        },
                                        "Aruba S.p.A.": {
                                            "750K": "0",
                                            "250K": "1",
                                            "4M": "0",
                                            "3M": "0",
                                            "2M": "0",
                                            "1M": "0",
                                            "500K": "0",
                                            "Other": "0"
                                        },
                                        "Seflow S.N.C. Di Marco Brame' & C.": {
                                            "750K": "0",
                                            "250K": "1",
                                            "4M": "0",
                                            "3M": "0",
                                            "2M": "0",
                                            "1M": "0",
                                            "500K": "0",
                                            "Other": "0"
                                        }
                                    },
                                    "timestamp": "1634814300",
                                    "domain": "example.cloudfront.net"
                                }
                            }
                        ]
                    }
                ]
            }
        ],
        "RequestId": "7569bbc3-a3ec-4ff3-94ec-f81a63ff5587",
        "Interval": "5min"
    }
}

```

#### CHR

```json
{
    "Response": {
        "Data": [
            {
                "CdnData": [
                    {
                        "Metric": "chr",
                        "DetailData": [
                            {
                                "Time": "2021-10-21 11:05:00",
                                "Value": "94.83"
                            },
                            {
                                "Time": "2021-10-21 11:10:00",
                                "Value": "98.98"
                            },
                            {
                                "Time": "2021-10-21 11:15:00",
                                "Value": "95.35"
                            },
                            {
                                "Time": "2021-10-21 11:20:00",
                                "Value": "100.00"
                            },
                            {
                                "Time": "2021-10-21 11:25:00",
                                "Value": "99.02"
                            },
                            {
                                "Time": "2021-10-21 11:30:00",
                                "Value": "92.65"
                            }
                        ]
                    }
                ]
            }
        ],
        "RequestId": "7569bbc3-a3ec-4ff3-94ec-f81a63ff5587",
        "Interval": "5min"
    }
}

```

#### Status Code

```json
{
    "Response": {
        "Data": [
            {
                "CdnData": [
                    {
                        "Metric": "statusCode",
                        "DetailData": [
                            {
                                "Time": "2021-10-21 11:05:00",
                                "Value": [
                                    {
                                        "StatusCode": "403",
                                        "Count": "80"
                                    },
                                    {
                                        "StatusCode": "200",
                                        "Count": "348"
                                    },
                                    {
                                        "StatusCode": "499",
                                        "Count": "2"
                                    }
                                ]
                            },
                            {
                                "Time": "2021-10-21 11:10:00",
                                "Value": [
                                    {
                                        "StatusCode": "200",
                                        "Count": "98"
                                    },
                                    {
                                        "StatusCode": "403",
                                        "Count": "26"
                                    }
                                ]
                            },
                            {
                                "Time": "2021-10-21 11:15:00",
                                "Value": [
                                    {
                                        "StatusCode": "200",
                                        "Count": "299"
                                    },
                                    {
                                        "StatusCode": "403",
                                        "Count": "56"
                                    }
                                ]
                            },
                            {
                                "Time": "2021-10-21 11:20:00",
                                "Value": [
                                    {
                                        "StatusCode": "200",
                                        "Count": "54"
                                    },
                                    {
                                        "StatusCode": "403",
                                        "Count": "11"
                                    }
                                ]
                            },
                            {
                                "Time": "2021-10-21 11:25:00",
                                "Value": [
                                    {
                                        "StatusCode": "403",
                                        "Count": "56"
                                    },
                                    {
                                        "StatusCode": "200",
                                        "Count": "304"
                                    },
                                    {
                                        "StatusCode": "499",
                                        "Count": "1"
                                    }
                                ]
                            },
                            {
                                "Time": "2021-10-21 11:30:00",
                                "Value": [
                                    {
                                        "StatusCode": "403",
                                        "Count": "15"
                                    },
                                    {
                                        "StatusCode": "200",
                                        "Count": "68"
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ],
        "RequestId": "7569bbc3-a3ec-4ff3-94ec-f81a63ff5587",
        "Interval": "5min"
    }
}

```

