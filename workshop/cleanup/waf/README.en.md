---
title: WAF & Shield Automations
weight: 10
---

To clean the WAF & Shield Automations 
1. Go to the [CloudFormation console](https://console.aws.amazon.com/cloudformation)
2. Open `AwsCloudfrontWafStack` stack and in the 'Outputs' tab page, find `AwsCloudfrontWafStack` and `WAFWorkshopSampleWebApp` outputs and save the values in a text editor.
![CLEANUP_TEMPLATES](/images/cleanup_waflog_s3.png?width=50pc)
2. Delete 'AwsCloudfrontWafStack' and 'WAFWorkshopSampleWebApp' stacks as below
![CLEANUP_TEMPLATES](/images/cleanup_templates.png?width=50pc)
1. Empty and delete the AWS WAF and AWS CloudFront log buckets in the AWS S3 console.
|AppAccessLogBucketName|WafLogBucketName|
|---|---|
|default name is aws-access-log-bucket-cloudfront|prefix with awscloudfrontwafstack-waflogbucket|