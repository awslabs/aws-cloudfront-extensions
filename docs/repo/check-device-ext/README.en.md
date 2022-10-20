---
title: Check the function on sample website
weight: 2
---


1. Navigate to [CloudFormation console](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks).
2. Open **CFExtSampleWorkshop** stack (or the one you named during the CloudFormation installation).
3. Select the **Outputs** tab of the menu.
4. Open **DemoDefaultUrl**, the web page should look like this. 
  ![Sample Default Page](/images/sample_default_page.png)

5. In the browser, open **developer tool** (eg. by clicking **View > Developer > Developer Tools** in Chrome, **Tools > Browser Tools > Web Developer Tools** in Firefox).

6. Choose **Toggle device toolbar** to simulate a mobile device.
  ![Toggle Device Toolbar](/images/toggle_device.png)

7. Choose an iPhone device in **Dimensions** and refresh the page. You will see a 2048 game which is for iPhone.
  ![iPhone Web Page](/images/iphone_game.png)

8. Choose an Android device in **Dimensions** and refresh the page. You will see another game which is for Android device.
  ![Android Web Page](/images/android_game.png)
 

## Summary

In this section, you deployed redirect-by-device extension on CloudFront Extensions console to implement the first functional requirement (R1 in below table).

| ID | Description  | Category                   | Status |
|----|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------|--------|
| R1 | It shows different web pages according to the user's browser type, for example, it redirects to page A when the user access it in PC browser, it redirects to page B when the user access it in Android browser, it redirects to page C when the user access it in iPhone browser. | Functional requirement     |    <i class="fa-solid fa-check"></i>    |
| R2 | The configuration of CloudFront distribution need to be saved, so that it can rollback if it has issues in production environment.                                         | Non-functional requirement     |        |
| R3 |      The website needs to have a CName (alternative domain name such as www.amazon.com) instead of xxx.cloudfront.net.                                                                                                                                          | Functional requirement |        |
| R4 | After the website is launched, you need to monitor the metrics such as request number, back-to-origin bandwidth, top url.           | Non-functional requirement |        |

This is the sample workshop's architecture before deploying redirect-by-device extension:
![Before Arch](/images/sample_arch.png)

This is the architecture after deploying the extension:
![After Arch](/images/sample_arch_after.png)

Extension redirect-by-device deployed a CloudFront Function in viewer-request stage and an origin request policy in CloudFront distribution. It will redirect url based on device type.


{{% notice tip %}}
The CloudFront Function can be viewed in Functions page of CloudFront console, you can also customize its code.
{{% /notice %}}

