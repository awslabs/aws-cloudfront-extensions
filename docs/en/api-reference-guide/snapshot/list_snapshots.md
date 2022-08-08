# list_snapshots
## API reference

- HTTP request method: `POST`

- Request body parameters
    - distributionId: String

- Example Request and Description
```http request
/snapshot/list_snapshots?distributionId=E20GR9AX7K798K
```
- Example Response Body
```json
[
  {
    "id": "snapshot2",
    "distribution_id": "E20GR9AX7K798K",
    "snapshot_name": "snapshot2",
    "note": "测试一下这个功能",
    "dateTime": "2022-06-30-12-10-16",
    "config_link": "s3://cloudfrontconfigversions-cloudfrontconfigversions-rtzhljpc7u0i/E20GR9AX7K798K/2022/06/30/E20GR9AX7K798K_2022-06-30-12-10-14.json",
    "s3_bucket": "cloudfrontconfigversions-cloudfrontconfigversions-rtzhljpc7u0i",
    "s3_key": "E20GR9AX7K798K/2022/06/30/E20GR9AX7K798K_2022-06-30-12-10-14.json"
  },
  {
    "id": "first Snapshot",
    "distribution_id": "E20GR9AX7K798K",
    "snapshot_name": "first Snapshot",
    "note": "This is my first snapshot",
    "dateTime": "2022-06-30-11-44-32",
    "config_link": "s3://cloudfrontconfigversions-cloudfrontconfigversions-rtzhljpc7u0i/E20GR9AX7K798K/2022/06/30/E20GR9AX7K798K_2022-06-30-11-44-07.json",
    "s3_bucket": "cloudfrontconfigversions-cloudfrontconfigversions-rtzhljpc7u0i",
    "s3_key": "E20GR9AX7K798K/2022/06/30/E20GR9AX7K798K_2022-06-30-11-44-07.json"
  },
  {
    "id": "_LATEST_",
    "distribution_id": "E20GR9AX7K798K",
    "snapshot_name": "_LATEST_",
    "note": "",
    "dateTime": "2022-06-30-11-42-39",
    "config_link": "s3://cloudfrontconfigversions-cloudfrontconfigversions-rtzhljpc7u0i/E20GR9AX7K798K/2022/07/31/E20GR9AX7K798K_2022-07-31-09-18-43.json",
    "s3_bucket": "cloudfrontconfigversions-cloudfrontconfigversions-rtzhljpc7u0i",
    "s3_key": "E20GR9AX7K798K/2022/07/31/E20GR9AX7K798K_2022-07-31-09-18-43.json"
  }
]
```
