import * as cdk from 'aws-cdk-lib';
import { CustomResource } from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cr from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
import * as path from 'path';
import { bumpFunctionVersion, IExtensions, ServerlessApp } from '../../lib';


export interface ResizeImageProps {
  readonly fitType: string;
  readonly bucketName: string;
}

export class ResizeImage extends ServerlessApp implements IExtensions {
  readonly functionArn: string;
  readonly functionVersion: lambda.Version;
  readonly eventType: cloudfront.LambdaEdgeEventType;
  constructor(scope: Construct, id: string, props: ResizeImageProps) {
    super(scope, id, {
      applicationId: 'arn:aws:serverlessrepo:us-east-1:418289889111:applications/resize-picture',
      semanticVersion: '1.0.2',
      parameters: {
        FitType: props.fitType,
        S3BucketName: props.bucketName
      },
    });
    const stack = cdk.Stack.of(scope);
    this.functionArn = this.resource.getAtt('Outputs.ResizeLambdaEdgeFunction').toString();
    this.functionVersion = bumpFunctionVersion(stack, id, this.functionArn);
    this.eventType = cloudfront.LambdaEdgeEventType.VIEWER_REQUEST;
  }
}

export class ResizeImageStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    this.templateOptions.description = "(SO8123) - Resize pictures on the fly";

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

    const fitTypePara = new cdk.CfnParameter(this, 'FitType', {
      description: 'How to fit the image. Valid values are cover(Preserving aspect ratio, ensure the image covers both provided dimensions by cropping to fit); contain(Preserving aspect ratio, contain within both provided dimensions using letterboxing where necessary); fill(Ignore the aspect ratio of the input and stretch to both provided dimensions); inside(Preserving aspect ratio, resize the image to be as large as possible while ensuring its dimensions are less than or equal to both those specified), outside (Preserving aspect ratio, resize the image to be as small as possible while ensuring its dimensions are greater than or equal to both those specified)',
      type: 'String',
      default: 'fill'
    });

    const s3BucketName = new cdk.CfnParameter(this, 'S3BucketName', {
      description: 'S3 bucket name to store the images',
      type: 'String',
    }); 

    const resizeImageInst = new ResizeImage(this, 'ResizeImg', {
      fitType: fitTypePara.valueAsString,
      bucketName: s3BucketName.valueAsString 
    });

    const lambdaRole = new iam.Role(this, 'ResizeLambdaRole', {
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal("lambda.amazonaws.com"),
      ),
    });

    const lambdaPolicy = new iam.Policy(this, 'ResizeLambdaPolicy', {
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
    const cloudfrontPolicy = new iam.Policy(this, 'ResizeCloudFrontPolicy', {
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

    // Custom resource to deploy Lambda@Edge 
    const crLambda = new lambda.Function(this, "LEDeployer", {
      description: "This lambda function deploy Lambda@Edge onto CloudFront distribution",
      runtime: lambda.Runtime.PYTHON_3_9,
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lib/lambda/custom_resource_lambda')),
      handler: "custom_resource.lambda_handler",
      role: lambdaRole,
      memorySize: 512,
      timeout: cdk.Duration.minutes(15),
      environment: {
        LE_ARN: resizeImageInst.functionArn,
        CF_DIST_ID: cfDistId.valueAsString,
        CF_BEHAVIOR: behavior.valueAsString,
        CF_STAGE: stage.valueAsString,
      }
    });

    crLambda.node.addDependency(resizeImageInst)

    const resizeProvider = new cr.Provider(this, 'ResizeProvider', {
      onEventHandler: crLambda,
      logRetention: logs.RetentionDays.ONE_DAY,
    });

    new CustomResource(this, 'ResizeCustomResource', {
      serviceToken: resizeProvider.serviceToken,
      resourceType: "Custom::ResizeImage",
    });

    // Output
    new cdk.CfnOutput(this, "FunctionARN", {
      value: resizeImageInst.functionArn
    });

  }

}
