import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface BucketProps {
  account: string;
  region: string;
  envNameString: string;
}

export class Bucket extends Construct {
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: BucketProps) {
    super(scope, id);

    const { account, region, envNameString } = props;

    this.bucket = new s3.Bucket(this, 'prewarm_bucket', {
      bucketName: `prewarm-bucket-${account}-${region}-${envNameString}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });
  }
}
