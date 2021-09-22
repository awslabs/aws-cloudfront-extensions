---
title: 构建CloudFront加速的网站 
weight: 5
---

Lab Guide

---
目录
- [Lab - 构建CloudFront加速的网站](#Lab) 

- [Step1: 创建 EC2和S3 源站](#Step1)
   在S3桶中创建index.html
   验证 EC2 部署情况

- [Step2: 创建一个CloudFront Distribution](#Step2) 
   添加EC2 源

- [Step3: 测试通过CloudFront发布的应用](#Step3)

- [Step4: 测试Invalidations](#Step4)

- [Step5: 配置定制错误页面](#Step5)
   制作一个定制错误页面
   在CloudFront里配置定制错误页面

- [Step6: 配置源站组(Origin Group)](#Step6)
   在CloudFront中配置源站组
   测试

   
- [Step7: 结论](#Step7)


#### Lab - 构建CloudFront加速的网站<span id = "Lab"></span>
介绍

本实验中，我们将学习如何设置一个CloudFront distribution作为一个简单的包含动静态Web应用的前端。Web应用使用S3和EC2搭建，具体如下图。我们将学习如何测试并检查CloudFront送出的特定请求头。最后，我们将会把发布的内容无效化处理，并配置定制的报错页面，以保证友好的失效网页体验。

![image](/images/lab01/image001.jpg)

#### Step1: 创建 EC2和S3 源站<span id = "Step1"></span>

在本部分实验中，我们将使用准备好的CloudFormation 模板创建S3和EC2的源站

操作步骤:

创建一个新的CloudFormation Stack

1 – Login进入AWS Global Console,进入North Virginia us-east-1 区，并选择 Create stack with new resources ( ‘Create stack’ > ‘With new resources (standard)’).

![image](/images/lab01/image002.png)

2 – 选择“Template is ready” 并且 “Upload a template file”, 然后选取并上传下面的模板文件: cloudfront-lab.yaml (https://content-acceleration-cloudfront.workshop.aws/cloudfront-lab.yaml )

![image](/images/lab01/image003.png)

3 – 点击Next, 输入你的CloudFormation stack的名字并点击两次Next (Options and Review) , 然后点击 Create stack. 

![image](/images/lab01/image004.jpg)

4 – 等stack 状态显示CREATE_COMPLETE, 到Outputs 表记录EC2 网页服务器和S3桶的DNS 名字. 在stack启动的过程中，我们可以通过Events表获得更多细节信息做错误诊断工作。

![image](/images/lab01/image005.jpg)
![image](/images/lab01/image006.jpg)

在S3桶中创建index.html 

5 – 使用文本编辑器创建一个index.html 文件。贴入如下HTML内容. 这个HTML文件使用iframe tag 调用了动态内容。实际上，当一个用户发出一个请求给index.html的时候。浏览器送出了一个对/api 文件的子请求。

```html
<!DOCTYPE html>
<html lang="en">
  <body>
    <table border="1" width="100%">
    <thead>
        <tr><td><h1>CloudFront Lab</h1></td></tr>
    </thead>
    <tfoot>
        <tr><td>Immersion Days - Edge Services - Module 1</td></tr>
    </tfoot>
    <tbody>
        <tr><td>Response sent by API</td></tr>
    </tbody>
    <tbody>
        <tr><td> <iframe src='../api' style="width:100%; height:100%;"></iframe></td></tr>
    </tbody>
    </table>
  </body>
</html>
```

6 – 在AWS console,访问通过CloudFormation创建的S3桶，并上传index.html。其他设定使用默认设定.
![image](/images/lab01/image007.jpg)

7 – 当我们尝试使用S3 Object URL访问index.html的时候。访问会被拒绝，这是正常的，因为这里的S3 Object还没有被设置为Public Object.

![image](/images/lab01/image008.png)
![image](/images/lab01/image009.jpg)

验证 EC2 部署情况

8 – 我们的CloudFormation模板部署了一个Node.Js 应用，会监听针对EC2 80端口的HTTP请求.当收到请求时，应用会发回一个JSON格式的响应，包含请求中的HTTP Header信息。它也会解析查询字符串的信息，并从Web服务器返回查询数据。应用代码如下：

```js
const express = require('express')
const app = express()
app.get('/api', function (req, res) {
  console.log(JSON.stringify(req.headers))
  if (req.query.info) {
    require('child_process').exec('cat '+ req.query.info,
      function (err, data) {
        res.send(new Date().toISOString() + '\n' + JSON.stringify(req.headers)+ '\n'+data)
      });
  } else {
    res.send(new Date().toISOString() + '\n' + JSON.stringify(req.headers))
  }
});
app.listen(8080, function () {
  console.log('api is up!')
})
```
9 – 在浏览器上输入如下URL 以确保应用工作正常: http://[EC2-DNS-name]/api. 我们应当可以看到类似下图的响应。

![image](/images/lab01/image010.jpg)

#### Step2: 创建一个CloudFront Distribution<span id = "Step2"></span>

1 – 到AWS Console的CloudFront页面创建一个新的distribution. 如果我们第一次使用CloudFront, 需要在”Getting Started”一面创建Distribution. 否则，我们可以直接创建一个 Web distribution.

![image](/images/lab01/image011.jpg)

2 – 配置默认的源指向之前创建的S3 桶，并授予CloudFront访问该桶的权限：
Origin Access Identity settings:

- Origin Domain Name: Your S3 bucket
- Restrict Bucket Access: Yes
- Origin Access Identity: Create a new Identity
- Grant Permissions on Bucket: Yes, Update Bucket policy

![image](/images/lab01/image012.jpg)

3 – 配置默认的Cache Behavior 如下图:

- Viewer Protocol Policy: Redirect HTTP to HTTPS
- Cache and origin request settings: Use legacy cache settings
- Object Caching: Customize
- Minimum TTL: 86400
- Compress Objects Automatically: Yes

![image](/images/lab01/image013.jpg)

4 -在Distributions Settings 中, 配置 Default Root Object 为 index.html 并保持其他设置为默认设置.
本实验中，我们将使用CloudFront提供的域名。如果要使用自己的域名，我们可以在 Alternate Domain Names (CNAMEs) 里配置.

点击创建distribution. CloudFront 会开始执行创建(一般会化5到10分钟完成部署)。Distribution的状态会显示为进行中。我们可以点击Distribution菜单的左边检查状态。

![image](/images/lab01/image014.jpg)
![image](/images/lab01/image016.jpg)

添加EC2 源 

5 – 在distributions console, 点击我们的 distribution ID, 进入Origins 和Origin Groups 页面来创建另一个api的源。点击 Origins和 Origin Groups页面并点击click Create Origin 按钮. 

![image](/images/lab01/image017.jpg)

6 – 输入EC2 的 DNS 名作为Origin Domain Name, 并增加keep alive timeout 到 60 seconds. 注意尽管我们想要使用HTTPS 提供服务, 我们仍然会保持 HTTP connection 回源来减少源站TLS的开销. 所以我们设定Origin Protocol Policy 为 HTTP only.

![image](/images/lab01/image018.jpg)
![image](/images/lab01/image019.jpg)

7 – 创建一个新的Behavior给/api. 选择Behaviors 页面并点击Create Behavior 按钮. 

8 – 配置second cache behavior 以使用EC2 origin 。使用如下参数来使CloudFront作为代理并绕过
Cache层.

- Path Pattern: /api
- Viewer Protocol Policy: Redirect HTTP to HTTPS
- Cache Based on Selected Headers: All
- Forward Cookies: All
- Query String Forwarding and Caching: Forward all, cache based on all.
- Compress Objects Automatically: Yes

![image](/images/lab01/image020.png)

9 – 记录General页面的里CloudFront关联distribution的domain name.

![image](/images/lab01/image021.jpg)

#### Step3: 测试通过CloudFront发布的应用<span id = "Step3"></span>

1 - CloudFront distributions 在状态仍处于”in progress”的时候就可以被本地使用了。因为这个状态需要配置发布到所有edge位置以后才会变为deployed. 要验证distribution是否已经可以在本地使用。我们可以用nslookup查询CloudFront域名. 记住dxxxx.cloudfront.net 的名字对于每一个distribution都是唯一的,这是我们需要使用我们自己的distribution value来测试的原因。通过nslookup可以看到CloudFront 为每一个DNS查询返回了不同的IP 。以此来增加应用的弹性。

![image](/images/lab01/image022.jpg)

2 – 当发布完成我们可以在浏览器上输入CloudFront的域名如http://dxxxx.cloudfront.net. 来做测试。在网页中，我们应当可以看到CloudFront 转发和增加到的HTTP headers:

- cloudfront-forwarded-proto: 表示网页访问者连接CloudFront使用的协议
- cloudfront-is-mobile-viewer: 表示网页访问者的设备类型
- cloudfront-viewer-country: 表示网页访问者的国家
- x-amz-cf-id: CloudFront给每一个request分配的唯一id. 如果刷新页面，id会变化。这对于webserver日志记录有帮助，而且，这个id会被发回到网页访问者并被记录到CloudFront访问日志里。如果我们需要诊断问题，我们可以提交support ticket并提供request id ，并说明CloudFront如何重定型请求到HTTPS。

![image](/images/lab01/image023.jpg)

3 – 如果我们使用浏览器的开发工具(developer tools),women你可以检查CloudFront发出的响应头。下面三个响应头应当可以看到 of your favorite web browser, you can check the response headers sent by CloudFront. Three headers are interesting to check:

- x-amz-cf-id CloudFront给每一个request分配的唯一id.
- x-amz-cf-pop 表示服务特定request的CloudFront edge 位置. 每个edge位置由三个字母和一个指定数字组成。例如, DFW3. 通常是edge location附近的国际机场代码
- x-cache 表示本请求是否是有命中缓存 或未命中缓存. 通常，本实验中的html 文件, 我们会在后续的访问中得到 ‘Hit from Cloudfront’ 的结果, 但对/api的访问请求总会得到 ‘Miss from CloudFront’ 因为对/api，cache被关闭了.

![image](/images/lab01/image024.jpg)

Firefox 的开发工具显示如下:

![image](/images/lab01/image025.jpg)

#### Step4: 测试Invalidations<span id = "Step4"></span>
本节，我们会使用invalidation部署最新更新的内容.

如我们前面看到的，主页文件index.html 已经被缓存并产生了CloudFront缓存命中的结果。假设我们必须要更改HTML文件但是不能更改URL来指向新的版本。这时，我们需要把页面invalidate.

1 – 进入CloudFront Console的Invalidations 页面.

![image](/images/lab01/image026.jpg)
![image](/images/lab01/image027.jpg)

2 – 为我们的index.html创建一个invalidation. 由于index.html是默认的root对象，我们可以在Object paths指定 / . invalidation url

3 – 几秒钟过后，再次使用网页开发工具测试。我们会发现有cache miss的结果出现。

![image](/images/lab01/image028.png)

#### Step5: 配置定制错误页面<span id = "Step5"></span>

本节，我们将配置定制错误页面来优雅的处理被请求内容不存在的错误提示。
制作一个定制错误页面 

1 – 用一个本CloudFront域名，带有随机对象的URL(如下图)测试，我们会得到一个403禁止访问的响应(因为本文件不存在)。默认情况下，CloudFront会把这个错误请求缓存5分钟。

![image](/images/lab01/image029.jpg)

2 – 创建一个error.html 文件，内容如下。并上传到我们的S3桶。

```html
<html lang="en">
  <body>
    <h1>CloudFront Lab</h1>
    Oups, this is a nice error page!
  </body>
</html>
```
![image](/images/lab01/image030.jpg)

在CloudFront里配置定制错误页面 

3 – 在CloudFront console, 找到我们的distribution, 进入Error Pages 页面并点击 Create Custom Error Response 按钮.

4 – 使用如下设置配置定制错误响应。

- HTTP Error Code: 403 Forbidden
- Error Cacching Minimum TTL (seconds) : 60
- Customize Error Response : Yes
- Response Page Path : /error.html
- HTTP Response Code: 200 OK

![image](/images/lab01/image031.jpg)
![image](/images/lab01/image032.jpg)

5 – 使用qing求一个随机页面的方法，测试我们的定制错误页面。测试之前可能需要等待几分钟让最新的配置发布到Edge节点。确认每次测试我们都是用一个不同于前次测试的随机值。否则5分钟内我们会得到同样的缓存版本。screen shot

6 – 创建另一个定制错误页面，用来处理当源站不能访问时的错误。使用如下设置:

- HTTP Error Code: 504 Gateway Timeout
- Error Caching Minimum TTL (seconds) : 5
- Customize Error Response : Yes
- Response Page Path: /error.html
- HTTP Response Code: 200 OK

![image](/images/lab01/image033.jpg)

7 – 到EC2 console , 通过修改安全组阻止EC2的入境访问Nodejs api的流量。

![image](/images/lab01/image034.png)

8 – 用浏览器测试我们的index.html 页面. 等待一段时间直到API call 失败，并友好的定向到定制错误页面. 显示应当如下图。

![image](/images/lab01/image035.jpg)

#### Step6: 配置源站组(Origin Group)<span id = "Step6"></span>

本节，我们来配置一个源站组，提供失效故障时的请求重路由。我们可以把源站组和Cache Behavior关联起来。然后把request从主源站路由到第二源站.

配置第二源站

1 - 在 S3 console,在不同region创建一个新的S3桶, 例如us-west-1. 给S3桶起一个唯一的名字,增加一个定制的字符串，比如cloudfrontlab-s3bucket-secondary-. 清除 “block all public access” 的勾选.

![image](/images/lab01/image036.jpg)
![image](/images/lab01/image037.jpg)

2 – 配置默认的源指向新创建的S3 桶，并授予CloudFront访问该桶的权限：

Origin Access Identity settings:

- Origin Domain Name: Your S3 bucket
- Restrict Bucket Access: Yes
- Origin Access Identity: Create a new Identity
- Grant Permissions on Bucket: Yes, Update Bucket policy

![image](/images/lab01/image038.jpg)

3- 创建一个new-index.html文件，内容如下。并上传到新的us-west-1上的S3桶.把new-index.html设置为Make public。

```html
<html lang="en">
  <body>
    <h1>CloudFront Lab</h1>
    Hi, this is a page from my secondary Origin! We now support Origin group and failover!
  </body>
</html>
```
![image](/images/lab01/image039.jpg)

在CloudFront中配置源站组 

4- 回到CloudFront distribution ，创建一个新的Origin,指向新创建的us-west-1的S3桶.

- Origin Domain Name: S3桶的网页域名(例如 http://cloudfrontlab-s3bucket-secondary.s3-website-us-west-1.amazonaws.com)

![image](/images/lab01/image041.jpg)

5- 创建一个源站组，关联主源站和第二源站。. 在CloudFront Origins and Origin Groups 页面, 点击创建Origin Group.

![image](/images/lab01/image042.jpg)

使用 S3-cloudfrontlab-s3bucket as 主源站, 使用 S3-cloudfrontlab-s3bucket-secondary 第二源站. 切换条件，选择404 Not Found 和 403 Forbidden.

![image](/images/lab01/image043.jpg)

6- 编辑distribution的默认行为，来使用新的源站组。在CloudFront Behaviors页面,选择Default(*),并点击Edit. 修改源站组的响应行为。

![image](/images/lab01/image044.jpg)
![image](/images/lab01/image045.jpg)

测试 

7- distribution status 变为Deployed以后。使用CloudFront url 访问new-index.html。我们可以看到我们的第二个S3桶正确的响应了访问请求。

![image](/images/lab01/image046.jpg)

#### Step7: 结论<span id = "Step7"></span>

恭喜！我们已完成 CloudFront 模块的实验室。
本次实验我们学习了如何创建具有多个源和多个行为的分发，以向您的源提供静态内容和代理 API 动态内容。
以及如何设置源组以在故障转移事件期间提供重新路由。
并且了解了如何设置自定义错误页面并使内容快速失效。
此外，我们还了解了一些用于调试的重要 CloudFront 标头。为以后的调试做好了准备。

