To uninstall the CloudFront Extensions solution, you must delete the Amazon CloudFormation stack. 

You can use either the Amazon Management Console or the Amazon Command Line Interface (Amazon CLI) to delete the CloudFormation stack.

## Uninstall the stack using the Amazon Management Console

1. Sign in to the [Amazon CloudFormation][cloudformation-console] console.
1. Select this solution’s installation parent stack.
1. Choose **Delete**.

## Uninstall the stack using Amazon Command Line Interface

Determine whether the Amazon Command Line Interface (Amazon CLI) is available in your environment. For installation instructions, refer to [What Is the Amazon Command Line Interface][aws-cli] in the *Amazon CLI User Guide*. After confirming that the Amazon CLI is available, run the following command.

```bash
aws cloudformation delete-stack --stack-name <installation-stack-name> --region <aws-region>
```


[cloudformation-console]: https://console.aws.amazon.com/cloudformation/home
[aws-cli]: https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-welcome.html
