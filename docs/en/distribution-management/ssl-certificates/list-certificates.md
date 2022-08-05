On the web console, you can search for the SSL certificates by CNAMEs. In the backend of the solution, it calls the ACM API to list all current certificates you have in this AWS account. 

!!! Important "Important"

    One CNAME could be mapped to multiple SSL Certificates. However, when creating CloudFront distributions, you cannot have two distributions map to one CNAME (the alternative domain name). 

To list SSL certificates on the web console, do the following:

1. Log in to the web console.
2. In the left sidebar, under **Configuration**, select **SSL Certification**. 
3. View the listed SSL certificates. 

[//]: # (4. &#40;Optional&#41; In the search box, you can search for SSL certificates by CNAME.)

You can also get the SSL Certificate List via APIs. For more information, see *API Reference Guide*.
