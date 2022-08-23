## cert_list

- HTTP request method: `GET`

- Request
```http request
/ssl_for_saas/cert_list
```


- Response
```json
[
  {
    "CertificateArn": "arn:aws:acm:us-east-1:596963228260:certificate/e73c12ee-1ea1-4607-8f38-e1fce284c48e",
    "DomainName": "test.omnimyo.store",
    "SubjectAlternativeNames": "test.omnimyo.store",
    "Issuer": "Amazon",
    "CreatedAt": "\"2022-07-13 05:24:46.152000+00:00\"",
    "IssuedAt": "",
    "Status": "ISSUED",
    "NotBefore": "\"2022-07-13 00:00:00+00:00\"",
    "NotAfter": "\"2023-08-12 23:59:59+00:00\"",
    "KeyAlgorithm": "RSA-2048"
  },
  {
    "CertificateArn": "arn:aws:acm:us-east-1:596963228260:certificate/7559c140-a6e0-4c25-8605-c6525561471e",
    "DomainName": "web1.ssl-for-saas.demo.solutions.aws.a2z.org.cn",
    "SubjectAlternativeNames": "web1.ssl-for-saas.demo.solutions.aws.a2z.org.cn",
    "Issuer": "Amazon",
    "CreatedAt": "\"2022-08-01 09:48:48.246000+00:00\"",
    "IssuedAt": "",
    "Status": "ISSUED",
    "NotBefore": "\"2022-08-01 00:00:00+00:00\"",
    "NotAfter": "\"2023-08-30 23:59:59+00:00\"",
    "KeyAlgorithm": "RSA-2048"
  },
  {
    "CertificateArn": "arn:aws:acm:us-east-1:596963228260:certificate/4389ceb0-271c-4a39-a59d-3ddf65705b68",
    "DomainName": "web2.ssl-for-saas.demo.solutions.aws.a2z.org.cn",
    "SubjectAlternativeNames": "web2.ssl-for-saas.demo.solutions.aws.a2z.org.cn",
    "Issuer": "Amazon",
    "CreatedAt": "\"2022-08-01 09:48:53.586000+00:00\"",
    "IssuedAt": "",
    "Status": "ISSUED",
    "NotBefore": "\"2022-08-01 00:00:00+00:00\"",
    "NotAfter": "\"2023-08-30 23:59:59+00:00\"",
    "KeyAlgorithm": "RSA-2048"
  },
  {
    "CertificateArn": "arn:aws:acm:us-east-1:596963228260:certificate/cf3323cb-feab-4688-bdfa-412de32beaf4",
    "DomainName": "web3.ssl-for-saas.demo.solutions.aws.a2z.org.cn",
    "SubjectAlternativeNames": "web3.ssl-for-saas.demo.solutions.aws.a2z.org.cn",
    "Issuer": "Amazon",
    "CreatedAt": "\"2022-08-01 09:48:58.895000+00:00\"",
    "IssuedAt": "",
    "Status": "ISSUED",
    "NotBefore": "\"2022-08-01 00:00:00+00:00\"",
    "NotAfter": "\"2023-08-30 23:59:59+00:00\"",
    "KeyAlgorithm": "RSA-2048"
  }
]
```