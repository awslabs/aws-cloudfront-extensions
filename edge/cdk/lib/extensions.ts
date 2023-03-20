import * as cf from 'aws-cdk-lib/aws-cloudfront';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';


/**
 * The Extension interface
 */
export interface IExtensions {
  /**
   * Lambda function ARN for this extension
   */
  readonly functionArn: string;
  /**
   * Lambda function version for the function
   */
  readonly functionVersion: lambda.Version;
  /**
   * The Lambda edge event type for this extension
   */
  readonly eventType: cf.LambdaEdgeEventType;
  /**
   * Allows a Lambda function to have read access to the body content.
   *
   * @default false
   */
  readonly includeBody?: boolean;
};

/**
 * Generate a lambda function version from the given function ARN
 * @param scope
 * @param id
 * @param functionArn The lambda function ARN
 * @returns lambda.Version
 */
export function bumpFunctionVersion(scope: Construct, id: string, functionArn: string): lambda.Version {
  return new lambda.Version(scope, `LambdaVersion${id}`, {
    lambda: lambda.Function.fromFunctionArn(scope, `FuncArn${id}`, functionArn),
  });
}

