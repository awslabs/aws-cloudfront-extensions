## import-create-ssl

- HTTP方法: `POST`

- 请求

  - 创建一个ACM证书，并根据现有分配的指定配置版本自动创建新的CloudFront分配 
    ``` json
    {
      "acm_op": "create",   
      "auto_creation": "true", 
      "cnameList": [  
        {
          "domainName": "YOURDOMAINNAME.COM", 
          "sanList": [
            "YOURDOMAINNAME.COM",
            "YOURDOMAINNAMEALIAS1.COM"
          ],
          "existing_cf_info": 
          {
            "distribution_id": "E195R1W5GIVPF5", 
            "config_version_id": "1"
          }
        }
      ]
    }
    ```

  - 创建一个ACM证书，并根据现有分配的配置自动创建新的CloudFront分配
    ``` json
    {
      "acm_op": "create",   
      "auto_creation": "true", 
      "cnameList": [  
        {
          "domainName": "YOURDOMAINNAME.COM", 
          "sanList": [
            "YOURDOMAINNAME.COM",
            "YOURDOMAINNAMEALIAS1.COM"
          ],
          "existing_cf_info": 
          {
            "distribution_id": "E195R1W5GIVPF5", 
          }
        }
      ]
    }
    ```

  - 创建两个ACM证书，并根据现有分配的配置自动创建新的CloudFront分配
    ``` json
    {
      "acm_op": "create",   
      "auto_creation": "true", 
      "cnameList": [  
        {
          "domainName": "YOURDOMAINNAME1.COM", 
          "sanList": [
            "YOURDOMAINNAME1.COM",
            "YOURDOMAINNAME1ALIAS1.COM",
            "YOURDOMAINNAME1ALIAS2.COM" 
          ],
          "existing_cf_info": 
          {
            "distribution_id": "E195R1W5GIVPF5", 
          }
        },
        {
          "domainName": "YOURDOMAINNAME2.COM", 
          "sanList": [
            "YOURDOMAINNAME2.COM",
            "YOURDOMAINNAME2ALIAS1.COM",
            "YOURDOMAINNAME2ALIAS1.COM" 
          ],
          "existing_cf_info": 
          {
            "distribution_id": "E195R1W5GIVPF5", 
          }
        }
      ]
    }
    ```

  - 导入一个ACM证书并从现有分配的配置自动创建新的CloudFront分配

    ``` json
    {
        "acm_op": "import",
        "auto_creation": "true",
        "dist_aggregate": "false",
        "enable_cname_check": "false",
        "cnameList": [],
        "pemList": [
            {
                "CertPem": "-----BEGIN CERTIFICATE-----\nXXXXXXXXXXXX\n-----END CERTIFICATE-----",
                "PrivateKeyPem": "-----BEGIN PRIVATE KEY-----\nXXXXXXXXXXXX\n-----END PRIVATE KEY-----",
                "ChainPem": "-----BEGIN CERTIFICATE-----\nAAAAAAAAAAA\n-----END CERTIFICATE-----\n-----BEGIN CERTIFICATE-----\nBBBBBBBBBBB\n-----END CERTIFICATE-----\n-----BEGIN CERTIFICATE-----\nCCCCCCCCCCC\n-----END CERTIFICATE-----",
                "existing_cf_info": {
                    "distribution_id": "E1DACGTRXKKWCH"
                }
            }
        ]
    }
    ```

  - 导入两个ACM证书并从现有分配的指定配置版本自动创建新的CloudFront分配
    ``` json
    {
        "acm_op": "import",
        "auto_creation": "true",
        "dist_aggregate": "false",
        "enable_cname_check": "false",
        "cnameList": [],
        "pemList": [
            {
                "CertPem": "-----BEGIN CERTIFICATE-----\nXXXXXXXXXXXX\n-----END CERTIFICATE-----",
                "PrivateKeyPem": "-----BEGIN PRIVATE KEY-----\nXXXXXXXXXXXX\n-----END PRIVATE KEY-----",
                "ChainPem": "-----BEGIN CERTIFICATE-----\nAAAAAAAAAAA\n-----END CERTIFICATE-----\n-----BEGIN CERTIFICATE-----\nBBBBBBBBBBB\n-----END CERTIFICATE-----\n-----BEGIN CERTIFICATE-----\nCCCCCCCCCCC\n-----END CERTIFICATE-----",
                "existing_cf_info": {
                    "distribution_id": "E1DACGTRXKKWCH"
                }
            },
            {
                "CertPem": "-----BEGIN CERTIFICATE-----\nXXXXXXXXXXXX\n-----END CERTIFICATE-----",
                "PrivateKeyPem": "-----BEGIN PRIVATE KEY-----\nXXXXXXXXXXXX\n-----END PRIVATE KEY-----",
                "ChainPem": "-----BEGIN CERTIFICATE-----\nAAAAAAAAAAA\n-----END CERTIFICATE-----\n-----BEGIN CERTIFICATE-----\nBBBBBBBBBBB\n-----END CERTIFICATE-----\n-----BEGIN CERTIFICATE-----\nCCCCCCCCCCC\n-----END CERTIFICATE-----",
                "existing_cf_info": {
                    "distribution_id": "E1DACGTRXKKWCH"
                }
            }
        ]
    }
    ```

- 响应

``` json
{
  "statusCode": 200,
  "body": "21b370eb-6c6f-4f2a-8a84-e3cbfdc00318"
}
```

- 响应参数

| **Name**   | **Type** | **Description**                                                                                                         |
|----------|--------|-------|
| statusCode | *String* | 200                                                                                                                     |
| body       | *String* | 后端处理的job ID，您可以使用返回的job ID获取后端工作流的状态，请参阅 [get_ssl_job](ssl-certificates/get-ssl-job.md) |

