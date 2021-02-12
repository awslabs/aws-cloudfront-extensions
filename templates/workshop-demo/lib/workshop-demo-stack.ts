import * as cdk from '@aws-cdk/core';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as s3 from '@aws-cdk/aws-s3';
import * as s3deploy from '@aws-cdk/aws-s3-deployment';

export class WorkshopDemoStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: cdk.StackProps = {}) {
    super(scope, id, props);

    const staticSiteBucketName = new cdk.CfnParameter(this, "staticSiteBucketName", {
              type: "String",
              description: "The name of the Amazon S3 bucket where static website content will be stored."});

    // Content bucket
    const siteBucket = new s3.Bucket(this, 'WorkshopSiteBucket', {
      bucketName: staticSiteBucketName.valueAsString,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'error.html',
      publicReadAccess: false,

      // The default removal policy is RETAIN, which means that cdk destroy will not attempt to delete
      // the new bucket, and it will remain in your account until manually deleted. By setting the policy to
      // DESTROY, cdk destroy will attempt to delete the bucket, but will error if the bucket is not empty.
      removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production code
    });
    new cdk.CfnOutput(this, 'Bucket', { value: siteBucket.bucketName });


    // CloudFront distribution that provides HTTPS
    const distribution = new cloudfront.CloudFrontWebDistribution(
      this,
      'WorkshopSiteDistribution',
    {
      originConfigs: [
        {
          customOriginSource: {
            domainName: siteBucket.bucketWebsiteDomainName,
            originProtocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
          },
          behaviors: [{ isDefaultBehavior: true }],
        },
      ],
    });
    new cdk.CfnOutput(this, 'DistributionId', { value: distribution.distributionId });

    new cdk.CfnOutput(this, 'Demo website', { value: distribution.domainName + '/index.html' })

    // Deploy site contents to S3 bucket
    new s3deploy.BucketDeployment(this, 'DeployWebsiteContent', {
      sources: [s3deploy.Source.asset('./site')],
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ['/*'],
    });

  }
}
