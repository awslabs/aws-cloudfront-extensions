import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cr from 'aws-cdk-lib/custom-resources';
import { CustomResource } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as path from 'path';


export class TrueClientIpStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    this.templateOptions.description = "(SO8144) - Adds a True-Client-IP header to include the \
    IP address of a client connecting to CloudFront. Without this header, \
    connections from CloudFront to your origin contain the IP address of \
    the CloudFront server making the request to your origin, \
    not the IP address of the client connected to CloudFront.";

    const cfDistId = new cdk.CfnParameter(this, 'cfDistId', {
      description: 'CloudFront distribution id on which the function is deployed',
      type: 'String',
    });

    const behavior = new cdk.CfnParameter(this, 'behavior', {
      description: 'CloudFront behaviors on which the function is deployed',
      type: 'String',
    });

    const stage = new cdk.CfnParameter(this, 'stage', {
      description: 'CloudFront stage on which the function is deployed',
      type: 'String',
    });

    const lambdaRole = new iam.Role(this, 'TrueClientIpLambdaRole', {
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal("lambda.amazonaws.com"),
      ),
    });

    const lambdaPolicy = new iam.Policy(this, 'TrueClientIpLambdaPolicy', {
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          resources: [
            `arn:aws:lambda:*:${cdk.Aws.ACCOUNT_ID}:layer:*`,
            `arn:aws:lambda:*:${cdk.Aws.ACCOUNT_ID}:function:*:*`,
            `arn:aws:lambda:*:${cdk.Aws.ACCOUNT_ID}:layer:*:*`,
            `arn:aws:lambda:*:${cdk.Aws.ACCOUNT_ID}:function:*`,
            `arn:aws:lambda:*:${cdk.Aws.ACCOUNT_ID}:function:*:*`
          ],
          actions: [
            "lambda:*"
          ],
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          resources: [
            `arn:aws:logs:*:${cdk.Aws.ACCOUNT_ID}:log-group:*`,
            `arn:aws:logs:*:${cdk.Aws.ACCOUNT_ID}:log-group:*:log-stream:*`
          ],
          actions: [
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents"
          ],
        }),
      ]
    });

    //TODO: least priviliege
    const cloudfrontPolicy = new iam.Policy(this, 'TrueClientIpCloudFrontPolicy', {
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          resources: ['*'],
          actions: [
            "cloudfront:*",
          ]
        })
      ]
    });

    lambdaRole.attachInlinePolicy(lambdaPolicy);
    lambdaRole.attachInlinePolicy(cloudfrontPolicy);

    // Add a cloudfront Function and deploy it to the live stage
    const cfFunction = new cloudfront.Function(this, 'TrueClientIpCFF', {
      code: cloudfront.FunctionCode.fromFile({
        filePath: path.join(__dirname, './true-client-ip-function.js'),
      }),
    });


    // Custom resource to deploy CFF
    const crLambda = new lambda.Function(this, "CFFDeployer", {
      description: "This lambda function deploy CFF onto CloudFront distribution",
      runtime: lambda.Runtime.PYTHON_3_9,
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lib/lambda/custom_resource')),
      handler: "custom_resource.lambda_handler",
      role: lambdaRole,
      memorySize: 512,
      timeout: cdk.Duration.minutes(15),
      environment: {
        CFF_ARN: cfFunction.functionArn,
        CF_DIST_ID: cfDistId.valueAsString,
        CF_BEHAVIOR: behavior.valueAsString,
        CF_STAGE: stage.valueAsString,
      }
    });

    crLambda.node.addDependency(cfFunction)

    const trueClientIpProvider = new cr.Provider(this, 'TrueClientIpProvider', {
      onEventHandler: crLambda,
      logRetention: logs.RetentionDays.ONE_DAY,
    });

    new CustomResource(this, 'TrueClientIpCustomResource', {
      serviceToken: trueClientIpProvider.serviceToken,
      resourceType: "Custom::TrueClientIp",
    });

    // Output
    new cdk.CfnOutput(this, "FunctionARN", {
      value: cfFunction.functionArn
    });

    new cdk.CfnOutput(this, "AddOriginRequestHeader", {
      value: "You need to add true-client-ip in the origin request policy. Otherwise, CloudFront removes this header before making the request to the origin. The solution will add the header automatically if your CloudFront distribution doesn't have an origin request policy"
    });

  }

}
