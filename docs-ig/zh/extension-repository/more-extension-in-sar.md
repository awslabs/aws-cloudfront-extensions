对于Lambda@Edge功能，您还可以通过在Amazon SAR中搜索关键字aws-cloudfront-extensions来查找和部署它们。


## 在SAR中部署Lambda@Edge

1. 在控制台中打开[Amazon Serverless Application Repository页面](https://serverlessrepo.aws.amazon.com/applications)。
2. 勾选**显示用于创建自定义 IAM 角色或资源策略的应用程序**。
3. 搜索**aws-cloudfront-extensions**，将显示所有扩展，选择一个应用程序（例如，serving-based-on-device）并单击**部署**。
4. 在应用详情页面，勾选**我确认此应用程序将创建自定义 IAM 角色和资源策略**。
5. 选择**部署**。部署完成后会重定向到Lambda应用页面，您可以将其部署到Lambda@Edge。

请参考[部署解决方案](../deployment.md#lambdaedge)获取更多信息。





