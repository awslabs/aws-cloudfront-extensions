## 什么是根据地理位置跳转?
如果您需要根据用户所在国家/地区将其重定向到特定国家/地区的网站，则可以通过部署此扩展实现此功能。例如，如果用户位于德国，CloudFront Function会修改请求中的URL，并将用户重定向到/de/index.html页面，这是该网站的德国版本。此函数用于构建整个URL(https://host/de/index.html)重定向。

## 根据地理位置跳转是如何工作的?

此扩展使用[Cloudfront-Viewer-Country geo-location标头](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-cloudfront-headers.html#cloudfront-headers-viewer-location)，根据请求进行查找以确定用户所在的国家，并将该值包含在Cloudfront-Viewer-Country请求标头中。

若要将地理位置标头显示在请求中，必须在[CloudFront 源请求策略](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/controlling-origin-requests.html#origin-request-understand-origin-request-policy)或[缓存策略](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/controlling-the-cache-key.html#cache-key-understand-cache-policy)中添加此标头。


该解决方案部署了一个CloudFormation模板，该模板执行以下操作：

* 在所选CloudFront分配的行为上部署名为“redirect-by-country”的CloudFront Functions。
* 创建名为“redirect-by-country”的自定义源请求策略，将“cloudfront-viewer-country”标头添加到允许的标头列表中。
* 将“redirect-by-country”源请求策略添加到CloudFront分配的缓存行为中。

!!! Important "注意"
      
      如果CloudFront分配已经有一个源请求策略，那么您需要手动将此标头添加到源请求策略中。 

## CloudFront阶段
查看器请求

## 通过Web控制台部署（推荐）

从Web控制台中部署扩展的步骤类似。有关更多信息，请参阅[True Client IP](true-client-ip.md).


