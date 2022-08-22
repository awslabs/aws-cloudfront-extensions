Metrics dashboard is customizable time range for Non-real time or Real time monitoring that you can use to track CloudFront traffic graphical metrics in a single dashboard. The dashboard uses CloudFront standard log or realtime log to get the metrics. The solution provides a metric API if you only need to get the metric data via restful API and don't need the dashboard.

With the Metrics dashboard, you can do the following:

- **View graphed metrics**



    The CloudFront monitoring dashboard displays multiple metrics in each graphical chart for you to reference. Each chart related |one metric in CloudFront Monitoring API.
    
    !!! Note "Note"
        The Graphed metrics type in the dashboard are the same with the CloudFront Monitoring API acquisition type when deploy the solution.

    Please see metrics description in the below list


    |**CloudFront Monitoring API Type**|**Description**|**Window Time**|
    |----------------------|----------------------|--------------------|
    |[Real time traffic metrics](real-time-monitoring.md#metrics)        | Realtime log for CloudFront distribution with 5-min delay |5 minutes|
    |[Non-real time traffic metrics](non-real-time-monitoring.md#metrics)| Non-Realtime log for CloudFront distribution with 1-hour delay |5 minutes|


    You can navigate to the CloudFront monitoring dashboard from the left sidebar of the Web Console under Monitoring, and click distribution (you can find it by CNAMEs) that you want to view in the distribution list and specify a time period in the time picker. The traffic metrics will be show in the graphical charts in the dashboard.

    ![Monitoring Dashboard](../images/monitoring-dashboard.png)

- **Setup monitoring domain list**

    The monitoring domain list includes all tracked CloudFront distributions, this list can be configured in the CloudFormation template parameter during deployment, please see [Non-real time monitoring API deployment](../deployment.md#deployment-steps_2) and [Real time monitoring API deployment](../deployment.md#deployment-steps_3). Once the CloudFormation stack deployed, you can set up/update the domain list in the Metrics dashboard web console.

    !!! Note "Note"
        If you use 'ALL' to monitoring all domains in your AWS account in the deployment parameter, the update domain list function will override this setting if you change the selection in the dashboard.

    1. Log in to the web console.
    2. In the left sidebar, under monitoring, select CloudFront.
    3. Click 'Update Domain List' to open the  configuration window.
    4. In the pop-up window, select existing CloudFront distributions that you want to add the monitoring list.
    5. Choose Apply.

    When the domain list changed, the distributions list in the dashboard will be updated accordingly, the tracked metrics will be displayed in the charts in about 5 minutes.
