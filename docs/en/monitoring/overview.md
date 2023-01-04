## Monitoring
The solution provides two kinds of monitoring: non-real time monitoring and real time monitoring. You can choose one of them to deploy. You can use the solution to view CloudFront traffic metrics via built-in dashboard or via API calls.

The solution uses Athena to query CloudFront logs, if this is first time you use Athena in the region, you are required to specify the location for query results in Athena, refer to [link](https://docs.aws.amazon.com/athena/latest/ug/querying.html).

- [Non-real time monitoring with Amazon S3 Standard Logs](non-real-time-monitoring.md)
- [Real time monitoring with Amazon Kinesis](real-time-monitoring.md)
- [Metrics dashboard](./metrics-dashboard.md)


