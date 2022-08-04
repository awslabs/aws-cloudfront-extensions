# get_snapshot_link
## API reference

- HTTP request method: `POST`

- Request body parameters
    - distributionId: String
    - snapShotName: String

- Example Request and Description
```http request
/snapshot/get_snapshot_link?distributionId=E20GR9AX7K798K&snapShotName=snapshot2
```
- Example Response Body
```json
{
  "config_link": "s3://cloudfrontconfigversions-cloudfrontconfigversions-rtzhljpc7u0i/E20GR9AX7K798K/2022/06/30/E20GR9AX7K798K_2022-06-30-12-10-14.json"
}
```
