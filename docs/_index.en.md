---
title: CloudFront Extensions workshop 
chapter: true
---

# Amazon CloudFront Extensions 

## Introduction

Amazon CloudFront is a content delivery network (CDN) service built for high performance, security, and developer convenience. Amazon CloudFront Extensions is an out-of-box solution for advanced Amazon CloudFront users to manage dozens of CloudFront distributions regularly. The solution provides a set of management and automation functions and helps customers to improve the overall operational efficiency when using Amazon Edge products.


## About the workshop

- This workshop is targeted to builders (e.g. software development engineers, solutions architects, devops engineers, cloud engineers etc.)
- AWS Region used in this workshop: **us-east-1**
- Expected completion time: 2 hours


## Scenario

You are a solutions architect, and your objective is to build a website which is delivered by CloudFront. The website needs to meet below requirements:

| ID | Description                                                                                                                                                                                                                                                                        | Category                   |
|----|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------|
| R1 | It shows different web pages according to the user's browser type, for example, it redirects to page A when the user access it in PC browser, it redirects to page B when the user access it in Android browser, it redirects to page C when the user access it in iPhone browser. | Functional requirement     |
| R2 | The configuration of CloudFront distribution need to be saved, so that it can rollback if it has issues in production environment.                                                                                                                                                 | Non-functional requirement |
| R3 | The website needs to have a CName (alternative domain name such as www.amazon.com) instead of xxx.cloudfront.net.                                                                                                                                                                  | Functional requirement     |
| R4 | After the website is launched, you need to monitor the metrics such as request number, back-to-origin bandwidth, top url.                                                                                                                                                          | Non-functional requirement |



### What you will learn
- How to implement customized function by deploying an extension on Amazon CloudFront Extensions console.
- How to save and apply the configuration of a CloudFront distribution on Amazon CloudFront Extensions console.
- How to create SSL certificates on Amazon CloudFront Extensions console.
- How to monitor CloudFront distribution metrics on Amazon CloudFront Extensions console.

### What you will do during this workshop
- Deploy Amazon CloudFront Extensions solution and a sample website in your AWS account (using CloudFormation).
- Use Amazon CloudFront Extensions console to fulfill above functional requirements and non-functional requirements.

### CloudFront Extensions architecture design

![CloudFrontExt Arch](./images/arch.png)
