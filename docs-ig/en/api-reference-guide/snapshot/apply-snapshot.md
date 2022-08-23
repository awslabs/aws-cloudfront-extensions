## apply_snapshot

- HTTP request method: `POST`

- Request

```http request
/snapshot/apply_snapshot?src_distribution_id= E3K4JDLORL0EUD&target_distribution_ids=E3K4JDLORL0EUD&snapshot_name= snapshot1
```

- Request body parameters
    - src_distribution_id: String
    - target_distribution_ids: String (use "," to seperate multiple target distribution)
    - snapshot_name: String


- Response
```json
{
  "statusCode": 200,
  "body": "succeed apply snapshot to target distributions"
}
```
