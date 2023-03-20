您可以在源站服务器中通过读取True-Client-IP标头来获取客户端IP。

### 什么是客户端IP透传?

如果源站服务器需要获取客户端的IP地址，则可以使用此扩展。扩展会自动在请求中添加一个名为“True-Client-IP”的标头。此标头为客户端的真实IP地址。如果没有此标头，在默认情况下请求包含的是CloudFront服务器的IP地址。

### 客户端IP透传是如何工作的?

该解决方案部署了一个CloudFormation模板，该模板执行以下操作：

* 在所选CloudFront分配的行为上部署名为“true-client-ip”的CloudFront Functions。
* 创建名为“true-client-ip”的CloudFront源请求策略，并将此标头添加到允许的标头列表中。
* 将源请求策略添加到上述CloudFront分配。

!!! Important "注意"
   
      如果CloudFront分配已经有一个源请求策略，那么您需要手动将此标头添加到源请求策略中。


!!! Note "说明"
      
      您不是必须要将标头命名为True-Client-IP。您可以将名称更改为任何值（例如X-Real-IP）。CloudFront还会将X-Forwarded-For标头发送到您的源站，其中包含客户端的IP地址以及请求通过的HTTP代理或负载均衡器信息。

### CloudFront阶段
查看器请求

### 通过Web控制台部署（推荐）

1. 登录web控制台.
2. 在左侧栏中，选择**Extensions repository**。
3. 从**Extensions**列表中选择**true-client-ip**，然后单击右上角的**Deploy**。
4. 选择要部署此CloudFront扩展的**分配**。
5. 选择**缓存行为**，然后选择**下一步**。
6. 选择CloudFront阶段，然后选择**下一步**。
7. 查看参数并选择**部署**。

按照web控制台上的指导检查CloudFormation控制台上的部署状态。

