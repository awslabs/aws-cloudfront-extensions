## list_ssl_certification_with_jobId

- HTTP request method: `GET`

- Request
```http request
/ssl_for_saas/list_ssl_certification_with_jobId?jobId=f98d3afb-4956-4ddc-b227-88c7a1f2384c
```

- Request body parameters
    - jobId: String

- Response
```json
[
  "arn:aws:acm:us-east-1:596963228260:certificate/7559c140-a6e0-4c25-8605-c6525561471e",
  "arn:aws:acm:us-east-1:596963228260:certificate/4389ceb0-271c-4a39-a59d-3ddf65705b68",
  "arn:aws:acm:us-east-1:596963228260:certificate/cf3323cb-feab-4688-bdfa-412de32beaf4"
]
```