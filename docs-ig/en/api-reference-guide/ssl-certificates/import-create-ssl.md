## import-create-ssl

!!! Important "Important"
    You are not recommended to include more than 100 cname or pems records in one request. Too many requesting items in one request will cause backend ACM service and Cloudfront service throttle our request and cause the backend workflow failure.

- HTTP request method: `POST`

- Request

  - Create one ACM certificate and auto create CloudFront distribution from existing distribution id and version id
    
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

  - Create one ACM certificate and auto create CloudFront distribution from existing distribution id
    
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

  - Create two ACM certificates and auto create CloudFront distribution from existing distribution id 
    
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

  - Import one ACM certificate and auto create CloudFront distribution from existing distribution id
    
``` json
    {
        "acm_op": "import",
        "auto_creation": "true",
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

  - Import two ACM certificates and auto create CloudFront distribution from existing distribution id
    
``` json
    {
        "acm_op": "import",
        "auto_creation": "true",
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

- Response

``` json
{
  "statusCode": 200,
  "body": "21b370eb-6c6f-4f2a-8a84-e3cbfdc00318"
}
```

- Response parameters

| **Name**   | **Type** | **Description**                                                                                                         |
|------------|----------|-------------------------------------------------------------------------------------------------------------------------|
| statusCode | *String* | 200                                                                                                                     |
| body       | *String* | jobId of the backend processing, you can use returned jobId to get current status of backend workflow, please refer to [get_ssl_job](get-ssl-job.md) |

