---
title: WAF 动手实验 
weight: 10
---

Lab Guide

---
目录
- [Lab – WAF动手实验](#Lab) 

- [设置准备](#Step1)

部署样本网页应用

- [任务 - WAF的核心概念](#Step2) 

A部分
A部分答案
B部分
B部分答案
结论

- [介绍 - WAF定制规则](#Step3)

请求采样
Web ACL容量单元 (Capacity Units)
测试用例
答案
例子
挑战任务
测试用例
结论
挑战任务

- [日志](#Step4)

日志的可视化及分析
挑战任务
S3 桶


### Lab – WAF动手实验<span id = "Lab"></span>
#### 介绍

现在让我们来动手做一下WAF的实验
本实验中，我们将介绍 WAF的核心概念 (WAFV2)。

什么是亚马逊云科技WAF?
 
亚马逊云科技WAF是一个网页应用的防火墙服务。它能帮助保护您的网页应用或网页API应对常见的网页攻击。这些攻击会影响应用的可用性，产生安全风险，或消耗过量的计算资源。
使用WAF是对网页应用增加深度防御的好办法。WAF可以帮助应对类似SQL注入、CSS和其他常见的漏洞攻击。WAF允许您创建自己的定制规则在HTTP请求到达应用之前决定是阻断还是允许该请求。


#### 设置准备<span id = "Step1"></span>

本次实验需要一个AWS Account。

 如您使用Mac 或 Linux OS

    AWS CLI 不是必须的工具 ,但可能会加快您的配置进度
        AWS CLI会在后续的定制规则部署操作上节约时间。
        确保AWS CLI 更新到了最新的版本。

如您使用Windows OS

本次实验使用curl来创建和发送HTTP请求。这些请求是用来测试WAF规则的。curl在Windows Subsystem for Linux (简称WSL)上可以使用。

如果你不确定，建议您使用AWS Cloud9 dev environment 来完成这个实验。Cloud9环境包含所有所需工具。Cloud9的默认设置就可以满足本次实验的要求。

果汁店(The Juice Shop)

亚马逊云科技WAF被用来关联到这个网站和其他的亚马逊云科技资源: 如CloudFront发布点，应用负载均衡器，或者网页应用关联的API网关。

为了测试您的WAF,您需要一个应用！

在我们的实验中，您会使用OWAP果汁店(OWASP Juice Shop) 这个应用。果汁店是一个有意地弱化了安全的开源网页应用。

搞定OWASP果汁店(Pwning OWASP Juice Shop)这本免费书籍，详细解释了这个应用以及应用的弱点。

#### 部署样本网页应用<span id = "Step2"></span>

选择一个区域来部署样本的网页应用，选择下面表中最合适的区域，点击对应的连接。
这个CloudFormation堆栈需要大约5分钟部署完毕

区域|    启动模板
:---|:---
US East (N. Virginia) (us-east-1)|[![alt text](/images/lab03/image001.png "Deploy")](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=WAFWorkshopSampleWebApp&templateURL=https%3a%2f%2faws-waf-workshop-v2-us-east-1.s3.us-east-1.amazonaws.com%2faws-waf-v2-workshop%2flatest%2fmain.template)
US East (Ohio) (us-east-2)|[![alt text](/images/lab03/image001.png "Deploy")](https://console.aws.amazon.com/cloudformation/home?region=us-east-2#/stacks/new?stackName=WAFWorkshopSampleWebApp&templateURL=https%3a%2f%2faws-waf-workshop-v2-us-east-2.s3.us-east-2.amazonaws.com%2faws-waf-v2-workshop%2flatest%2fmain.template)
US West(Oregon) (us-west-2)|[![alt text](/images/lab03/image001.png "Deploy")](https://console.aws.amazon.com/cloudformation/home?region=us-west-2#/stacks/new?stackName=WAFWorkshopSampleWebApp&templateURL=https%3a%2f%2faws-waf-workshop-v2-us-west-2.s3.us-west-2.amazonaws.com%2faws-waf-v2-workshop%2flatest%2fmain.template)
EU (Ireland) (eu-west-1)|[![alt text](/images/lab03/image001.png "Deploy")](https://console.aws.amazon.com/cloudformation/home?region=eu-west-1#/stacks/new?stackName=WAFWorkshopSampleWebApp&templateURL=https%3a%2f%2faws-waf-workshop-v2-eu-west-1.s3.eu-west-1.amazonaws.com%2faws-waf-v2-workshop%2flatest%2fmain.template)
EU (London) (eu-west-2)|[![alt text](/images/lab03/image001.png "Deploy")](https://console.aws.amazon.com/cloudformation/home?region=eu-west-2#/stacks/new?stackName=WAFWorkshopSampleWebApp&templateURL=https%3a%2f%2faws-waf-workshop-v2-eu-west-2.s3.eu-west-2.amazonaws.com%2faws-waf-v2-workshop%2flatest%2fmain.template)


分步指导:

  1. 如果需要，可以给你的堆栈一个唯一的名字。注意名字不要超过64字节的长度。
  2. 点击页面底部的”Next”按钮，使用默认值。
  3. 在最终的页面，确保选中了允许CloudFormation创建特定名字的IAM资源的权限。
  ![image](/images/lab03/image002.jpg)
  4. 点击页面右下角桔色的“创建堆栈”按钮来在你的账号里部署堆栈。 CloudFormation 现在将部署果汁店应用程序到自己的账号里。等待所有的堆栈部署显示创建完成(CREATE_COMPLETE)的状态。
  5. 在CloudFormation模板的输出里找到JuiceShopUrl值。这是你的果汁店网站的地址。(https://aws-waf-workshop-v2-us-east-1.s3.us-east-1.amazonaws.com/aws-waf-v2-workshop/latest/main.template )
  6. 在终端设置JUICESHOP_URL 的变量。你将使用这个变量来做运行测试你的WAF.

```shell
JUICESHOP_URL=<Your JuiceShopUrl CloudFormation Output>
```

这个实验是基于一系列的挑战。每一个挑战将会需要你来了解WAF的新概念。
使用AWS WAF documentation 来帮助你！

### Web ACLs和托管的Rules.

#### 介绍

##### Web ACLs

一个web ACL (Web Access Control List) 是亚马逊云科技WAF的核心资源。他包含评估每个收到请求的原则(rules)。一个web ACL 使用CloudFront发布点、API网关或者应用负载均衡器关联你的网页应用程序。

这个实验使用最新版本的WAF,请确认你没有使用经典WAF (WAF Classic).

##### 托管规则

最快的方法来开始使用WAF是在WebACL里部署托管规则组(Managed Rule Group for WAF)
托管规则组是一组WAF规则，由亚马逊云科技或者亚马逊市场里的第三方厂商创建和维护。这些规则提供了对常见攻击的保护。或者针对特定应用类型的攻击。
每一个托管的规则组防御一类常见的攻击，如SQL或者命令行攻击。

亚马逊云科技提供了一系列可供选择的规则组。例如Amazon IP Reputation list，Known Bad Inputs 和 Core rule set
还有其他规则组可供使用。

  ![image](/images/lab03/image003.png)

#### 任务 - WAF的核心概念<span id = "Step3"></span>

##### A部分

你是初创公司果汁店唯一的研发人员。你的网页是一个简单的使用SQL数据库的网页程序。由于某些原因，一组抢劫奶昔的黑客开始了对你站点的攻击。幸运的是，你最近参加了一个亚马逊云科技的WAF培训。你决定部署你自己的WAF来保护你的站点。

1.  在WAF控制面板，创建一个 web ACL.

       - 把web ACL 的名字改为waf-workshop-juice-shop
       - CloudWatch metrics name 使用默认名字
       - 资源类型是CloudFront 发布点

2.  关联 web ACL 到你站点的 CloudFront 分发点。

##### A部分答案

1.    浏览到AWS WAF 控制面板
2.    选择create web ACL
3.    设置Region 为 Global (CloudFront).
4.    设置名字为waf-workshop-juice-shop
5.    设置描述为web ACL for the aws-waf-workshop
6.    Resource type 设为CloudFront Distribution
7.    在关联(Associated) AWS resources的部分, 选择增加AWS 资源.
8.    选择CloudFront 发布点

  ![image](/images/lab03/image004.jpg)

  ![image](/images/lab03/image005.jpg)

如果CloudFront 发布点在关联web ACL的时候没有显示，请检查一下几点：

    1. web ACL的资源类型(Resource type)设置成为了CloudFront发布点。
    2. CloudFormation 模板已经被成功部署了。

##### B部分

你没有太多时间，所以你决定在你的WebACL里部署两个托管规则组。这将保护你的网站不受奶昔黑客发起的常见攻击的影响。

增加两个托管规则组进入你的WebACL

    1. 增加Core Rule Set ，这个规则组可以防止针对网页应用的常见漏洞的攻击。
    2. 增加SQL database规则组，这个规则组可以保护SQL数据库免受SQL数据库相关的漏洞利用攻击-例如SQL注入。

##### 测试案例

使用下列命令测试你的新规则。
确保JUICESHOP_URL变量包含Juice Shop部署完毕时提供的URL.

```shell
export JUICESHOP_URL=<Your Juice Shop URL>
# This imitates a Cross Site Scripting attack
# This request should be blocked.
curl -X POST  $JUICESHOP_URL -F "user='<script><alert>Hello></alert></script>'"
# This imitates a SQL Injection attack
# This request should be blocked.
curl -X POST $JUICESHOP_URL -F "user='AND 1=1;"
```

如果一个请求被阻断，你将收到一个HTML响应说明这个请求被禁止。下面是应当有的响应片段。

```html
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1" />
    <title>ERROR: The request could not be satisfied</title>
  </head>
  <body>
    <h1>403 ERROR</h1>
    <!-- Omitted -->
  </body>
</html>
```

如果你收到一个像下面一样的响应，那么这个请求没有被WAF阻断。

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>OWASP Juice Shop</title>
    // Omitted for brevity
  </head>
</html>
```

在这个情况下，应该是配置有错误。请检查下列几点:

- 你的CloudFront发布点是否与web ACL关联成功？
  - CloudFront发布点如果未与web ACL关联则WAF无法提供防护。

- 你的web ACL是否包含了两个激活状态的规则 – Core Rule Set和Sql database?
  - 如果托管原则没有激活，则没有规则会在web ACL里阻断请求。

##### B部分答案 

1.  点击进入你的web ACL的Rule 页面
2.  选择Add Rules > Add Managed Rule Groups
3.  从管理规则组里选择Core Rule Set和SQL Database

  ![image](/images/lab03/image006.png)

#### 结论

现在我们完成了你的Web ACL里的第一个规则的部署，现在您已经阻止了攻击。希望这就是攻击的结束。

本部分我们介绍了亚马逊云科WAF的托管规则。托管规则组允许你快速保护你的应用免受各种常见攻击的侵害。并且可以很方便的从亚马逊云科技和亚马逊云科技市场的合作供应商那里获得。



### 定制规则
#### 介绍
WAF允许你创建自己的规则(create your own rules)来处理请求。这可以为您的应用增加与应用相关的逻辑。关于定制规则，本部分将介绍请求采样（request sampling） 和Web ACL容量单元(Web ACL Capacity Units).

最简单的创建定制规则的方法是使用WAF控制面板的编辑器。

  ![image](/images/lab03/image007.png)

规则Rules允许你检查以下HTTP请求的组成部分，例如

  - 源IP
  - 请求头
  - 请求体
  - URI
  - 查询参数

基于被检查的组成部分，您可以阻断或允许一个请求。

##### 请求采样

WAF允许您观察一个经由WAF处理的请求的采样。可以通过Web ACL的仪表板看到。

  ![image](/images/lab03/image008.png)

这对于快速的判断来收到了哪些请求并且是如何被处理的很有用。
把所有的Web ACL 收到的请求都记录下来也是可做的。这部分我们后面会介绍。

##### Web ACL容量单元 (Capacity Units)

您在我们创建部署前两个托管规则的时候，您可能已经注意到有WCU或Web ACL容量单元的概念。WAF使用WCU来计算一个规则的运营开销。简单的规则比复杂的规则使用更少的WCU。

您的Web ACL默认的最大的WCU是1500.您通过联系亚马逊云科技支持团队可以提高这个上限。

关于WCU的更多信息。

#### 挑战任务

正如你所想到的，您击败了抢劫奶昔的黑客以后，更多的而已请求开始针对您的应用。攻击变得更有针对性。你认识到你可以使用Web ACL的定制规则来阻断这些攻击。

所有的攻击目前都包含一个奇怪的请求头,X-TomatoAttack.通过阻断带有这个请求头的请求将能够阻断这个攻击。

在您的Web ACL里创建一个规则可以阻断带有X-TomatoAttack请求头的请求。

使用下面的测试用例来检查您的规则是否工作。

提示

  - 创建一个新的定制规则
  - 这个而已请求包含一个特定的头部
  - 这个请求头的赋值字符串的长度是多少？

#### 测试用例

这个测试用例会发送一个请求到您的测试应用。如果这个WAF规则是工作的，你的请求应当被阻断，你会收到一个类似下面的403的响应。

```html
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1" />
    <title>ERROR: The request could not be satisfied</title>
  </head>
  <body>
    <h1>403 ERROR</h1>
    <!-- Omitted -->
  </body>
</html>
```

在您的终端运行下列命令

```shell
# Set the JUICESHOP_URL variable if not already done
# JUICESHOP_URL=<Your Juice Shop URL>
# This should be blocked
curl -H "X-TomatoAttack: Red" "${JUICESHOP_URL}"
# This should be blocked
curl -H "X-TomatoAttack: Green" "${JUICESHOP_URL}"
```

检查您的WebACL 概览来查看请求样本(WebACL overview to see the sampled requests).您应该可以看到这些请求被标记为BLOCK.

#### 答案


1. 在你的WebACL中增加定制规则
2. 检查请求的头部(Header)
3. 在您的Web ACL里增加定制规则
4. 检查请求的Header
5. 如果请求头(Header) X-TomatoAttack >= 0,就阻断该请求。

  ![image](/images/lab03/image009.png)

您也可以使用正则表达式 (regular expression) 达到同样的效果。

如果你的规则不工作，请检查以下两点:

1. 这个Web ACL和ALB关联成功。
2. 请求头字段的名字拼写正确。

#### 结论

哦，现在看起来你的定制规则工作了。
定制规则使你能部署通过WAF按照定制逻辑处理请求.定制规则可以检查很多请求的组成部分，然后在定制规则判断为真时允许这个请求。
每个Web ACL有默认的最大Web ACL 容量单元(WCU) - 1500. 但这个默认最大值可以增加。每一个规则和规则组都会占用一定数量的WCU.

### 高级的定制规则

#### 介绍

你已经创建了一个简单的可以评估请求中的一部分内容的WAF规则。那么评估一个请求中多个部分的规则应该怎样做么？

JSON中的规则

##### 高级的定制规则

所有的WAF 规则都是被JSON对象定义的。对于复杂的规则，我们可以更有效的直接通过规则编辑器使用JSON格式来编辑。你可以通过API,CLI或网页控制台，获得已有规则的JSON格式。使用的命令是get-rule-group。使用你熟悉的JSON文本编辑器，并重新使用update-rule-group把他们上传。

在JSON文件里定义规则允许你去使用版本控制来了解复杂的规则组是怎样在什么时候被更改的。
使用JSON定义规则的语法在 update-rule-group 文档里可以找到。如果你不确定JSON语法，可以在可视化编辑器里创建一个简单的例子，然后切换到JSON编辑器来看对等的JSON配置。

##### 规则中的布尔逻辑

AND, OR和NOT运算操作可以被用来创造更复杂的规则。在检查请求的多个部分时这是有用的。例如，你可以让在查询字符串或请求头包含一个特定的键/值时，才允许这个请求。
嵌套的规则可以使用可视化编辑器创建。然而，他们被限定只能有一级的深度。为了创建任意的嵌入式规则，只能使用JSON编辑器。可以使用验证(validate)动作在JSON编辑器里验证规则。

下面是一个通过控制便面创建的样例规则。这个规则将阻断查询字串长度大于等于0的请求。
这个规则将阻止任何包含查询字符串的请求。

  ![image](/images/lab03/image010.png)

下面是在JSON格式定义的完全相同的规则。

- Action指定了如果规则评估结果是真的情况下WAF采取的执行动作。
- VisibilityConfig用于配置请求采样和CloudWatch指标。
- Statement定义评估用的规则表达式

```json
{
  "Name": "example-rule-01",
  "Priority": 0,
  "Action": {
    "Block": {}
  },
  "VisibilityConfig": {
    "SampledRequestsEnabled": true,
    "CloudWatchMetricsEnabled": true,
    "MetricName": "example-rule-01"
  },
  "Statement": {
    "SizeConstraintStatement": {
      "FieldToMatch": {
        "QueryString": {}
      },
      "ComparisonOperator": "GT",
      "Size": "0",
      "TextTransformations": [
        {
          "Type": "NONE",
          "Priority": 0
        }
      ]
    }
  }
}
```

#### 例子

你的一个同事请你来帮忙。他们需要阻止恶意的请求同时又不能阻断来自真实的客户请求。恶意的请求包含一个超过100kb的请求体，但是缺少一个请求头，x-upload-photo:true

你很快认识到用可视化编辑器做不到这一点。你需要编辑一些JSON.
让我们从一个空的规则开始。

```json
{
  "Name": "example-rule-02",
  "Priority": 0,
  "Action": {
    "Block": {}
  },
  "VisibilityConfig": {
    "SampledRequestsEnabled": true,
    "CloudWatchMetricsEnabled": true,
    "MetricName": "example-rule-02"
  },
  "Statement": {
    // We will add the rule here
  }
}
```
有两个情况我们需要考虑

1. 如果请求体大于100kb，阻断这个请求。
2. 如果请求不包含x-upload-body: true 头部，阻断这个请求。

我们将使用或 OR 和 NOT 来表达这个逻辑。

```json
{
// fields omitted for brevity
"Statement": {
  "OrStatement": {
    "Statements": [
      {
        // Inspect Body Size here
      },
      {
        "NotStatement": {
           // Inspect Header here
        }
      }
    ]
  }
}
```
为了检查请求体的大小，我们将使用SizeConstraintStatement来验证请求体的大小。

```json
"SizeConstraintStatement": {
  "FieldToMatch": {
    "Body": {}
  },
  "ComparisonOperator": "GT",
  "Size": "100",
  "TextTransformations": [
    {
      "Type": "NONE",
      "Priority": 0
    }
  ]
}
```

使用ByteMatchStatement 检查请求头。

```json
"ByteMatchStatement": {
  "FieldToMatch": {
    "SingleHeader": {
      "Name": "x-upload-image"
    }
  },
  "PositionalConstraint": "EXACTLY",
  "SearchString": "true",
  "TextTransformations": [
    {
      "Type": "NONE",
      "Priority": 0
    }
  ]
}
```

这里是完成的规则。

```json
{
  "Name": "complex-rule-example",
  "Priority": 0,
  "Action": {
    "Block": {}
  },
  "VisibilityConfig": {
    "SampledRequestsEnabled": true,
    "CloudWatchMetricsEnabled": true,
    "MetricName": "complex-rule-example"
  },
  "Statement": {
    "OrStatement": {
      "Statements": [
        {
          "SizeConstraintStatement": {
            "FieldToMatch": {
              "Body": {}
            },
            "ComparisonOperator": "GT",
            "Size": "100",
            "TextTransformations": [
              {
                "Type": "NONE",
                "Priority": 0
              }
            ]
          }
        },
        {
          "NotStatement": {
            "Statement": {
              "ByteMatchStatement": {
                "FieldToMatch": {
                  "SingleHeader": {
                    "Name": "x-upload-body"
                  }
                },
                "PositionalConstraint": "EXACTLY",
                "SearchString": "true",
                "TextTransformations": [
                  {
                    "Type": "NONE",
                    "Priority": 0
                  }
                ]
              }
            }
          }
        }
      ]
    }
  }
}
```

#### 挑战任务

抢劫奶昔的黑客又一次发起了对果汁店的攻击。他们又一次改变了他们的攻击方法！你需要创建一个新的规则来阻断这些请求。同时需要避免影响真正的客户。这一次的挑战，你将基于已有的规则进行。

选择查看你的现有规则。

目前这个规则将会阻断符合以下条件的请求

1. 包含请求头x-milkshake: chocolate
2. 包含查询参数milkshake=banana

这个规则曾经是可用的。但是攻击者已经适应了。现在恶意的请求包含以下特点:

1. 请求头包含x-milkshake: chocolate 和x-favourite-topping: nuts
2. 查询参数是milkshake=banana 和查询参数 favourite-topping=sauce

更新现有的规则，使用AND 来扩展两个存在的配置。And有下面的语法。

```json
"AndStatement": {
  "Statements": [
    # Add your statements here
  ]
}
```

#### 测试用例

使用下列的curl发起请求来测试你的新规则

```shell
# Set the JUICESHOP_URL if not already done
JUICESHOP_URL=<Your Juice Shop URL>
# Allowed
curl -H "x-milkshake: chocolate" "${JUICESHOP_URL}"
curl  "${JUICESHOP_URL}?milkshake=banana"
# Blocked
curl -H "x-milkshake: chocolate" -H "x-favourite-topping: nuts" "${JUICESHOP_URL}"
curl  "${JUICESHOP_URL}?milkshake=banana&favourite-topping=sauce"
```

被阻断的请求给出的响应应与下面类似

```html
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1" />
    <title>ERROR: The request could not be satisfied</title>
  </head>
  <body>
    <h1>403 ERROR</h1>
    <!-- Omitted -->
  </body>
</html>
```

#### 答案

```json
{
  "Name": "complex-rule-challenge",
  "Priority": 0,
  "Action": {
    "Block": {}
  },
  "VisibilityConfig": {
    "SampledRequestsEnabled": true,
    "CloudWatchMetricsEnabled": true,
    "MetricName": "complex-rule-challenge"
  },
  "Statement": {
    "OrStatement": {
      "Statements": [
        {
          "AndStatement": {
            "Statements": [
              {
                "ByteMatchStatement": {
                  "FieldToMatch": {
                    "SingleHeader": {
                      "Name": "x-milkshake"
                    }
                  },
                  "PositionalConstraint": "EXACTLY",
                  "SearchString": "chocolate",
                  "TextTransformations": [
                    {
                      "Type": "NONE",
                      "Priority": 0
                    }
                  ]
                }
              },
              {
                "ByteMatchStatement": {
                  "FieldToMatch": {
                    "SingleHeader": {
                      "Name": "x-favourite-topping"
                    }
                  },
                  "PositionalConstraint": "EXACTLY",
                  "SearchString": "nuts",
                  "TextTransformations": [
                    {
                      "Type": "NONE",
                      "Priority": 0
                    }
                  ]
                }
              }
            ]
          }
        },
        {
          "AndStatement": {
            "Statements": [
              {
                "ByteMatchStatement": {
                  "FieldToMatch": {
                    "SingleQueryArgument": {
                      "Name": "milkshake"
                    }
                  },
                  "PositionalConstraint": "EXACTLY",
                  "SearchString": "banana",
                  "TextTransformations": [
                    {
                      "Type": "NONE",
                      "Priority": 0
                    }
                  ]
                }
              },
              {
                "ByteMatchStatement": {
                  "FieldToMatch": {
                    "SingleQueryArgument": {
                      "Name": "favourite-topping"
                    }
                  },
                  "PositionalConstraint": "EXACTLY",
                  "SearchString": "sauce",
                  "TextTransformations": [
                    {
                      "Type": "NONE",
                      "Priority": 0
                    }
                  ]
                }
              }
            ]
          }
        }
      ]
    }
  }
}
```

#### 结论

在本部分，您学习了JSON格式的WAF规则。使用AND,OR,NOT运算符可以在规则中定义复杂的逻辑。


### 验证新的规则

#### 介绍

在部署一个新的规则时，测试是重要的。这能确保你不会意外地阻断正常的请求。

目前在对请求执行动作时，你已经使用过阻断和允许。我们还有一个第三种动作 - 计数(Count).技术允许我们了解匹配规则条件的请求。

计数是一个非终止(non-terminating)动作。当一个请求有计数动作匹配一个了条件。Web ACL会继续对这个请求根据剩下的规则进行处理。而不是停止检查允许通过。

托管规则和规则组也可以使用计数动作进行测试。

观察匹配规则计数

当一个计数执行动作的规则被匹配，会触发事件表现在CloudWatch指标里。要看这个规则的计数，浏览到CloudWatch metrics console.选择AWS/WAFv2,然后是区域，规则，WebACL,这样就可以看到你的WAF指标了。

默认情况下，WAF的指标都是用平均值表示。在有些情况下改成总计(Sum)会很有帮助。

#### 挑战任务

你已经为你的WAF准备了新的规则。在你部署WAF规则之前，你必须先测试。这样可以减少新引入的规则阻断正常请求的风险。

下面这个规则会阻断带有查询参数username的查询。

了解更多关于测试Web ACL的细节。

1. 更改规则的执行动作为计数，使它能够被测试。

```json
{
  "Name": "count-von-count",
  "Priority": 0,
  "Action": {
    "Block": {}
  },
  "VisibilityConfig": {
    "SampledRequestsEnabled": true,
    "CloudWatchMetricsEnabled": true,
    "MetricName": "count-von-count"
  },
  "Statement": {
    "SizeConstraintStatement": {
      "FieldToMatch": {
        "SingleQueryArgument": {
          "Name": "username"
        }
      },
      "ComparisonOperator": "GT",
      "Size": "0",
      "TextTransformations": [
        {
          "Type": "NONE",
          "Priority": 0
        }
      ]
    }
  }
}
```
2. 通过控制面板或者CLI把这个规则部署到你的Web ACL。

#### 测试用例

在命令行终端执行下列命令。

```shell
curl "$JUICESHOP_URL?username=admin"
```

这个请求不会被阻断。而是会被计数。可以通过检查CloudWatch 指标来看这个规则是否工作。

提示

1. 把规则的执行动作改为计数(Count)

```json
{
  "Name": "count-von-count",
  "Priority": 0,
  "Action": {
    "Count": {}
  },
  "VisibilityConfig": {
    "SampledRequestsEnabled": true,
    "CloudWatchMetricsEnabled": true,
    "MetricName": "count-von-count"
  },
  "Statement": {
    "SizeConstraintStatement": {
      "FieldToMatch": {
        "SingleQueryArgument": {
          "Name": "username"
        }
      },
      "ComparisonOperator": "GT",
      "Size": "0",
      "TextTransformations": [
        {
          "Type": "NONE",
          "Priority": 0
        }
      ]
    }
  }
}
```


2. 在控制面版创建一个新的规则。切换到JSON编辑并粘贴到你的规则里。
3. 发送一些包含查询参数username的请求到网页应用。
4. 浏览到CloudWatch指标页面。选择AWS/WAFv2,然后是区域，规则，WebACL,这样就可以看到你的WAF指标了。

![image](/images/lab03/image011.jpg)

在部署一个新的规则时，测试是重要的。使用计数执行动作的方法测试新的规则。使用CloudWatch指标里的WAF规则匹配计数来监测。

### 日志

WAF使用Amazon Kinesis Firehose 来注入日志。这允许日志被转送到任何Kinesis Firehose支持的日志目的地- 如亚马逊S3, 亚马逊Redshift或亚马逊Elastic Search. 为了启用Web ACL的请求日志，你必须先要创建一个Kinesis Data Firehose.

下面是一个请求的例子WAF日志。注意你会收到关于阻断请求的规则的细节。这个日志也会包含针对这个请求采取的执行动作。

```json
{
  "timestamp": 1576280412771,
  "formatVersion": 1,
  "webaclId": "arn:aws:wafv2:ap-southeast-2:EXAMPLE12345:regional/webacl/STMTest/1EXAMPLE-2ARN-3ARN-4ARN-123456EXAMPLE",
  "terminatingRuleId": "STMTest_SQLi_XSS",
  "terminatingRuleType": "REGULAR",
  "action": "BLOCK",
  "terminatingRuleMatchDetails": [
    {
      "conditionType": "SQL_INJECTION",
      "location": "HEADER",
      "matchedData": ["10", "AND", "1"]
    }
  ],
  "httpSourceName": "-",
  "httpSourceId": "-",
  "ruleGroupList": [],
  "rateBasedRuleList": [],
  "nonTerminatingMatchingRules": [],
  "httpRequest": {
    "clientIp": "1.1.1.1",
    "country": "AU",
    "headers": [
      {
        "name": "Host",
        "value": "localhost:1989"
      },
      {
        "name": "User-Agent",
        "value": "curl/7.61.1"
      },
      {
        "name": "Accept",
        "value": "*/*"
      },
      {
        "name": "x-stm-test",
        "value": "10 AND 1=1"
      }
    ],
    "uri": "/foo",
    "args": "",
    "httpVersion": "HTTP/1.1",
    "httpMethod": "GET",
    "requestId": "rid"
  }
}
```

#### 日志的可视化及分析 

日志分析可以确认WAF规则是有效的。同时还用于诊断问题。导出到Amazon Elastic Search Service的日志能够被查询。Kibana 可以和亚马逊Elastic Search配合来把WAF 日志可视化。S3 Select 可以用来对S3上的WAF 日志使用SQL语句来进行查询。查询可以在控制面板上执行。也可以使用CLI和SDK。

例如，下面S3 Select会日志查询计数有多少请求被阻断了。

```sql
SELECT *
FROM S3Object s
WHERE  s."action" = 'BLOCK'
/*
Result
{
    "count": 18
}
*/
```

#### 挑战任务

果汁店的生意迅速扩展。您的工作收效显著！现在你有一整套规则了，这种情况下了解哪一个规则组织了某个请求就变得比较困难。这时我们通过日志检查会有帮助。要做到这一点，我们需要激活Web ACL日志并存储到一个S3桶里。你的日志包含有敏感的请求头，叫做Cookie.你不想这个敏感信息被保存到你的日志里。你将需要对这部分请求头配置模糊化(redaction)。

使用Logging Web ACL Traffic Information来帮助你进行配置。


1. 创建一个S3桶。这将成为你的Kinesis Data Firehose的目的地。
   - S3桶的前缀要设置为aws-waf-logs-workshop-。这将让我们更容易的找到日志。
   - 当使用Kinesis Data Firehose来注入WAF请求日志时，Firehose的名字必须使用aws-waf-logs-的前缀。
2. 创建Kinesis Data Firehose传递流。确保在us-east-1里创建资源。这一步是当抓取CloudFront日志时所必需的。使用前面创建的S3桶作为你的传递流目的地。
   - 给Kinesis Data Firehose一个前缀aws-waf-logs-workshop-。这是WAF服务需要配置的前缀。
3. 启用你的WAF的日志
4. 模糊化cookie, 把日志里的标题写为Cookie(水果店的Cookie)
5. 使用下面的curl请求产生一些流量。这些请求中的一部分会被你刚才创建的规则阻断。

```shell
curl "$JUICESHOP_URL?username=admin"
curl "${JUICESHOP_URL}?milkshake=banana&favourite-topping=sauce"
curl -H "x-milkshake: chocolate" "${JUICESHOP_URL}"
```

6. 从Kinesis Data Firehose目的地的S3桶里下载日志文件。
7. 检查日志，看看您能否找到做过模糊化的Cookie字段？

可以通过get-logging-configuration CLI命令查看模糊化字段的日志配置。

#### 答案


1. 在us-east-1创建一个Kinesis Data Firehose。确认名字带有前缀aws-waf-logs-.例如aws-waf-logs-workshop.选择S3作为Firehose的目的地。
2. 在WAF配置面板选择你的Web ACL。
3. 选择日志和指标(Logging and Metrics)页面.
4. 选择启用日志
5. 选自你想要使用的Kinesis Date Firehose。
6. 在模糊化字段，勾选请求头。增加请求头值Cookie.
7. 运行在前面提到的curl命令来产生流量。
8. 从S3下载日志文件。
9. 在日志文件里搜索Cookie请求头。

#### 结论

WAF允许你取抓取请求日志并存储在任意Kinesis Data Firehose的目的地。日志可以提供请求的信息。日志也提供关于请求的执行动作和匹配规则的信息。这个信息当运行WAF时很有价值。使用字段模糊化防止日志包含敏感信息。

### 清理环境

你赢了！感谢你，果汁店继续得到发展。而抢劫奶昔的黑客返回了他们的总部。

在你完成本次实验以后，请确保删除你不再需要的资源。

这里时你在实验中创建的资源列表。

- 样例网页应用
- Web ACL
- Kinesis Data Firehose
- 作为Kinesis Firehose 输出目的地的S3 桶

下面是删除这些资源的步骤

#### 样例网页应用

样例网页应用在CloudFromation栈中定义。名字为WAFWorkshopSampleWebApp 。
按照Deleting a CloudFormation Stack的步骤删除堆栈。
WAFWorkshopSampleWebApp 是一个嵌套式的堆栈。通过删除顶级的堆栈，嵌套的堆栈也将被删除。

#### WAF web ACL 

按照下面步骤删除Web ACL Deleting a Web ACL.
https://docs.aws.amazon.com/waf/latest/developerguide/web-acl-deleting.html

#### Kinesis Data Firehose 

1. 浏览到Kinesis 控制面板
2. 选择Data Firehose页面。如果你不能看到这个资源，确认下你的区域是否正确。这个资源应该在us-east-1里。这可能会与Web App部署的区域不同。
3. 删除您之前创建的Data Firehose。它将带有aws-waf-logs-workshop-的前缀。

#### S3 桶 

1. 浏览到S3控制面板
2. 选择作为Kinesis Data Firehose 输出目的地的S3桶。输出文件会带有aws-waf-logs-workshop-前缀。如果你看不到这个资源，请注意检查所在区域是否正确。这个资源应当在us-east-1.它有可能和您的Web App所在区域不同。
3. 删除桶内的内容。
4. 删除S3桶


