## create_snapshot

- HTTP request method: `POST`

- Request


```json

/snapshot/create_snapshot?distributionId=E20GR9AX7K798K&snapShotName=ReleaseSnapshot&snapShotNote="This is for Testing"

```


- Request body parameters

    - distributionId: String
    - snapShotName: String
    - snapShotNote: String


- Response
```json
{
  "statusCode": 200,
  "body": "succeed create new snapshot"
}
```
