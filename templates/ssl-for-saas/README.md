# cf-extension-ssl-for-saas

API Gateway input:

access url like https://xxxx.execute-api.us-west-2.amazonaws.com/prod/ssl_for_saas and filling json contents below into body part

```
{
  "acm_op": "import/create",
  "auto_creation": "true/false",
  "dis_aggregate": "true/false",
  "cnameList": [
    {
      "domainName": "example.com",
      "sanList": [
        "a.example.com"
      ],
      "originsItemsDomainName": "example.s3.ap-east-1.amazonaws.com"
    }
  ],
  "pemList": [
    {
      "CertPem": "\n-----BEGIN CERTIFICATE-----xx----END CERTIFICATE-----\n",
      "PrivateKeyPem": "\n-----BEGIN PRIVATE KEY-----xx----END PRIVATE KEY-----\n",
      "ChainPem": "\n-----BEGIN CERTIFICATE-----xx----END CERTIFICATE-----\n",
      "originsItemsDomainName": "risetron.s3.ap-east-1.amazonaws.com"
    }
  ]
}
```
with curl commands like:

```
curl --location --request POST '' \
--header 'Content-Type: application/json' \
--data-raw '{
  "acm_op": "import/create",
  "auto_creation": "true/false",
  "dis_aggregate": "true/false",
  "cnameList": [
    {
      "domainName": "example.com",
      "sanList": [
        "a.example.com"
      ],
      "originsItemsDomainName": "example.s3.ap-east-1.amazonaws.com"
    }
  ],
  "pemList": [
    {
      "CertPem": "\n-----BEGIN CERTIFICATE-----xx----END CERTIFICATE-----\n",
      "PrivateKeyPem": "\n-----BEGIN PRIVATE KEY-----xx----END PRIVATE KEY-----\n",
      "ChainPem": "\n-----BEGIN CERTIFICATE-----xx----END CERTIFICATE-----\n",
      "originsItemsDomainName": "risetron.s3.ap-east-1.amazonaws.com"
    }
  ]
}'
```

Step function input:

```
{
  "acm_op": "import/create",
  "auto_creation": "true/false",
  "dis_aggregate": "true/false",
  "cnameList": [
    {
      "domainName": "example.com",
      "sanList": [
        "a.example.com"
      ],
      "originsItemsDomainName": "example.s3.ap-east-1.amazonaws.com"
    }
  ],
  "pemList": [
    {
      "CertPem": "\n-----BEGIN CERTIFICATE-----xx----END CERTIFICATE-----\n",
      "PrivateKeyPem": "\n-----BEGIN PRIVATE KEY-----xx----END PRIVATE KEY-----\n",
      "ChainPem": "\n-----BEGIN CERTIFICATE-----xx----END CERTIFICATE-----\n",
      "originsItemsDomainName": "risetron.s3.ap-east-1.amazonaws.com"
    }
  ]
}
```

To test distribution aggregation, following example input below:

Note SAN cdn5.risetron.cn will be consider subnet of *.risetron.cn after dist_aggregate is true, thus those 2 cname items will multiplex to 1 certificate rather than 2, that is created with SAN *.risetron.cn

```
{
  "acm_op": "create",
  "auto_creation": "true",
  "dist_aggregate": "true",
  "cnameList": [
    {
      "domainName": "cdn2.risetron.cn",
      "sanList": [
        "*.risetron.cn"
      ],
      "originsItemsDomainName": "risetron.s3.ap-east-1.amazonaws.com"
    },
    {
      "domainName": "cdn4.risetron.cn",
      "sanList": [
        "cdn5.risetron.cn"
      ],
      "originsItemsDomainName": "risetron.s3.ap-east-1.amazonaws.com"
    }
  ],
  "pemList": [
    {
      "CertPem": "\n-----BEGIN CERTIFICATE-----xx----END CERTIFICATE-----\n",
      "PrivateKeyPem": "\n-----BEGIN PRIVATE KEY-----xx----END PRIVATE KEY-----\n",
      "ChainPem": "\n-----BEGIN CERTIFICATE-----xx----END CERTIFICATE-----\n",
      "originsItemsDomainName": "risetron.s3.ap-east-1.amazonaws.com"
    }
  ]
}
```