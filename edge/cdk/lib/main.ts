import * as cf from 'aws-cdk-lib/aws-cloudfront';
import { Construct } from 'constructs';
import { IExtensions } from './extensions';

export interface DistributionProps extends cf.DistributionProps { }

export class Distribution extends Construct {
  readonly extensions: IExtensions[] = [];
  constructor(scope: Construct, id: string, props: DistributionProps) {
    super(scope, id);

    new cf.Distribution(this, `${id}Dist`, props);
  }
}
