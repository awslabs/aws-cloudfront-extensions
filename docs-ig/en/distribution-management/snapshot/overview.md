## Snapshot

A Snapshot is a CloudFront Distribution configuration. By saving a complex CloudFront Distribution configuration to a Snapshot, the configuration (snapshot)  can be reused to current or other CloudFront Distributions in your AWS account.    

### Why need to save Snapshot

Configuring CloudFront is a complex, time-consuming task. Many misconfiguration or accidentally updated to an incorrect configuration can damage your business. Therefore, the Snapshot feature is provided to allow our client to save a reusable and comparable configuration as a Snapshot. Eventually, our client will benefit from the Snapshot feature to more effectively and efficiently manage the CloudFront.    

### How does it work?

Creating a Snapshot will export the current CloudFront Distribution configuration to a S3 bucket. The solution is using a DynamoDB table to maintain the mapping between the CloudFront configuration file and the snapshot name.

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
Snapshot saves Cloudfront configuration as a configuration file, you can get the same cloudfront configuration through CLI: [get-distribution-config](https://docs.aws.amazon.com/cli/latest/reference/cloudfront/get-distribution-config.html). Our solution will save the configuration file in S3 and url in DynamoDB. You can use [list_snapshots api](../../api-reference-guide/snapshot/list_snapshots.md) to list all snapshots of one distribution. 
 

### How long will Snapshot been saved?
The snapshot will be saved in S3 bucket and will not automatically been deleted. The snapshot can only be deleted in Web Console or through [delete_snapshot api](../../api-reference-guide/snapshot/delete_snapshot.md).

### How much will Snapshot cost?
Cloudfront configuration file is in JSON format and is around 3KB. Refer to [Cost](cost.md) for more details.


