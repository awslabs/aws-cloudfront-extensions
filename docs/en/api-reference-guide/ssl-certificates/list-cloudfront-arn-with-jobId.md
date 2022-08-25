## list_cloudfront_arn_with_jobId

- HTTP request method: `GET`

- Request

```json
/ssl_for_saas/list_cloudfront_arn_with_jobId?jobId=f48db3b2-90e4-43b2-a46d-bd0e8530bc42
```

- Request body parameters

    - jobId: String

- Response

```json
[
  "arn:aws:cloudfront::596963228260:distribution/E3I7SS3FT9440Q",
  "arn:aws:cloudfront::596963228260:distribution/EHZP3M6MW4FRU",
  "arn:aws:cloudfront::596963228260:distribution/E2OH67LDYUMZTG"
]
```