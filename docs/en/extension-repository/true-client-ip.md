You can get the client IP by reading the True-Client-IP header in your origin server.

### What is True Client IP Extension?
If your origin server needs to get the client’s IP address, you can use this extension. The extension automatically adds an HTTP header named “True-Client-IP” in your request. With this header, the request can contain the IP address of the client that sent the request. Without this header, the request by default contains the IP address of the CloudFront server that sent the request to your origin.

### How does it work?

The solution deploys a CloudFormation template that does the following:

* Install a CloudFront Function named “true-client-ip” on your selected CloudFront distribution’s behaviors. 
* Create a CloudFront origin request policy named “true-client-ip” that add this header to the allowed header list.
* Attach the policy to the above distribution. 

!!! Important "Important"
   
      If the CloudFront distribution already has an AWS built-in policy attached, you need to manually add the created policy to the attachment.



!!! Note "Note"
      
      You don't have to use the header name True-Client-IP. You can change the name to any value that your origin requires (e.g. X-Real-IP).

      CloudFront also sends an X-Forwarded-For header to your origin, which contains the client's IP address along with any HTTP proxies or load balancers that the request passed through.

### CloudFront Stage
Viewer request

### Deployment on the web console (Recommended)

1. Log in to the web console.
2. In the left sidebar, select **Extensions repository**.
3. Select **true-client-ip** from the **Extensions** list, and click **Deploy** in the upper right corner.
4. Choose a **Distribution** where you want to deploy this CloudFront extension. 
5. Choose a **Behavior**, and choose **Next**.
6. Choose a CloudFront stage, and choose **Next**.
7. Review the parameters and choose **Deploy**.

Follow the guidance on the web console to check deployment status on CloudFormation console.
































  



