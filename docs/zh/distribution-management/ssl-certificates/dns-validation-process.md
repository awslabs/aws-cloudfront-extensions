创建证书时，需要完成DNS验证过程。此过程要求您在DNS服务（如Route 53和GoDaddy）中添加/更新CNAME记录。

## 电子邮件

您将收到一封电子邮件，其中包含DNS验证所需的信息。以下是SNS通知的示例：

```
CNAME value need to add into DNS hostzone to finish DCV: [{'Name': '_1317a5f539939083b712d51b6b1676e5.web1.ssl-for-saas.demo.solutions.aws.a2z.org.cn.', 'Type': 'CNAME', 'Value': '_de026e5dc988d65312fe83616ef24249.hnyhpvdqhv.acm-validations.aws.'}]
```

如果您不知道电子邮件发送到哪里，您可以在部署本解决方案的CloudFormation堆栈中找到它。

如果要更新接受邮件通知的邮箱，您需要更新CloudFormation堆栈中的Email参数。

## 在Route53中添加用于DCV验证的CNAME记录

### 通过Route53 Console添加DCV验证

1. 登录AWS控制台并访问[Route 53控制台](https://console.aws.amazon.com/route53/).
2. 在导航窗格中，选择**托管区域**。
3. 如果您的域名已经有托管区域，请跳到步骤5。如果没有，请先创建托管区域。
   - 要将互联网流量路由到您的资源，如Amazon S3存储桶或Amazon EC2实例，请参阅[创建公共托管区域](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/CreatingHostedZone.html)。
   - 要在VPC中路由流量，请参阅[创建专用托管区域](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/hosted-zone-private-creating.html)。

4. 在**托管区域**页面上，选择要在其中创建记录的托管区域的名称。
5. 选择**创建记录**。
6. 在类型为CNAME的创建记录表单中输入名称和值。

### 通过脚本添加DCV验证

1. 准备python环境: [安装python3](https://www.python.org/downloads/)。
2. 在Route53/YOUR_DOMAIN_NAME/Hosted zone details tab下找出hosted zone ID。
3. 复制以下脚本的内容 ，然后保存到 `route53Cert.py`。 打开python脚本，并根据收到的email中的信息更新脚本参数, 可以参考下面的例子:

   ```python
     
   import boto3
   
   route53 = boto3.client('route53')
   def add_cname_record(cnameName, cnameValue, hostedZoneId):
       response = route53.change_resource_record_sets(
           ChangeBatch={
               'Changes': [
                   {
                       'Action': 'CREATE',
                       'ResourceRecordSet': {
                           'Name': cnameName,
                           'ResourceRecords': [
                               {
                                   'Value': cnameValue,
                               },
                           ],
                           'SetIdentifier': 'SaaS For SSL',
                           'TTL': 300,
                           'Type': 'CNAME',
                           'Weight': 100,
                       },
                   }
               ],
               'Comment': 'add cname record for certificate',
           },
           HostedZoneId=hostedZoneId,
       )
   
   if __name__ == '__main__':
       # paste your data as the cnameList value
       cnameList = [{'Name': '_1317a5f539939083b712d51b6b1676e5.web1.ssl-for-saas.demo.solutions.aws.a2z.org.cn.', 'Type': 'CNAME', 'Value': '_de026e5dc988d65312fe83616ef24249.hnyhpvdqhv.acm-validations.aws.'}]
       for i, val in enumerate(cnameList):
            # change your host zone id
           add_cname_record(val['Name'], val['Value'], '<Your Hosted Zone ID>')
   ```
   
4. 安装python脚本所需要的相关依赖，可以参考[这里](https://boto3.amazonaws.com/v1/documentation/api/latest/guide/quickstart.html)。
5. 在terminal中运行命令 `python route53Cert.py`，没有任何错误信息后，脚本成功运行。

## 在GoDaddy中添加用于DCV验证的CNAME记录

### 通过GoDaddy Console添加DCV验证

1. 登录[GoDaddy](https://www.godaddy.com/).
2. 在**域**菜单中，选择**所有域**。
3. 选择需要更新CNAME记录的域。
4. 添加新的CNAME记录，输入带有CNAME的**名称**，以及带有相应CloudFront分配的**数据**。您能够在解决方案发送的SNS消息中找到这两个值。


![godaddy-cloudfront](../../../images/godaddy-cloudfront.png)


### 通过脚本添加DCV验证

1. 准备python环境: [安装python3](https://www.python.org/downloads/)。
2. 从[goDaddy Console](https://developer.godaddy.com/keys) 找出api Key 和 Secret。
3. 复制以下脚本的内容，然后保存到 `goDaddyCert.py`。更新`godaddyCert.py`中的api key、secret、cname部分，示例如下:

```python
   #!/usr/bin/env python
   from godaddypy import Client, Account
   
   # Remember to set your api key and secret
   userAccount = Account(api_key='your_api_key', api_secret='your_api_secret')
   userClient = Client(userAccount)
   
   # E.g.: to update your_record.yourdomain.com set domain and record to:
   domain = 'your_domain'
   
   def add_cname_record(cnameName, cnameValue, domain):
       updateResult = userClient.add_record(domain=domain, record={'data': cnameValue, 'name':cnameName,'ttl':3600, 'type':'CNAME'})
       print(str(updateResult))
   
   
   if __name__ == '__main__':
      # paste your data as the cnameList value
       cnameList = [{'Name': '_1317a5f539939083b712d51b6b1676e5.web1.ssl-for-saas.demo.solutions.aws.a2z.org.cn.', 'Type': 'CNAME', 'Value': '_de026e5dc988d65312fe83616ef24249.hnyhpvdqhv.acm-validations.aws.'}]
       for i, val in enumerate(cnameList):
           add_cname_record(val['Name'], val['Value'], domain)
```

4. 安装python脚本所需要的相关依赖，可以参考[这里](https://pypi.org/project/GoDaddyPy/)。
6. 在terminal中运行命令 `python goDaddyCert.py`，没有任何错误信息后，脚本成功运行。


