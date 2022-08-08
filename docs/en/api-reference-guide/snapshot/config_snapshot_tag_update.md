# config_snapshot_tag_update
## API reference

- HTTP request method: `POST`

- Request body parameters
    - distribution_id: String
    - note: String
    - snapshot_name: String

- Example Request and Description
```http request
/snapshot/config_snapshot_tag_update?distribution_id=E3K4JDLORL0EUD&snapshot_name=snapshot1&note=测试版本snapshot
```
- Example Response Body
```json
{
  "Attributes": {
    "note": "测试版本snapshot"
  },
  "ResponseMetadata": {
    "RequestId": "5GLP3OHORDIUPQPUFP50394ARJVV4KQNSO5AEMVJF66Q9ASUAAJG",
    "HTTPStatusCode": 200,
    "HTTPHeaders": {
      "server": "Server",
      "date": "Thu, 04 Aug 2022 05:14:11 GMT",
      "content-type": "application/x-amz-json-1.0",
      "content-length": "52",
      "connection": "keep-alive",
      "x-amzn-requestid": "5GLP3OHORDIUPQPUFP50394ARJVV4KQNSO5AEMVJF66Q9ASUAAJG",
      "x-amz-crc32": "1735756187"
    },
    "RetryAttempts": 0
  }
}
```
