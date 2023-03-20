## 快照

CloudFront分配中包含了多种配置，您可能希望保存指定配置并将其应用于AWS帐户中的当前CloudFront分配或其他分配。此解决方案允许您将配置保存为“快照”，以便您可以随时重用它。

### 为什么需要保存快照？
Cloudfront配置很复杂，当用户花了一些时间更新Cloudfront的配置时，并不希望配置被意外更新为错误的配置。因此，我们提供快照功能，让用户创建快照，以便将来用户可以将当前配置与快照进行比较，或者比较任意两个快照之间的差异。

### 如何使用快照？

您可以在web控制台上对快照执行以下操作：

- [发布快照](./publish-snapshot.md)
- [比较快照](./compare-snapshot.md)
- [应用快照](./apply-snapshot.md)
- [删除快照](./delete-snapshot.md)


您也可以通过API对快照执行以下操作：

- [create_snapshot](../../api-reference-guide/snapshot/create_snapshot.md)
- [delete_snapshot](../../api-reference-guide/snapshot/delete_snapshot.md)
- [list_snapshots](../../api-reference-guide/snapshot/list_snapshots.md)
- [diff_cloudfront_snapshot](../../api-reference-guide/snapshot/diff_cloudfront_snapshot.md)
- [get_snapshot_link](../../api-reference-guide/snapshot/get_snapshot_link.md)
- [apply_snapshot](../../api-reference-guide/snapshot/apply-snapshot.md)
- [config_snapshot_tag_update](../../api-reference-guide/snapshot/config_snapshot_tag_update.md)


### 快照是如何工作的？

创建快照时，本解决方案会自动将指定CloudFront分配的配置导出并存储成S3桶中的文件，并将此配置文件和快照名称的映射等信息存储在DynamoDB表中。

### 快照保存了什么？
Snapshot将Cloudfront配置保存为一个配置文件，您可以通过[get-distribution-config](https://docs.aws.amazon.com/cli/latest/reference/cloudfront/get-distribution-config.html)获取到同样的配置。我们的解决方案将配置文件保存在S3中，url保存在DynamoDB中。您可以通过调用[list_snapshots api](../../api-reference-guide/snapshot/list_snapshots.md)获取指定分配的所有快照。



### 快照将保存多长时间？
快照将保存在S3存储桶中，不会自动删除。您可以在Web控制台或通过[delete_snapshot api](../../api-reference-guide/snapshot/delete_snapshot.md)删除快照。

### 快照价格是多少？
Cloudfront配置文件是JSON格式，大约3KB。请参考[Cost](cost.md)获取更多信息。


