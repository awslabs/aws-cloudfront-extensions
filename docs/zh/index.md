CloudFront Extensions是一个方便Amazon CloudFront用户管理CloudFront分配的一键部署的解决方案。本解决方案提供了一套管理和自动化功能，帮助客户在使用Amazon Edge产品时提高整体运营效率。

本解决方案具有以下主要功能：

- **监控**：您可以通过web控制台的仪表板监控CloudFront流量，如缓存命中率、带宽和状态代码，您也可以调用API获取这些指标。

- **分配管理**：您可以将指定的CloudFront分配的配置保存为快照、比较不同的快照、并将快照应用于其他分配；审核所有CloudFront分配的配置更改；自动化实现请求新证书或将现有SSL证书导入ACM并配置CloudFront分配的过程。

- **扩展仓库**：您可以部署常用的开箱即用CloudFront扩展程序，例如Lambda@Edge、CloudFront Functions和CloudFormation模板。您可以在不进行任何编程的情况下使用这些扩展，并自定义它们以满足您的特定需求。

部署解决方案后，您可以在web控制台上执行任务，也可以通过API使用这些功能。有关更多信息，请参阅*API参考指南*。

本实施指南描述了CloudFront扩展的架构和配置步骤。它包括指向AWS [CloudFormation][cloudformation]模板的链接，该模板遵循了AWS安全性和可用性的最佳实践，并包含了部署此解决方案所需的服务。

本指南面向具有AWS架构经验的IT架构师和开发人员。

[cloudformation]: https://aws.amazon.com/en/cloudformation/

