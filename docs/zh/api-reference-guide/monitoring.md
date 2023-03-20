CloudFront实时日志分析和标准日志分析具有相同的API格式。指标数据每5分钟收集一次，您可以通过更改metricCollector Lambda函数对其进行自定义。

## NonRealTimeMonitoringMetrics

- HTTP方法: `GET`
- 请求

``` json
{
  "StartTime": "2021-10-21 11:00:00",
  "EndTime": "2021-10-21 11:00:00",
  "Metric": "all" | "request" | "requestOrigin" | "statusCode" | "statusCodeOrigin" | "chr" | "chrBandWidth" | "bandwidth" | "bandwidthOrigin" | "topNUrlRequests" | "topNUrlSize" | "downstreamTraffic"
}
```

- 请求参数

    - StartTime: 获取指标数据的起始时间
    - EndTime: 获取指标数据的结束时间
    - Metric: 指标类型，使用`all`来获取所有指标

- 响应

``` json
{
    "Response": {
        "Data": [
            {
                "CdnData": [
                    {
                        "Metric": "request",
                        "DetailData": [
                            {
                                "Time": "2022-06-23 12:50:00",
                                "Value": "41"
                            },
                            {
                                "Time": "2022-06-23 12:55:00",
                                "Value": "45"
                            },
                            {
                                "Time": "2022-06-23 13:00:00",
                                "Value": "39"
                            }
                        ]
                    }
                ]
            }
        ],
        "RequestId": "05228fbe-65b1-4670-85ba-0d7307ece749",
        "Interval": "5min"
    }
}
```

- 参数

    - CdnData: CloudFront指标数据
    - Metric: 指标类型
    - DetailData: 具体指标数据
    - RequestId: 请求ID
    - Interval: 收集指标数据的间隔，默认值为5分钟

## RealTimeMonitoringMetrics

- HTTP方法: `GET`
- 请求

``` json
{
  "StartTime": "2021-10-21 11:00:00",
  "EndTime": "2021-10-21 11:00:00",
  "Metric": "all" | "request" | "requestOrigin" | "statusCode" | "statusCodeOrigin" | "chr" | "chrBandWidth" | "bandwidth" | "bandwidthOrigin" | "downloadSpeed" | "downloadSpeedOrigin" | "topNUrlRequests" | "topNUrlSize" | "downstreamTraffic"
}
```

- 请求参数

    - StartTime: 获取指标数据的起始时间
    - EndTime: 获取指标数据的结束时间
    - Metric: 指标类型，使用`all`来获取所有指标

- 响应

``` json
{
    "Response": {
        "Data": [
            {
                "CdnData": [
                    {
                        "Metric": "request",
                        "DetailData": [
                            {
                                "Time": "2022-06-23 12:50:00",
                                "Value": "41"
                            },
                            {
                                "Time": "2022-06-23 12:55:00",
                                "Value": "45"
                            },
                            {
                                "Time": "2022-06-23 13:00:00",
                                "Value": "39"
                            }
                        ]
                    }
                ]
            }
        ],
        "RequestId": "05228fbe-65b1-4670-85ba-0d7307ece749",
        "Interval": "5min"
    }
}
```

- 参数

    - CdnData: CloudFront指标数据
    - Metric: 指标类型
    - DetailData: 具体指标数据
    - RequestId: 请求ID
    - Interval: 收集指标数据的间隔，默认值为5分钟

## 更多API示例

### URL格式

https://domain-name.com/prod/metric?StartTime=2021-10-21%2011:00:00&EndTime=2021-10-21%2011:30:00&Metric=all&Domain=example.cloudfront.net

### 响应

指标数据每5分钟收集一次，您可以通过更新metricCollector Lambda函数对其进行自定义。

#### 请求数量

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

#### 带宽

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

#### 下载速率

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

#### 缓存命中率

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

#### 状态码

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
