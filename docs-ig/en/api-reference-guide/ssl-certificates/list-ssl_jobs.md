## list_ssl_jobs

- HTTP request method: `GET`

- Request
```http request
/ssl_for_saas/list_ssl_jobs
```
- Response
```json
[
  {
    "distList": [],
    "jobId": "21b370eb-6c6f-4f2a-8a84-e3cbfdc00318",
    "creationDate": "2022-08-01-01-55-06",
    "cloudfront_distribution_total_number": "0",
    "certValidationStageStatus": "NOTSTART",
    "cert_total_number": "1",
    "certCreateStageStatus": "FAILED",
    "jobType": "create",
    "job_input": "{\n    \"acm_op\": \"create\",\n    \"auto_creation\": \"false\",\n    \"dist_aggregate\": \"false\",\n    \"enable_cname_check\": \"false\",\n    \"cnameList\": [\n        {\n            \"domainName\": \"ccc\",\n            \"sanList\": [\n                \"ccc\"\n            ],\n            \"originsItemsDomainName\": \"\",\n            \"existing_cf_info\": {\n                \"distribution_id\": \"\",\n                \"config_version_id\": \"1\"\n            }\n        }\n    ]\n}",
    "certList": [],
    "cloudfront_distribution_created_number": "0",
    "promptInfo": "An error occurred (ValidationException) when calling the RequestCertificate operation: 2 validation errors detected: Value '[ccc]' at 'subjectAlternativeNames' failed to satisfy constraint: Member must satisfy constraint: [Member must have length less than or equal to 253, Member must have length greater than or equal to 1, Member must satisfy regular expression pattern: ^(\\*\\.)?(((?!-)[A-Za-z0-9-]{0,62}[A-Za-z0-9])\\.)+((?!-)[A-Za-z0-9-]{1,62}[A-Za-z0-9])$]; Value 'ccc' at 'domainName' failed to satisfy constraint: Member must satisfy regular expression pattern: ^(\\*\\.)?(((?!-)[A-Za-z0-9-]{0,62}[A-Za-z0-9])\\.)+((?!-)[A-Za-z0-9-]{1,62}[A-Za-z0-9])$",
    "cert_completed_number": "0",
    "distStageStatus": "NONEED"
  },
  {
    "distList": [],
    "jobId": "f48db3b2-90e4-43b2-a46d-bd0e8530bc42",
    "creationDate": "2022-08-01-06-44-44",
    "cloudfront_distribution_total_number": "1",
    "certValidationStageStatus": "SUCCESS",
    "cert_total_number": "1",
    "certCreateStageStatus": "SUCCESS",
    "jobType": "create",
    "job_input": "{\n    \"acm_op\": \"create\",\n    \"auto_creation\": \"true\",\n    \"dist_aggregate\": \"false\",\n    \"enable_cname_check\": \"false\",\n    \"cnameList\": [\n        {\n            \"domainName\": \"web1.ssl-for-saas.demo.solutions.aws.a2z.org.cn\",\n            \"sanList\": [\n                \"web1.ssl-for-saas.demo.solutions.aws.a2z.org.cn\"\n            ],\n            \"originsItemsDomainName\": \"\",\n            \"existing_cf_info\": {\n                \"distribution_id\": \"E30J9PCOB6KHJV\",\n                \"config_version_id\": \"1\"\n            }\n        }\n    ],\n    \"aws_request_id\": \"f48db3b2-90e4-43b2-a46d-bd0e8530bc42\"\n}",
    "certList": [],
    "cloudfront_distribution_created_number": "1",
    "promptInfo": "",
    "cert_completed_number": "1",
    "distStageStatus": "SUCCESS"
  }
]
```