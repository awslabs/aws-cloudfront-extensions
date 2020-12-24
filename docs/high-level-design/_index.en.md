---
title: High level design 
weight: 20
---

The code of CloudFront+ project is placed in GitHub Repository. For customers, this is a place where they can find useful CloudFront related code/solutions. For contributors such as SAs,builders,Partners, this is a framework where they can make CloudFront related contribution. The repo consists of three major parts: 1) Lambda@Edge scripts, 2) CloudFront Solution Quick Start 3) CloudFront Observability Module.

![High Level Design](/high-level-arch.png)

## 4.1 Lambda@Edge Scripts
CloudFront+ repository will contain 30+ Lambda@Edge scripts for common CloudFront use case, such as Redirect, Rewrite, Pre-warm, etc. These scripts are production quality-level implementation and can be directly deployed via Serverless Application Repository.
Contributors are welcomed to commit their Lambda@Edge code. There is an automated pipeline to validate their codes. If the code passed the validation, the pipeline will automatically release their code and publish to Serverless Application Repository.
Anyone could also track down the public roadmap and influence the roadmap through GitHub issue mechanism.

## 4.2 CloudFront Solution Quick Start
The CloudFront+ also include a few Solution Templates for common CloudFront user scenarios, such as CloudFront with Security Automation, CloudFront with Automated WAF, etc. With just one-click, customers can launch these solutions in their AWS console.
These solutions help customer save effort to setup environments, for example, the customers could deploy CloudFront, Shield and WAF together with prepared configuration and rules, to eliminate most tedious configuration.
Since the solution template is open sourced, customers can also customize those packages to fit their own specific need.

Contributor are welcomed to commit new solution template. There is an automated pipeline to validate their codes. If the code passed the validation, the pipeline will automatically release the solution and publish to Solution Repository S3 Bucket.

## 4.3 CloudFront Observability
CloudFront Observability module contain a set of solutions for Cloud monitoring in order to enhance the overall CloudFront observability. The end-to-end solution offers a built-in dashboard which reflects golden metrics and centralized logging management. The customers could simply integrate the unified logging source with their existing monitoring system, such as Prometheus, Splunk, etc. to consume those logs straightaway.