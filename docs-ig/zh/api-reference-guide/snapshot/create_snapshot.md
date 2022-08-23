## create_snapshot

- HTTP方法: `POST`

- 请求
```http request
/snapshot/create_snapshot?distributionId=E20GR9AX7K798K&snapShotName=ReleaseSnapshot&snapShotNote="This is for Testing"
```

- 请求参数
    - distributionId: String
    - snapShotName: String
    - snapShotNote: String


- 响应
```json
{
  "statusCode": 200,
  "body": "succeed create new snapshot"
}
```
