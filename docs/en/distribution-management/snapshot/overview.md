## Snapshot

A configuration of CloudFront distribution could be very complex, and you may want to save a specific configuration and apply it to current or other distributions in your aws account. This solution allows you to save configuration as “snapshot” so that you can reuse it at any time.

### How does it work?
When you create a snapshot, the solution automatically exports the current distribution configuration file in S3 bucket. A DynamoDB table is used to store the mapping of the config file and the snapshot names. 

### How to work with snapshots?

You can perform the following operations on snapshots:

- [create_snapshot](create_snapshot.md)
- [delete_snapshot](delete_snapshot.md)
- [list_snapshots](list_snapshots.md)
- [diff_cloudfront_snapshot](diff_cloudfront_snapshot.md)
- [get_snapshot_link](get_snapshot_link.md)
- [apply_snapshot](apply-snapshot.md)
- [config_snapshot_tag_update](config_snapshot_tag_update.md)
