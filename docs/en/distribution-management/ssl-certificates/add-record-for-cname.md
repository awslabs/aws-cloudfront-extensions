You can add the CloudFront record for CNAME with your DNS Provider.

1. Log in to [GoDaddy](https://www.godaddy.com/). 
2. In the **Domains* menu**, select **All Domains**.
3. Choose the domain that needs to update CNAME record.
4. Add a new CNAME record, enter the **Name** with the CNAME and the **Data** with the corresponding CloudFront distribution. You should be able to retrieve both values in the SNS message sent by solution.

![cname-value](../../../images/add-record-for-cname.png)



