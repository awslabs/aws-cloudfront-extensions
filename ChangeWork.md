1. 给graphQL的lambda增加权限：cloudfront:ListRealtimeLogConfigs。
2. 修改listDistribution方法，增加返回采样率内容，type更新。
3. 【手动】CloudFront失效旧UI内容。
4. remove ui console log & 解决依赖冲突 react-diff-viewer-continued 更新
5. Requests latency (300-1000+ms) rate | The percentage of requests whose latency are larger than 1 second | Requests latency (300-1000+ms) rate | 时延300ms至1s以上各阶段比例 文案

{
  "metricId": {
    "S": "latencyRatio-d1y8w38rcecqgi.cloudfront.net"
  },
  "timestamp": {
    "N": "1691039946"
  },
  "metricData": {
    "M": {
      "US": {
        "L": [
          {
            "M": {
              "Count": {
                "S": "10"
              },
              "Latency": {
                "S": "1.2"
              },
              "Latency_300": {
                "S": "1.5"
              },
              "Latency_600": {
                "S": "1.4"
              }
            }
          }
        ]
      }
    }
  }
}