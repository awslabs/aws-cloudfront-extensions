---
title: Check the function on sample website
weight: 2
---

There are 3 ways to check whether the function is working, choose one option that you prefered.

## Option 1 - simulate device in PC browser

1. Navigate to [CloudFormation console](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks).
2. Open **CFExtSampleWorkshop** stack (or the one you named during the CloudFormation installation).
3. Select the **Outputs** tab of the menu.
4. Open **DemoDefaultUrl** in PC browser, the web page should look like this. 
  ![Sample Default Page](/images/sample_default_page.png)

5. In PC browser, open **developer tool** (eg. by clicking **View > Developer > Developer Tools** in Chrome, **Tools > Browser Tools > Web Developer Tools** in Firefox).

6. Choose **Toggle device toolbar** to simulate a mobile device.
  ![Toggle Device Toolbar](/images/toggle_device.png)
  ![Fire Device Toolbar](/images/fire_device.png)

7. Choose an iPhone device in **Dimensions** and refresh the page. You will see a 2048 game which is for iPhone.
  ![iPhone Web Page](/images/iphone_game.png)

8. Choose an Android device in **Dimensions** and refresh the page. You will see another game which is for Android device.
  ![Android Web Page](/images/android_game.png)


## Option 2 - open from mobile phone

1. Navigate to [CloudFormation console](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks).
2. Open **CFExtSampleWorkshop** stack (or the one you named during the CloudFormation installation).
3. Select the **Outputs** tab of the menu.
4. Open **DemoDefaultUrl** in your mobile phone's browser.
5. If it is an iPhone, you will see a 2048 game.
  ![iPhone Browser](/images/iphone_game_browser.png)

6. If it is an Android phone, you will see another game.
  ![Android Browser](/images/android_game_browser.png)



## Option 3 - generate QR code and open from mobile phone

1. Navigate to [CloudFormation console](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks).
2. Open **CFExtSampleWorkshop** stack (or the one you named during the CloudFormation installation).
3. Select the **Outputs** tab of the menu.
4. Open **DemoDefaultUrl** in PC browser.
5. If your PC browser enabled QR code plugin, you will see a menu to **Create QR Code**, here's an example in Chrome on Mac computers.
  ![QR Code](/images/qrcode_browser.png)

6. Scan the QR code from your mobile phone.



{{% notice info %}}
The way to create QR code can be different according your PC browser, find more details about how to create QR code in your browser's help center.
{{% /notice %}}




## Summary

In this section, you deployed redirect-by-device extension on CloudFront Extensions console to implement the first functional requirement (R1 in below table).

| ID | Description  | Category                   | Status |
|----|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------|--------|
| **R1** | **It shows different web pages according to the user's browser type, for example, it redirects to page A when the user access it in PC browser, it redirects to page B when the user access it in Android browser, it redirects to page C when the user access it in iPhone browser.** | **Functional requirement**    |    **Completed**    |
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

