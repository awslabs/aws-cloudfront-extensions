import * as cdk from 'aws-cdk-lib';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import {aws_iam} from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import {RestApi} from "aws-cdk-lib/aws-apigateway";

interface APIProps {
  envNameString: string;
  vpcEndpointId: string;
  isPrivate: string | null;
}

export class API extends Construct {
  public readonly api: RestApi;
  constructor(scope: Construct, id: string, props: APIProps) {
    super(scope, id);

    const apiLogGroup = new logs.LogGroup(this, 'prewarm_api_log_group', {
      logGroupName: `prewarm_api_log_group_${props.envNameString}`,
    });

    const endpointConfiguration: apigateway.EndpointConfiguration = {
      types: [apigateway.EndpointType.REGIONAL],
    };

    let resourcePolicy: aws_iam.PolicyDocument = new aws_iam.PolicyDocument({
      statements: [
        new aws_iam.PolicyStatement({
          effect: aws_iam.Effect.ALLOW,
          actions: ['execute-api:Invoke'],
          resources: ['execute-api:/*'],
          principals: [new aws_iam.StarPrincipal()],
        }),
      ],
    });

    if (props.isPrivate !== null) {
      const vpcEndpoint = ec2.InterfaceVpcEndpoint.fromInterfaceVpcEndpointAttributes(
        this,
        'vpc_endpoint',
        {
          vpcEndpointId: props.vpcEndpointId,
          port: 443,
        }
      );
      const endpointConfiguration: apigateway.EndpointConfiguration = {
        types: [apigateway.EndpointType.PRIVATE],
        vpcEndpoints:[vpcEndpoint]
      };
      resourcePolicy = new aws_iam.PolicyDocument({
        statements: [
          new aws_iam.PolicyStatement({
            effect: aws_iam.Effect.ALLOW,
            actions: ['execute-api:Invoke'],
            resources: ['execute-api:/*'],
            principals: [new aws_iam.StarPrincipal()],
          }),
          new aws_iam.PolicyStatement({
            effect: aws_iam.Effect.DENY,
            actions: ['execute-api:Invoke'],
            resources: ['execute-api:/*'],
            conditions: {
              StringNotEquals: {
                'aws:SourceVpce': props.vpcEndpointId,
              },
            },
            principals: [new aws_iam.StarPrincipal()],
          }),
        ],
      });
    }

    this.api = new apigateway.RestApi(this, 'prewarm_api', {
      restApiName: `prewarm_api_${props.envNameString}`,
      description: 'prewarm api',
      cloudWatchRole: true,
      deploy: true,
      endpointConfiguration,
      deployOptions: {
        accessLogDestination: new apigateway.LogGroupLogDestination(apiLogGroup),
        accessLogFormat: apigateway.AccessLogFormat.clf(),
        throttlingBurstLimit: 10,
        throttlingRateLimit: 100,
      },
      policy: resourcePolicy,
    });

    if (props.isPrivate === null) {
      const apiKey = this.api.addApiKey('prewarm_api_key',{
        apiKeyName: `prewarm_api_key_${props.envNameString}`,
        description: 'prewarm api key',
      });

      new cdk.CfnOutput(this, 'prewarm_api_key_output', {
        value: apiKey.keyId,
        description: 'prewarm api key',
      });

      const usagePlan = this.api.addUsagePlan('prewarm_api_usage_plan', {
        name: `prewarm_api_usage_plan_${props.envNameString}`,
        description: 'prewarm api usage plan',
        throttle: { rateLimit: 10, burstLimit: 10 },
        quota: { limit: 1000, period: apigateway.Period.DAY },
      });

      usagePlan.addApiStage({
        stage: this.api.deploymentStage,
      });
      usagePlan.addApiKey(apiKey);
    }
  }
}