## get_snapshot_link

Get snapshot json file in S3 bucket

- HTTP方法: `POST`

- 请求
```json
/snapshot/get_snapshot_link?distributionId=E20GR9AX7K798K&snapShotName=snapshot2
```

- 请求参数
    - distributionId: String
    - snapShotName: String


- 响应
```json
{
  "config_link": "s3://cloudfrontconfigversions-cloudfrontconfigversions-rtzhljpc7u0i/E20GR9AX7K798K/2022/06/30/E20GR9AX7K798K_2022-06-30-12-10-14.json"
}
```
