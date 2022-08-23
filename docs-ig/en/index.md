CloudFront Extensions is an out-of-box solution for advanced Amazon CloudFront users to manage dozens of CloudFront distributions regularly. The solution provides a set of management and automation functions and helps customers to improve the overall operational efficiency when using Amazon Edge products.

The solution has the following major features:

- **Monitoring**: You can monitor CloudFront traffic such as cache hit ratio, bandwidth, and status code on the web console dashboard or retrieve them via API calls.

- **Distribution management**: You can save one specific CloudFront distribution configuration as a snapshot, compare different snapshots and apply a snapshot to other distributions; audit all CloudFront distribution changes which will be saved automatically; automate the process from requesting new certificate or importing existing SSL certificates to CloudFront distributions.

- **Extension repository**: You can deploy commonly used out-of-box extensions such as Lambda@Edge functions, CloudFront functions, and CloudFormation templates through friendly user interface. You can use these extensions without any programming, and customize them to fit your specific needs.

After deploying the solution, you can perform tasks on a web console or use the functions via APIs. For more information, see *API Reference Guide*.

This implementation guide describes architectural considerations and configuration steps for deploying CloudFront Extensions in the AWS Cloud. It includes links to an AWS [CloudFormation][cloudformation] template that launches and configures the services required to deploy this solution using AWS best practices for security and availability.

The guide is intended for IT architects, and developers who have practical experience architecting in the AWS Cloud.

[cloudformation]: https://aws.amazon.com/en/cloudformation/

