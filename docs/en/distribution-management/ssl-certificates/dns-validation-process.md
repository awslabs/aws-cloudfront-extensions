When you create certificates, you need to complete DNS validation process. This process requires you to add/update CNAME record in DNS provider, such as Route 53 and GoDaddy.

## Email
You will receive an email with information needed for DNS validation. The following is an example SNS notification:

```json

{ 
    'CNAME value need to add into DNS hostzone to finish DCV': "[{'Name': '_1317a5f539939083b712d51b6b1676e5.web1.ssl-for-saas.demo.solutions.aws.a2z.org.cn.', 'Type': 'CNAME', 'Value': '_de026e5dc988d65312fe83616ef24249.hnyhpvdqhv.acm-validations.aws.'}]", 'Sample Script (Python)': 'https://gist.github.com/yike5460/67c42ff4a0405c05e59737bd425a4806', 'Sample Script for Godaddy (Python)': 'https://gist.github.com/guming3d/56e2f0517aa47fc87289fd21ff97dcee'
}

```
If you do not know where the email was sent to, you can check it in CloudFormation stack that was deployed when you launch the solution. 

If you want to update the email, you need to update the email parameter in the CloudFormation stack. 

## Adding CNAMEs in Route53

1. Sign in to the AWS Management Console and access the [Route 53 console](https://console.aws.amazon.com/route53/).
2. In the navigation pane, choose **Hosted zones**.
3. If you already have a hosted zone for your domain, skip to step 5. If not, create a hosted zone first.

    - To route internet traffic to your resources, such as Amazon S3 buckets or Amazon EC2 instances, see [Creating a public hosted zone](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/CreatingHostedZone.html).
    - To route traffic in your VPC, see [Creating a private hosted zone](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/hosted-zone-private-creating.html).

4. On the **Hosted zones** page, choose the name of the hosted zone that you want to create records in.
5. Choose **Create record**.
6. Enter the name and value in Create record form with type CNAME.

## Adding CNAMEs in GoDaddy

1. Log in to [GoDaddy](https://www.godaddy.com/). 
2. In the **Domains** menu,* select **All Domains**.
3. Choose the domain that needs to update CNAME record.
4. Add a new CNAME record, enter the **Name** with the CNAME and the **Data** with the corresponding CloudFront distribution. You should be able to retrieve both values in the SNS message sent by solution.

![godaddy-cloudfront](../../../images/godaddy-cloudfront.png)

## Add CloudFront distribution

Once CloudFront distribution was created, the domain owner need to manually add the CloudFront distribution as a CNAME for the website domain, so that when the someone access the website, the DNS provider will redirect the access to CloudFront distribution. 






