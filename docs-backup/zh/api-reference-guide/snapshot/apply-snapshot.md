## apply_snapshot

- HTTP方法: `POST`

- 请求

```json
/snapshot/apply_snapshot?src_distribution_id=E3K4JDLORL0EUD&target_distribution_ids=E3K4JDLORL0EUD&snapshot_name=snapshot1
```

- 请求参数 
    - src_distribution_id: String
    - target_distribution_ids: String (当有多个分配时，需要使用逗号分隔)
    - snapshot_name: String


- 响应
```json
{
  "statusCode": 200,
  "body": "succeed apply snapshot to target distributions"
}
```
