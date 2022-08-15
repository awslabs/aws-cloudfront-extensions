If a create job or an import job failed, you may want to clean up the SSL Certificates and CloudFront Distributions created by the job.

## Clean up certificates in AWS Certificate Manager
1. On the **Job Status** page, choose **View SSL certificates created in this job**. You will be redirected to certificate list, where shows all the certificates created in this job.
2. Click a specific certificate. You will be redirected to ACM web console.
3. Delete the certificate.
4. For all other certificates found in Step 1, delete them in ACM.
5. Repeat Step 1 to check whether all certificates in this job were cleaned up.


## Clean up distributions in CloudFront

1. On the **Job Status** page, choose **View distributions created in this job**. You will be redirected to distribution list, where shows all the distributions created in this job.
2. Click a specific distribution.
3. Delete the distribution.
4. For all other distributions found in Step 1, delete them in CloudFront console.
5. Repeat Step 1 to check whether all distributions in this job were cleaned up.


