---
title: 通过拉取请求贡献代码
weight: 1
---

## 拉取请求检查项
您可通过拉取请求实现新功能开发或bug修复。在您提交拉取请求前，请确保您已经按照如下内容操作过
- 阅读[贡献指南](https://github.com/awslabs/aws-cloudfront-extensions/blob/main/CONTRIBUTING.md)
- 阅读[Code of Conduct](https://aws.github.io/code-of-conduct)
- 编写单元测试用例，并且测试通过
- 您需要在代码中输出solution id. [示例](https://github.com/awslabs/aws-cloudfront-extensions/blob/main/edge/nodejs/modify-response-header/template.yaml#L55)，您只需要参考此示例并将SolutionId内容替换为您的内容，SolutionId会由仓库负责人提供


执行如下操作创建拉取请求：

## 复刻仓库
1. 进入[awslabs/aws-cloudfront-extensions](https://github.com/awslabs/aws-cloudfront-extensions)
2. 在右上角点击**Fork**
    ![Fork](/images/fork.png)
   
## 修改代码并测试
1. 克隆复刻仓库并修改代码
2. 根据您使用的语言执行 `npm test` 或 `pytest` 进行单元测试，并确保测试通过
   ![Unit Test](/images/unit_test.png)
3. 在yaml文件中输出solution id
   ![Output SolutionId](/images/output_sid.png)
4. 提交到复刻仓库

## 创建拉取请求
1. 进入[awslabs/aws-cloudfront-extensions](https://github.com/awslabs/aws-cloudfront-extensions) 
2. 选择 **New pull request**
    ![New PR](/images/new_pr.png)
3. 选择 **compare across forks**
4. 在"head fork"下拉框中，选择您的复刻，然后在"compare branch"下拉框中选择相应分支
   ![Across Forks](/images/across_forks.png)
5. 根据模版输入相应内容[拉取请求模版](https://github.com/awslabs/aws-cloudfront-extensions/blob/main/.github/pull_request_template.md)并创建拉取请求
   ![PR Example](/images/pr_example.png)
6. 添加一个标签，标签命名规则为<language>/<functionName>
   ![PR Label](/images/pr_label.png)
7. 等待您的拉取请求被审批通过


