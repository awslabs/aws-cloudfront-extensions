# list_ssl_certification_with_jobId
## API reference

- HTTP request method: `GET`

- Request body parameters
    - jobId: String
- Example Request and Description
```http request
/ssl_for_saas/list_ssl_certification_with_jobId?jobId=f98d3afb-4956-4ddc-b227-88c7a1f2384c
```
- Example Response Body
```json
[
  "arn:aws:acm:us-east-1:596963228260:certificate/7559c140-a6e0-4c25-8605-c6525561471e",
  "arn:aws:acm:us-east-1:596963228260:certificate/4389ceb0-271c-4a39-a59d-3ddf65705b68",
  "arn:aws:acm:us-east-1:596963228260:certificate/cf3323cb-feab-4688-bdfa-412de32beaf4"
]
```