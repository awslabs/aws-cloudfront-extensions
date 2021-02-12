---
title: Understand CloudFront+ code structure 
weight: 3
---

You will see the following structure after `cd aws-cloudfront-extensions-main`
![Code Structure](/images/code-structure.png)

Here are the explanation for each folder
- **.github/workflows**: the workflow after a PR is created and managed by github actions
- **docs**: documents which are used for introducing the project and workshop
- **edge/nodejs**: lambda@Edge codes written in nodejs
- **edge/python**: lambda@Edge codes written in python
- **scripts**: shell scripts used in workflows
- **templates**: cdk scripts for deployment such as AWS WAF rules
- **website**: resources for holding a workshop

In this workshop, you will create a Lambda@Edge function in edge/nodejs folder
