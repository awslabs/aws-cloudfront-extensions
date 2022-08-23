## 快照

CloudFront分配中包含了多种配置，您可能希望保存指定配置并将其应用于AWS帐户中的当前CloudFront分配或其他分配。此解决方案允许您将配置保存为“快照”，以便您可以随时重用它。

### 快照是如何工作的？

创建快照时，本解决方案会自动将指定CloudFront分配的配置导出并存储成S3桶中的文件，并将此配置文件和快照名称的映射等信息存储在DynamoDB表中。

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

