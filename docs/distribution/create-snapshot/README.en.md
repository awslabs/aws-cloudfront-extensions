---
title: Create Snapshot 
weight: 1
---

So far, R1 has been completed, we will work on R2 in this section. We need to save the configuration of specific CloudFront distributions, so that it can rollback the configuration or apply the configuration to other CloudFront distributions.


| ID | Description  | Category                   | Status |
|----|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------|--------|
| R1 | It shows different web pages according to the user's browser type, for example, it redirects to page A when the user access it in PC browser, it redirects to page B when the user access it in Android browser, it redirects to page C when the user access it in iPhone browser. | Functional requirement     |    <i class="fa-solid fa-check"></i>    |
| R2 | The configuration of CloudFront distribution need to be saved, so that it can rollback if it has issues in production environment.                                         | Non-functional requirement     |        |
| R3 |      The website needs to have a CName (alternative domain name such as www.amazon.com) instead of xxx.cloudfront.net.                                                                                                                                          | Functional requirement |        |
| R4 | After the website is launched, you need to monitor the metrics such as request number, back-to-origin bandwidth, top url.           | Non-functional requirement |        |

CloudFront Extensions helps you manage CloudFront distribution configuration by creating a snapshot. **A snapshot is the configuration of a CloudFront distribution at a specific time**. After creating a snapshot, you can compare two snapshots, edit a snapshot or reuse the snapshot to other CloudFront distributions in your AWS account.

## Create a snapshot

1. Navigate to CloudFront Extensions console (you can find the link in the **Outputs** tab of **cloudFrontExtensionsConsole** stack).
2. In the navigation panel, under **Distribution management**, choose **Snapshot**.
   ![Snapshot List Page](/images/snapshot_list.png)

3. Choose the **sample website distribution** (you can find it in Outputs tab of **CFExtSampleWorkshop** stack).
4. Choose **Create Snapshot**.
   ![Create Snapshot Page](/images/create_snapshot.png)

5. In the window that pops up, enter a Snapshot Name (a unique key used to identify this snapshot), and also description.
6. Choose **Create**.
   ![Confirm Snapshot Page](/images/confirm_snapshot.png)

7. Click Refresh button to see the newly created snapshot.
   ![Snapshot Complete Page](/images/complete_snapshot.png)

8. Choose the snapshot to see the detailed CloudFront configuration. The snapshot is in JSON format.
   ![Snapshot Detail Page](/images/snapshot_detail.png)


## Summary

In this section, you created a snapshot of sample workshop distribution on CloudFront Extensions console. You can also apply/delete the snapshot or update its description.

Creating a Snapshot will export the current CloudFront Distribution configuration to a S3 bucket. The solution is using a DynamoDB table to maintain the mapping between the CloudFront configuration file and the snapshot name.

You implemented the second requirement (R2 in below table) by snapshot feature.

| ID | Description  | Category                   | Status |
|----|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------|--------|
| R1 | It shows different web pages according to the user's browser type, for example, it redirects to page A when the user access it in PC browser, it redirects to page B when the user access it in Android browser, it redirects to page C when the user access it in iPhone browser. | Functional requirement     |    <i class="fa-solid fa-check"></i>    |
| R2 | The configuration of CloudFront distribution need to be saved, so that it can rollback if it has issues in production environment.                                         | Non-functional requirement     |     <i class="fa-solid fa-check"></i>   |
| R3 |      The website needs to have a CName (alternative domain name such as www.amazon.com) instead of xxx.cloudfront.net.                                                                                                                                          | Functional requirement |        |
| R4 | After the website is launched, you need to monitor the metrics such as request number, back-to-origin bandwidth, top url.           | Non-functional requirement |        |


