# apply_snapshot
## API reference

- HTTP request method: `POST`

- Request body parameters
    - src_distribution_id: String
    - target_distribution_ids: String
    - snapshot_name: String

- Example Request and Description
```http request
/snapshot/apply_snapshot?src_distribution_id= E3K4JDLORL0EUD&target_distribution_ids=E3K4JDLORL0EUD&snapshot_name= snapshot1
```
- Example Response Body
```json
{
  "statusCode": 200,
  "body": "succeed apply snapshot to target distributions"
}
```
