---
title: Test the Lambda@Edge function 
weight: 5
---

In this step, you will test the Lambda@Edge function created in the last step 


## Test Lambda@Edge function 

To test Lambda@Edge function:
1. Open AWS Lambda Console in https://console.aws.amazon.com/lambda/home?region=us-east-1#/functions
2. Choose the function you have created, it would be similar to the following
   
   ![Lambda Function](/lambda_func.png)
   
3. Choose **Code** tab of the page, as shown in the following image, you will see the code which has been deployed by AWS Serverless Application Model(SAM)
   
   ![Lambda Code](/lambda_code.png)
   
4. Choose **Test** tab of the page, paste below event, it contains a test header 

         {
            "Records": [
               {
                  "cf": {
                     "response": {
                        "status": "200",
                        "headers": {
                           "test-header": [
                              {
                                 "key": "testHeader",
                                 "value": "testValue"
                              }
                           ]
                        }
                     }
                  }
               }
            ]
         }

   
5. Choose **Invoke** at the top right to trigger the function with the test event 
    
    ![Test Event](/test_event.png)

6. You will see the new header has been added into the response headers

   ![Test Result](/test_result.png)

