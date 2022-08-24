如果创建作业或导入作业失败，您需要清理作业创建的SSL证书和CloudFront分配。

## 在AWS Certificate Manager中清理证书

1. 在**Job Status**页面上，选择**View SSL certificates created in this job**中创建的SSL证书。您将被重定向到证书列表，其中显示在此作业中创建的所有证书。
2. 单击特定证书。您将被重定向到ACM web控制台。
3. 删除证书。
4. 对于步骤1中找到的所有其他证书，请在ACM中删除它们。
5. 重复步骤1以检查此作业中的所有证书是否已清理。


## 清理CloudFront中的分配

1. 在**Job Status**页面上，选择**View distributions created in this job**中创建的分发。您将被重定向到分配列表，其中显示在此作业中创建的所有分配。
2. 选择特定CloudFront分配。
3. 删除分配。
4. 对于步骤1中找到的所有其他分配，请在CloudFront控制台中删除它们。
5. 重复步骤1以检查此作业中的所有分配是否已清理。

