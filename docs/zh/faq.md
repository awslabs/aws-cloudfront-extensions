# 分配管理 
## 快照 
### 快照保存了什么？
Snapshot将Cloudfront配置保存为一个配置文件，您可以通过[get-distribution-config](https://docs.aws.amazon.com/cli/latest/reference/cloudfront/get-distribution-config.html)获取到同样的配置。我们的解决方案将配置文件保存在S3中，url保存在DynamoDB中。您可以通过调用[list_snapshots api](api-reference-guide/snapshot/list_snapshots.md)获取指定分配的所有快照。

### 为什么需要保存快照？
Cloudfront配置很复杂，当用户花了一些时间更新Cloudfront的配置时，他/她不希望配置被意外更新为错误的配置。因此，我们提供此快照功能，让用户创建快照，以便将来用户可以将当前配置与快照进行比较，或者比较任意两个快照之间的差异。

### 快照将保存多长时间？
快照将保存在S3存储桶中，不会自动删除。您可以在Web控制台或通过[delete_snapshot api](api-reference-guide/snapshot/delete_snapshot.md)删除快照。

### 快照价格是多少？
Cloudfront配置文件是JSON格式，大约3KB。请参考[Cost](cost.md)获取更多信息。
