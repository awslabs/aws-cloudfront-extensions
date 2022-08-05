# create_snapshot
## API reference

- HTTP request method: `POST`

- Request body parameters
    - distributionId: String
    - snapShotName: String
    - snapShotNote: String

- Example Request and Description
```http request
/snapshot/create_snapshot?distributionId=E20GR9AX7K798K&snapShotName=ReleaseSnapshot&snapShotNote="This is for Testing"
```
- Example Response Body
```json
{
  "statusCode": 200,
  "body": "succeed create new snapshot"
}
```
