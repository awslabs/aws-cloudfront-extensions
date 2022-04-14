import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

/**
 * Construct properties for ServerlessApp
 */
export interface ServerlessAppProps {
  readonly applicationId: string;
  readonly semanticVersion: string;
  /**
   * The parameters for the ServerlessApp
   */
  readonly parameters?: { [key: string]: string };
}

export class ServerlessApp extends Construct {
  readonly resource: cdk.CfnResource;
  // readonly functionVersionArn: lambda.Version;
  constructor(scope: Construct, id: string, props: ServerlessAppProps) {
    super(scope, id);
    this.resource = new cdk.CfnResource(this, id, {
      type: 'AWS::Serverless::Application',
      properties: {
        Location: {
          ApplicationId: props.applicationId,
          SemanticVersion: props.semanticVersion,
        },
        Parameters: props.parameters,
      },
    });
    cdk.Stack.of(this).templateOptions.transforms = ['AWS::Serverless-2016-10-31'];
  }
}
