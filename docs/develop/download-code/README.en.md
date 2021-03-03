---
title: Upload CloudFront Extensions code into CloudShell 
weight: 2
---

To download CloudFront Extensions code and upload it onto CloudShell
> Skip this step if you already have the codes in CloudShell
1. Go to [CloudFront Extensions code](https://github.com/awslabs/aws-cloudfront-extensions)
2. Choose **Download ZIP**
   ![Github Download ZIP](/images/gh-download.png)
3. Upload the zip package onto CloudShell
   ![CloudShell Upload](/images/cs-upload.png)
4. Unzip the package into home folder
                   
       unzip aws-cloudfront-extensions-main.zip
   {{% notice note %}}
   You can also clone the codes by SSH or Https.
   {{% /notice %}} 
   > For SSH, you will need to setup the ssh key in your github account by following this [doc](https://docs.github.com/en/free-pro-team@latest/github/authenticating-to-github/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent)
   
   > For Https, you will need to enter the username and password. If you have enabled two-factor authentication(2FA), a [personal access key](https://docs.github.com/en/free-pro-team@latest/github/authenticating-to-github/creating-a-personal-access-token) is needed to download the codes
   

