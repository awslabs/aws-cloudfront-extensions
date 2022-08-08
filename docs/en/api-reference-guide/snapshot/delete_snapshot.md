# delete_snapshot
## API reference

- HTTP request method: `POST`

- Request body parameters
    - distributionId: String
    - snapShotName: String

- Example Request and Description
```http request
/snapshot/delete_snapshot?distributionId=E20GR9AX7K798K&snapShotName=dfdfd
```
- Example Response Body
```json
{
  "statusCode": 200,
  "body": "succeed delete snapshot"
}
```
