## get_ssl_job

- HTTP方法: `GET`

- 请求
```http request
/ssl_for_saas/get_ssl_job?jobId=f48db3b2-90e4-43b2-a46d-bd0e8530bc42
```

- 请求参数
  - jobId: String


- 响应
```json
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
```
