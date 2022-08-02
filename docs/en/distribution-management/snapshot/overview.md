## Snapshot

A configuration of CloudFront distribution could be very complex, and you may want to save a specific configuration and apply it to other distributions. This solution allows you to save configuration as “snapshot” so that you can reuse it at any time.

### How does it work?
When you create a snapshot, the solution automatically saves the current distribution configuration in AWS Config service. A DynamoDB table is used to store the mapping of the config and the snapshot names. 

### How to work with snapshots?

You can perform the following operations on snapshots:

- [Publish a snapshot](publish-snapshot.md)
- [Apply a Snapshot to other CloudFront distributions](apply-snapshot.md)
- [Compare two Snapshots](compare-snapshot.md)
- [Delete a Snapshot](delete-snapshot.md)

