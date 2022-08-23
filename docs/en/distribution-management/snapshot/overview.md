## Snapshot

A configuration of CloudFront distribution could be very complex, and you may want to save a specific configuration and apply it to current or other distributions in your AWS account. This solution allows you to save configuration as “snapshot” so that you can reuse it at any time.

### Why need to save Snapshot
Cloudfront configuration is complex, when user spent some time updating the cloudfront configuration, he/she don't want configuration been accidentally updated to wrong configuration. So we provide this Snapshot feature to let user create a snapshot so in the future user can compare the current configuration with snapshot or compare different between any two snapshots.

### How does it work?
When you create a snapshot, the solution automatically exports the current distribution configuration file in S3 bucket. A DynamoDB table is used to store the mapping of the config file and the snapshot names. 

### How to work with snapshots?

You can perform the following operations on snapshots on web console:

- [Compare snapshot](./compare-snapshot.md)
- [Apply snapshot](./apply-snapshot.md)
- [Publish snapshot](./publish-snapshot.md)
- [Delete snapshot](./delete-snapshot.md)


You can also perform the following operations on snapshots via API:

- [create_snapshot](../../api-reference-guide/snapshot/create_snapshot.md)
- [delete_snapshot](../../api-reference-guide/snapshot/delete_snapshot.md)
- [list_snapshots](../../api-reference-guide/snapshot/list_snapshots.md)
- [diff_cloudfront_snapshot](../../api-reference-guide/snapshot/diff_cloudfront_snapshot.md)
- [get_snapshot_link](../../api-reference-guide/snapshot/get_snapshot_link.md)
- [apply_snapshot](../../api-reference-guide/snapshot/apply-snapshot.md)
- [config_snapshot_tag_update](../../api-reference-guide/snapshot/config_snapshot_tag_update.md)


### What does Snapshot saved?
Snapshot saves Cloudfront configuration as a configuration file, you can get the same cloudfront configuration through CLI: [get-distribution-config](https://docs.aws.amazon.com/cli/latest/reference/cloudfront/get-distribution-config.html). Our solution will save the configuration file in S3 and url in DynamoDB. You can use [list_snapshots api](api-reference-guide/snapshot/list_snapshots.md) to list all snapshots of one distribution. 
 

### How long will Snapshot been saved?
The snapshot will be saved in S3 bucket and will not automatically been deleted. The snapshot can only be deleted in Web Console or through [delete_snapshot api](api-reference-guide/snapshot/delete_snapshot.md).

### How much will Snapshot cost?
Cloudfront configuration file is in JSON format and is around 3KB. Refer to [Cost](cost.md) for more details.


