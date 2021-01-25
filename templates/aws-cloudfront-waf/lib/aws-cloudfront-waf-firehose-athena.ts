import * as glue from '@aws-cdk/aws-glue';
import * as iam from '@aws-cdk/aws-iam';
import * as kinesisfirehose from '@aws-cdk/aws-kinesisfirehose';
import * as s3 from '@aws-cdk/aws-s3';
import * as cdk from '@aws-cdk/core';

// eslint-disable-next-line no-duplicate-imports
import { Aws } from '@aws-cdk/core';


export interface AWSCloudfrontWafFirehoseAthenaParameters {
  readonly deliveryStreamName: string;
  readonly glueDatabaseName: string;
}


export class AWSCloudfrontWafFirehoseAthena extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props: AWSCloudfrontWafFirehoseAthenaParameters) {
    super(scope, id);

    const deliveryStreamName = props.deliveryStreamName;


    const wafLogBucket = new s3.Bucket(this, 'WafLogBucket');

    const firehoseWAFLogsDeliveryStreamRole = new iam.Role(this, 'FirehoseWAFLogsDeliveryStreamRole', {
      assumedBy: new iam.ServicePrincipal('firehose.amazonaws.com'),
      inlinePolicies: {
        S3Access: new iam.PolicyDocument({
          statements: [new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              's3:AbortMultipartUpload',
              's3:GetBucketLocation',
              's3:GetObject',
              's3:ListBucket',
              's3:ListBucketMultipartUploads',
              's3:PutObject',
            ],
            resources: [
              `arn:${Aws.PARTITION}:s3:::${wafLogBucket.bucketName}`,
              `arn:${Aws.PARTITION}:s3:::${wafLogBucket.bucketName}/*`,
            ],
          })],
        }),
        KinesisAccess: new iam.PolicyDocument({
          statements: [new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              'kinesis:DescribeStream',
              'kinesis:GetShardIterator',
              'kinesis:GetRecords',
            ],
            resources: [
              `arn:${Aws.PARTITION}:kinesis:${Aws.REGION}:${Aws.ACCOUNT_ID}:stream/${deliveryStreamName}`,
            ],
          })],
        }),
        CloudWatchAccess: new iam.PolicyDocument({
          statements: [new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              'logs:PutLogEvents',
            ],
            resources: [
              `arn:${Aws.PARTITION}:logs:${Aws.REGION}:${Aws.ACCOUNT_ID}:log-group:/aws/kinesisfirehose/${deliveryStreamName}:*`,
            ],
          })],
        }),
      },
    });

    new kinesisfirehose.CfnDeliveryStream(this, 'FirehoseWAFLogsDeliveryStream', {
      deliveryStreamName,
      deliveryStreamType: 'DirectPut',
      extendedS3DestinationConfiguration: {
        bucketArn: wafLogBucket.bucketArn,
        bufferingHints: {
          intervalInSeconds: 300,
          sizeInMBs: 5,
        },
        compressionFormat: 'GZIP',
        prefix: 'AWSLogs/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/hour=!{timestamp:HH}/',
        errorOutputPrefix: 'AWSErrorLogs/result=!{firehose:error-output-type}/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/hour=!{timestamp:HH}/',
        roleArn: firehoseWAFLogsDeliveryStreamRole.roleArn,
      },
    });

    const glueAccessLogDB = new glue.Database(this, 'GlueAccessLogsDatabase', {
      databaseName: props.glueDatabaseName,
    });

    new glue.Table(this, 'GlueWafAccessLogsTable', {
      database: glueAccessLogDB,
      tableName: 'waf_access_logs',
      columns: [
        { name: 'timestamp', type: glue.Schema.BIG_INT },
        { name: 'formatversion', type: glue.Schema.INTEGER },
        { name: 'webaclid', type: glue.Schema.STRING },
        { name: 'terminatingruleid', type: glue.Schema.STRING },
        { name: 'terminatingruletype', type: glue.Schema.STRING },
        { name: 'action', type: glue.Schema.STRING },
        { name: 'httpsourcename', type: glue.Schema.STRING },
        { name: 'httpsourceid', type: glue.Schema.STRING },
        { name: 'rulegrouplist', type: glue.Schema.array(glue.Schema.STRING) },
        { name: 'ratebasedrulelist', type: glue.Schema.array(glue.Schema.STRING) },
        { name: 'nonterminatingmatchingrules', type: glue.Schema.array(glue.Schema.STRING) },
        {
          name: 'httprequest',
          type: glue.Schema.struct([
            { name: 'clientip', type: glue.Schema.STRING },
            { name: 'country', type: glue.Schema.STRING },
            {
              name: 'headers',
              type: glue.Schema.array(glue.Schema.struct([
                { name: 'name', type: glue.Schema.STRING },
                { name: 'value', type: glue.Schema.STRING },
              ])),
            },
            { name: 'uri', type: glue.Schema.STRING },
            { name: 'args', type: glue.Schema.STRING },
            { name: 'httpversion', type: glue.Schema.STRING },
            { name: 'httpmethod', type: glue.Schema.STRING },
            { name: 'requestid', type: glue.Schema.STRING },
          ]),
        },
      ],
      dataFormat: glue.DataFormat.JSON,
    });
  }
}