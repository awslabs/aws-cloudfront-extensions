要卸载CloudFront Extensions解决方案，请删除CloudFormation堆栈。

您可以使用亚马逊云科技管理控制台或CLI删除CloudFormation堆栈。

## 使用亚马逊云科技管理控制台删除堆栈

1. 登录[Amazon CloudFormation][cloudformation-console]控制台。
2. 选择此解决方案的安装堆栈。
3. 点击**删除**按钮。

## 使用CLI删除堆栈

1. 确定命令行在您的环境中是否可用。有关安装说明，请参阅CLI用户指南中的[CLI是什么][aws-cli]。
2. 运行如下命令。

```bash
aws cloudformation delete-stack --stack-name <installation-stack-name> --region <aws-region>
```

[cloudformation-console]: https://console.aws.amazon.com/cloudformation/home
[aws-cli]: https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-welcome.html