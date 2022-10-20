---
title: Apply Snapshot to modify configuration
weight: 3
---

In last section, you associated a SSL certificate with the sample website and add an alternative domain name. The CloudFront distribution is changed, you can see the config difference and rollback the changes using snapshot.

## View configuration difference

1. Navigate to CloudFront Extensions console (you can find the link in the **Outputs** tab of **cloudFrontExtensionsConsole** stack).
2. In the navigation panel, under **Distribution management**, choose **Snapshot**.
   ![Snapshot List Page](/images/snapshot_list_2.png)

3. Choose the **sample website distribution** (you can find it in Outputs tab of **CFExtSampleWorkshop** stack).
4. Choose **Create Snapshot**.
5. In the window that pops up, enter a Snapshot Name (a unique key used to identify this snapshot), and also description.
6. Choose **Create**.
   ![Confirm Snapshot Page](/images/confirm_snapshot_2.png)

7. Click Refresh button to see the newly created snapshot.
   ![Snapshot Complete Page](/images/complete_snapshot_2.png)

8. Choose these two snapshots, click **Actions > Compare** to see the difference between the snapshots.
   ![Snapshot Detail Page](/images/snapshot_compare_1.png)

9. The differences are shown in red, you can see there are two differences, the above one is **Alias**, the below one is **ViewerCertificate**.
   ![Snapshot Detail Page](/images/config_diff.png)


## Rollback configuration

1. Go back to snapshot list page.
   ![Snapshot Complete Page](/images/complete_snapshot_2.png)

2. Choose the first snapshot to rollback, click **Actions > Apply to other distributions**.
   ![Apply in List](/images/apply_trigger.png)

3. Select the sample website distribution (you can find it in Outputs tab of **CFExtSampleWorkshop** stack). Type in **Confirm** and click **Apply** button.
   ![Apply Snapshot](/images/apply_snapshot.png)

4. Go to [CloudFront console](https://us-east-1.console.aws.amazon.com/cloudfront/v3/home?region=us-east-1#/distributions).
5. Choose the sample website distribution.
6. The distribution status is **Deploying** since you have applied the snapshot to it.
   ![Deploying Snapshot](/images/deploying_snapshot.png)

7. Wait until the distribution **Last modified** field changed from **Deploying** to a specific date time.

8. Access the sample website with your domain name again. It will show messages like this. The sample website can't be accessed by your domain name since you have rollback the configuration. But you can still access it by CloudFront domain name (xxx.cloudfront.net).
   ![Rollback Result](/images/rollback_result.png)



## Summary

In this section, you viewed the difference between two snapshots and rollback the configuration of the sample website. By using snapshot, you can easily rollback or copy CloudFront configuration.


{{% notice warning %}}
When you apply a snapshot, the target distribution configuration will be replaced.
{{% /notice %}}

    

