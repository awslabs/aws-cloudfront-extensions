CloudFront实时日志分析和标准日志分析具有相同的API格式。

## NonRealTimeMonitoringMetrics

- HTTP方法: `GET`
- 请求

``` json
{
  "StartTime": "2021-10-21 11:00:00",
  "EndTime": "2021-10-21 11:00:00",
  "Metric": "all" | "request" | "requestOrigin" | "statusCode" | "statusCodeOrigin" | "chr" | "chrBandWith" | "bandwidth" | "bandwidthOrigin" | "topNUrlRequests" | "topNUrlSize" | "downstreamTraffic"
}
```

- 请求参数

   StartTime: 获取指标数据的起始时间
   EndTime: 获取指标数据的结束时间
   Metric: 指标类型，使用`all`来获取所有指标

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

  CdnData: CloudFront指标数据
  Metric: 指标类型
  DetailData: 具体指标数据
  RequestId: 请求ID
  Interval: 收集指标数据的间隔，默认值为5分钟

## RealTimeMonitoringMetrics

- HTTP方法: `GET`
- 请求

``` json
{
  "StartTime": "2021-10-21 11:00:00",
  "EndTime": "2021-10-21 11:00:00",
  "Metric": "all" | "request" | "requestOrigin" | "statusCode" | "statusCodeOrigin" | "chr" | "chrBandWith" | "bandwidth" | "bandwidthOrigin" | "downloadSpeed" | "downloadSpeedOrigin" | "topNUrlRequests" | "topNUrlSize" | "downstreamTraffic"
}
```

- 请求参数

   StartTime: 获取指标数据的起始时间
   EndTime: 获取指标数据的结束时间
   Metric: 指标类型，使用`all`来获取所有指标

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

  CdnData: CloudFront指标数据
  Metric: 指标类型
  DetailData: 具体指标数据
  RequestId: 请求ID
  Interval: 收集指标数据的间隔，默认值为5分钟
