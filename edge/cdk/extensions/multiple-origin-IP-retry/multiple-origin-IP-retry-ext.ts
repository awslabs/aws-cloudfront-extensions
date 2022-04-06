import * as cf from '@aws-cdk/aws-cloudfront';
import * as lambda from '@aws-cdk/aws-lambda';
import * as cdk from '@aws-cdk/core';
import { bumpFunctionVersion, IExtensions, ServerlessApp } from '../../lib';


/**
 * Construct properties for MultipleOriginIpRetry
 */
export interface MultipleOriginIpRetryProps {
  /**
   * Origin IP list for retry, use semicolon to separate multiple IP addresses
   */
  readonly originIp: string[];

  /**
   * Origin IP list for retry, use semicolon to separate multiple IP addresses
   *
   * @example https or http
   */
  readonly originProtocol: string;
}

/**
 * Failover to alternative origin
 */
export class MultipleOriginIpRetry extends ServerlessApp implements IExtensions {
  readonly functionArn: string;
  readonly functionVersion: lambda.Version;
  readonly eventType: cf.LambdaEdgeEventType;
  constructor(scope: cdk.Construct, id: string, props: MultipleOriginIpRetryProps) {
    super(scope, id, {
      applicationId: 'arn:aws:serverlessrepo:us-east-1:418289889111:applications/multiple-origin-IP-retry',
      semanticVersion: '1.0.2',
      parameters: {
        OriginIPList: props.originIp.join(';'),
        OriginProtocol: props.originProtocol,
      },
    });
    const stack = cdk.Stack.of(scope);
    this.functionArn = this.resource.getAtt('Outputs.MultipleOriginIPRetry').toString();
    this.functionVersion = bumpFunctionVersion(stack, id, this.functionArn);
    this.eventType = cf.LambdaEdgeEventType.ORIGIN_REQUEST;
  }
}