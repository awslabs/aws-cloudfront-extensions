import * as cf from '@aws-cdk/aws-cloudfront';
import * as lambda from '@aws-cdk/aws-lambda';
import * as cdk from '@aws-cdk/core';
import { ServerlessApp, bumpFunctionVersion, IExtensions } from '../../lib';

/**
 * Construct properties for AntiHotlinking extension
 */
export interface AntiHotlinkingProps {
  /**
   * Referer allow list with wildcard(* and ?) support i.e. `example.com` or `exa?ple.*`
   */
  readonly referer: string;
}

export class AntiHotlinking extends ServerlessApp implements IExtensions {
  readonly functionArn: string;
  readonly functionVersion: lambda.Version;
  readonly eventType: cf.LambdaEdgeEventType;
  constructor(scope: cdk.Construct, id: string, props: AntiHotlinkingProps) {
    super(scope, id, {
      applicationId: 'arn:aws:serverlessrepo:us-east-1:418289889111:applications/anti-hotlinking',
      semanticVersion: '1.3.0',
      parameters: {
        RefererList: props.referer,
      },
    });
    const stack = cdk.Stack.of(scope);
    this.functionArn = this.resource.getAtt('Outputs.AntiHotlinking').toString();
    this.functionVersion = bumpFunctionVersion(stack, id, this.functionArn);
    this.eventType = cf.LambdaEdgeEventType.VIEWER_REQUEST;
  }
}