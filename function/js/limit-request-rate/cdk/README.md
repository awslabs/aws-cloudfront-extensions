# Rate-Limit-By-LambdaEdge

利用Lambda@edge + cloudfront + waf做请求速率控制，保护源站。


## synth命令,生成模版
```
npm install
cdk synth --path-metadata false --version-reporting false
```
## 部署命令
```
cdk deploy --parameters cfDistId=ERPF1QJKIU7F3 --parameters rateLimit=10 --parameters urlRateLimit=5 --parameters urlList='/foo,/bar,/bar/1' --context ddbregions=us-west-2,ap-southeast-1,eu-central-1  RateLimitCfStack --profile useast1 
```
### 参数说明
```
cdk deploy --parameters cfDistId=<distribution id> --parameters rateLimit=<总限速速率，每分钟> --parameters urlRateLimit=<url限速速率> --parameters urlList=<URL list> --context ddbregions=<region1>,<region2>,<region3>  RateLimitCfStack  --profile <profile>
```

