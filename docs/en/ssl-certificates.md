# SSL Certificates

You can use this solution to automatically create or import SSL Certificates and associate them to new CloudFront distributions. The solution provides two kinds of jobs: Create Certificates Job and Import Certificate Job. You can use then on UI or via API calls.

### Prerequisites

Before you create or import certificates, make sure you meet the [Prerequisites](https://docs.aws.amazon.com/acm/latest/userguide/import-certificate-prerequisites.html) listed by ACM. 

## Create Certificates Job

The solution will create one or multiple certificates in ACM and create the associated distributions in CloudFront. 

![create-certificate-job](../images/create-certificate-job.png)

### How does it work

When you start a Create Certificates Job, the solution starts a workflow in AWS Step Functions that does the following:

1. Create certificates in ACM: The solution will automatically create all ACM based on input. After all SSL Certificates were created, the solution will automatically sent SNS message to the designated email address or HTTP endpoint (depending on subscription). After this step, the domain owners are expected to complete DNS validation process. For more information, see *Instruction - DNS validation process with your DNS Provider*.

2. Check certificates status in ACM: The solution checks the progress of DNS validation status every 5 minutes. The DNS validation is a manual process, also known as Domain Control Validation. Domain owner needs to manually add a CNAME record for your domain name on the website of your DNS providers. ACM will check the DNS validation status every few minutes. Once done, ACM will issue certificates. 

3. Create new CloudFront distributions: Once all certificates were issued by ACM, the solution will automatically create CloudFront distributions. After all distributions were created, the solution will send an SNS message to the designated email address or HTTP endpoint. After this step, the domain owners are expected to add new CloudFront distribution to map to CNAME. For more information, see *Instruction - Adding CloudFront record for CNAME with your DNS Provider*.

![certificate-workflow](../images/certificate-workflow.png)

### Schedule a job for creating new certificates

1. Log in to the web console.
2. In the left sidebar, under **Configuration**, select **SSL Certification**. 
3. Choose **Request New Certificate**.
4. In the page that opens, click **Get Started**.
5. Enter a group of domain name list for a certificate. Click **Add domain names for another certificate** if you want to create another certificate. 
6. Choose **Automatically create distributions**, and select a snapshot of a distribution that you want to copy the config from. 
7. (Optional) Turn on switch if you’d like the solution to aggregate certificate. for example, if you have domain list *.example.com, 1xxx.example.com (http://1.example.com/), 2xxx.example.com. The certificate will only contain *.example.com (http://example.com/). *[Suggest to remove, it is difficult for users to understand the logic behind. ]*
8. Click **Add new tag** to add a Tag for the resource (certificate, CloudFront Distributions) that will be created.
9. Click **Start job**.

### View create certificate job status

You can view job status on the web console or using API calls.

Once the create job started, you will be redirected to a page where you can view the status of the job. For create certificate job, there are three steps in AWS Step functions workflow. After all steps are completed, the job will finished with success. If one of the steps failed, the job will fail. 

* Step1 will be completed once all certificates were created in ACM. It usually takes less than a minute. 
* Step2 will be completed once ACM had issued all expected certificates. ACM only issues the certificates if all DNS validation were done.
* Step3 will be completed once all expected distributions were created in CloudFront. 

After Step1, the domain owners are expected to complete DNS validation process. See more details in *Instruction - DNS validation process with your DNS Provider*.

After Step3, the domain owners are expected to add new CloudFront distribution to map to CNAME. See more details in *Instruction - Adding CloudFront record for CNAME with your DNS Provider*.

If the job failed, refer to [Clean up resources](clean-up-resources.md) to clean up the created ACM and CloudFront distributions if needed.


## Import Certificate Job

The solution will automatically import one or multiple your existing issued certificates in ACM and create associated distributions in CloudFront. 

![import-certificate-job](../images/import-certificate-job.png)

### How does it work

When you starts an Import Certificate Job, the solution starts a workflow in AWS Step Functions that does the following:

1. Import certificates in ACM: The solution will automatically import certificate records in ACM.
2. Create new CloudFront distributions: The solution will automatically create CloudFront distributions. After all distributions were created, the solution will send a SNS message to the designated email address or HTTP endpoint. 

![certificate-workflow1](../../images/certificate-workflow1.png)


### Schedule a job for importing existing certificates

!!! Important

    CloudFront Extension solution Version 2.0 only supports importing one certificate in a job.


1. Log in to the web console.
2. In the left sidebar, under **Configuration**, select **SSL Certification**. 
3. Choose **Import Existing Certificates**.
4. Choose **Import One Certificate**.
5. Enter Certificate name, Certificate body, Certificate Private Body, and Certificate chain.
6. (Optional) Choose *Automatically create distributions*, select a snapshot of a distribution that you want copy the config from. 
7. (Optional): Turn on switch if you’d like the solution to aggregate certificate. for example, if you have domain list *.example.com, 1xxx.example.com (http://1.example.com/), 2xxx.example.com. The certificate will only contain *.example.com (http://example.com/). [Suggest to remove, it is difficult for users to understand the logic behind. ]
8. Click **Add new tag** to add a Tag for the resource (certificate, CloudFront Distributions) that will be created.
9. Click **Start job**.

## View import certificate job status

Once the import job started, you will be redirected to a page where you can view the status of the job. For import certificate job, there are two steps in AWS Step Function workflow. After all steps are completed, the job will finished with success. If one of the steps failed, the job will fail. 

* Step1 will be completed once all certificates were created in ACM. It usually takes less than a minute.
* Step2 will be completed once all expected distributions were created in CloudFront.

After Step2, the domain owners are expected to add new CloudFront distribution to map to CNAME. See more details in *Instruction - Adding CloudFront record for CNAME with your DNS Provider*.

If the job failed, refer to [Clean up resources](clean-up-resources.md) to clean up the created ACM and CloudFront distributions if needed.

## List SSL certificates

!!! Important

    One CNAME could be mapped to multiple SSL Certificates. However, when creating CloudFront distributions, you cannot have two distributions map to one CNAME (the alternative domain name). 

To list SSL certificates on the web console, do the following:

1. Log in to the web console.
2. In the left sidebar, under **Configuration**, select **SSL Certification**. 
3. View the listed SSL certificates. 
4. (Optional) In the search box, you can search for SSL certificates by CNAME.

You can also get the SSL Certificate List via APIs. For more information, see *API Reference Guide*.


## Instruction - DNS validation process with your DNS Provider

When you create certificates, you need to complete DNS validation process. This process requires you to add/update CNAME record in DNS provider, such as Route 53 and GoDaddy.

If you do not know where the email was sent to, you can check it in CloudFormation stack that was deployed when you launch the solution. 

If you want to update the email, you need to update the email parameter in the CloudFormation stack. 



## Add CloudFront distribution

Once CloudFront distribution was created, the domain owner need to manually add the CloudFront distribution as a CNAME for the website domain, so that when the someone access the website, the DNS provider will redirect the access to CloudFront distribution. 

1. Log in to GoDaddy. 
2. In the *Domains* menu*,* select *All Domains*
3. Choose the domain that need to update CNAME record
4.  *Add* a new CNAME record, fill in the *Name* with the CNAME and the *Data* with the corresponding CloudFront distribution. You should be able to retrieve both values in the SNS message sent by solution.

## Instruction - Adding CloudFront record for CNAME with your DNS Provider

1. Log in to GoDaddy. 
Step2: In the *Domains* menu*,* select *All Domains*
Step3: Choose the domain that need to update CNAME record
Step4: *Add* a new CNAME record, fill in the *Name* with the CNAME and the *Data.* You should be able to retrieve both values in the SNS message sent by solution.


