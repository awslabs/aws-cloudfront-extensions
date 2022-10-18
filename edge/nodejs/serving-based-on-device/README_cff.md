# Serving Content Based on Device


The CloudFront Function is designed to redirect url based on device type, for example, mobile device will be forwarded to access content for mobile device, desktop device will be forwarded to access specific content.


## Description

The solution will serve content by users' device tpye, here's how it works:

1. The user sends viewer request to CloudFront.

2. CloudFront forwards below applicable headers to the origin based on User-Agent in the viewer request, CloudFront will set below headers to true or false, for example, if the request is from an iPhone, CloudFront will set CloudFront-Is-IOS-Viewer to true and other three headers to false.

```bash
CloudFront-Is-Desktop-Viewer
CloudFront-Is-Android-Viewer
CloudFront-Is-IOS-Viewer
```
3. CloudFront routes the request to the nearest AWS edge location. The CloudFront distribution will launch a CloudFront Function on viewer request event.

4. CloudFront Function rewrite the URI according to the headers, for example, it will redirect to iOS resources if the request is from an iPhone.




## Use Cases

The users can get the content more effcient by their device type with better experience, for example, mobile device could load low resolution video instead of origional high resolution in much faster manner due to smaller size of video file.



