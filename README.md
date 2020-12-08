# AWS CloudFront Extensions

[中文]() | [English]()


It's a valueable collection when using CloudFront, which includes rich set of featured Lambda@Edge, CloudFormation template for deployment of various scenarios and full monitoring solution. We tried to provide out-of-box experiences, such as install featured Lambda@Edge to enhance capability of CloudFornt, setup distribution through prepared CloudFormation templates, build up observability by leveraging monitoring solution.



## CloudFront Quick Start

|        **Name**    | **Description**      |
|------------------|--------------------|
| WAF + CloudFront | Prepared templates to quickly launch distribution and pre-configured rules.   | 



## Lambda@Edge

|        **Catelog** | **Description**      |
|------------------|--------------------|
|  [*Authentication*](docs/LambdaEdge.md#Authentication)  | Authenticating by Cognito or third-party native library, add security information into HTTP headers, etc. |
|   [*Validation*]()  |  Validating specific parameters from HTTP request, such as check request token through MD5, etc.             |
|   [*URL Rewrite*]() | All functions are related to rewrite URL in various ways.             |
|   [*URL Redirect*]() |  All functions are related to redirect URL in as many as possible way.              |
|   [*Override Request*]() | Access, modify and override HTTP request, or even change further behavior.            |
|   [*Override Response*]() | Generate, modify and override HTTP response for viewer request or origin request event.               |
|   [*Origin Selection*]() | Route to different origins based on information in the request, or even warm up from origin.               |
|   [*Personalize Content*]() | Personalize the content as per requirement, such as resize the pictures.              |



## Observability

|        *Name*    | *Description*      |
|------------------|--------------------|
| End-to-end monitoring | Centralized logs management solution and built-in dashboards on top of ElasticSearch, collecting file & real-time logs from CloudFront and related services.   | 





## Contribution

See [CONTRIBUTING](./CONTRIBUTING.md) for more information.

## License

This project is licensed under the Apache-2.0 License.
