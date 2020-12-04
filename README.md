# AWS CloudFront Extensions

It's a valueable collection when using CloudFront, which includes rich set of featured Lambda@Edge, CloudFormation template for deployment of various scenarios and full monitoring solution. We tried to provide out-of-box experiences, such as install featured Lambda@Edge to enhance capability of CloudFornt, setup distribution through prepared CloudFormation templates, build up observability by leveraging monitoring solution.



## CloudFront Quick Start

|        Name    | Version | Description      |
|----------------|---------|------------------|
| WAF + CloudFront | v0.1.0 |   Prepared templates to quickly launch distribution and pre-configured rules.   | 


## Lambda@Edge
|        Name    | Version | Description      |
|----------------|---------|------------------|
| Simple Lambda@Edge| [v0.1.0](edge/nodejs/simple-lambda-edge) | The sample template for NodeJs Lambda@Edge.|
| Athentication with Cognito| v0.1.0 | The Lambda@Edge invoke Cognito as athentication service.|
| Redirect based on USER-AGENT | v0.1.0 | The Lambda@Edge redirect viewer request to a specific URL based on USER-AGENT.|
| Rewrite URL based on USER-AGENT | v0.1.0 | The Lambda@Edge rewrite the URL of viewer request baseed on USER-AGENT.|
| Rewrite URL based on cookies | v0.1.0 | The Lambda@Edge rewrite the URL of viewer request baseed on cookies.|
| Rewrite URL based on geolication | v0.1.0 | The Lambda@Edge rewrite the URL of viewer request baseed on geolication.|
| Query string to headers | v0.1.0 | The Lambda@Edge converts the query string of viewer request into headers.|
| Standardize query string to optimize caching | v0.1.0 | If you configure CloudFront to cache based on query string parameters, this Lambda@Edge can improve caching through standardizing query string.|

## Observability






## Contribution

See [CONTRIBUTING](./CONTRIBUTING.md) for more information.

## License

This project is licensed under the Apache-2.0 License.