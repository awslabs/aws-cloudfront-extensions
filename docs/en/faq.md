# Distribution Management
## Snapshot 
### What is Snapshot saved?
Snapshot save the Cloudfront configuration file, you can get the same cloudfront configuration through CLI: [get-distribution-config](https://docs.aws.amazon.com/cli/latest/reference/cloudfront/get-distribution-config.html). Our solution will save the configuration file in S3 and url in DynamoDB. You can use [list_snapshots api](api-reference-guide/snapshot/list_snapshots.md) to list all snapshots of one distribution. 

### Why need to save Snapshot
Cloudfront configuration is complex, when user spent some time updating the cloudfront configuration, he/she don't want configuration been accidentally updated to wrong configuration. So we provide this Snapshot feature to let user create a snapshot so in the future user can compare the current configuration with snapshot or compare different between any two snapshots. 

### How long will Snapshot been saved?
The snapshot will be saved in S3 bucket and will not automatically been deleted. The snapshot can only be deleted in Web Console or through [delete_snapshot api](api-reference-guide/snapshot/delete_snapshot.md) 

### How much will Snapshot cost?
Cloudfront configuration file is json format and is around 3kb. Since the file is saved in S3, saving around 300000 snapshots will only cost $0.02 a month. 
