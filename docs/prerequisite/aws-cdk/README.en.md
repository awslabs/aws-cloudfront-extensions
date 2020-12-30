---
title: AWS CDK 
weight: 2
---

The AWS Cloud Development Kit (AWS CDK) is an open source software development framework to define your cloud application resources using familiar programming languages.

AWS CDK is not pre-installed in AWS CloudShell currently, so you will need to install it

Install the AWS CDK Toolkit globally using the following Node Package Manager command.

    npm install -g aws-cdk

You will need to add **sudo** in front of the command If you see below error

> Error: EACCES: permission denied, access '/usr/lib/node_modules'

    sudo npm install -g aws-cdk

Run the following command to verify correct installation and print the version number of the AWS CDK.

    cdk --version

