CloudFront real-time log analysis and standard log analysis have the same API format. 

## RealTimeMonitoringMetrics

- HTTP request method: `GET`
- Request

``` json
{
  "StartTime": "2021-10-21 11:00:00",
  "EndTime": "2021-10-21 11:00:00",
  "Metric": "all" | "request" | "requestOrigin" | "statusCode" | "statusCodeOrigin" | "chr" | "chrBandWith" | "bandwidth" | "bandwidthOrigin" | "downloadSpeed" | "downloadSpeedOrigin" | "topNUrlRequests" | "topNUrlSize" | "downstreamTraffic"
}
```

- Request body parameters

   StartTime: start time to get the metric data
   EndTime: end time to get the metric data
   Metric: metric type, use `all` if you want to get all metrics

- Response

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

- Parameters

  CdnData: CloudFront metric data
  Metric: the metric type
  DetailData: detailed metric data in each timestamp
  RequestId: a unique ID for each request
  Interval: the interval for collecting metric data, and the default value is 5 minutes

