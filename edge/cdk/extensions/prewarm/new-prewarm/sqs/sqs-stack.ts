import * as cdk from 'aws-cdk-lib';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Duration } from 'aws-cdk-lib/core';
import { Construct } from 'constructs';

interface SQSProps {
  envNameString: string;
}

export class SQS extends Construct {
  public readonly prewarmTaskQueue: sqs.Queue;

  constructor(scope: Construct, id: string, props: SQSProps) {
    super(scope, id);

    const { envNameString } = props;

    this.prewarmTaskQueue = new sqs.Queue(this, 'prewarm_task_queue', {
      queueName: `prewarm_task_queue_${envNameString}`,
      visibilityTimeout: Duration.minutes(20),
      encryption: sqs.QueueEncryption.KMS_MANAGED,
    });
  }
}
