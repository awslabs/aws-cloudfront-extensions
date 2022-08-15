创建证书时，需要完成DNS验证过程。此过程要求您在DNS服务（如Route 53和GoDaddy）中添加/更新CNAME记录。

## 电子邮件

您将收到一封电子邮件，其中包含DNS验证所需的信息。以下是SNS通知的示例：

```json

{ 
    'CNAME value need to add into DNS hostzone to finish DCV': "[{'Name': '_1317a5f539939083b712d51b6b1676e5.web1.ssl-for-saas.demo.solutions.aws.a2z.org.cn.', 'Type': 'CNAME', 'Value': '_de026e5dc988d65312fe83616ef24249.hnyhpvdqhv.acm-validations.aws.'}]", 'Sample Script (Python)': 'https://gist.github.com/yike5460/67c42ff4a0405c05e59737bd425a4806', 'Sample Script for Godaddy (Python)': 'https://gist.github.com/guming3d/56e2f0517aa47fc87289fd21ff97dcee'
}

```
如果您不知道电子邮件发送到哪里，您可以在部署本解决方案的CloudFormation堆栈中找到它。

如果要更新接受邮件通知的邮箱，您需要更新CloudFormation堆栈中的Email参数。

## 在Route53中添加用于DCV验证的CNAME记录

1. 登录AWS控制台并访问[Route 53控制台](https://console.aws.amazon.com/route53/).
2. 在导航窗格中，选择**托管区域**。
3. 如果您的域名已经有托管区域，请跳到步骤5。如果没有，请先创建托管区域。
   - 要将互联网流量路由到您的资源，如Amazon S3存储桶或Amazon EC2实例，请参阅[创建公共托管区域](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/CreatingHostedZone.html).
   - 要在VPC中路由流量，请参阅[创建专用托管区域](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/hosted-zone-private-creating.html).


4. 在**托管区域**页面上，选择要在其中创建记录的托管区域的名称。
5. 选择**创建记录**。
6. 在类型为CNAME的创建记录表单中输入名称和值。


## 在GoDaddy中添加用于DCV验证的CNAME记录


1. 登录[GoDaddy](https://www.godaddy.com/).
2. 在**域**菜单中，选择**所有域**。
3. 选择需要更新CNAME记录的域。
4. 添加新的CNAME记录，输入带有CNAME的**名称**，以及带有相应CloudFront分配的**数据**。您能够在解决方案发送的SNS消息中找到这两个值。


![godaddy-cloudfront](../../../images/godaddy-cloudfront.png)


