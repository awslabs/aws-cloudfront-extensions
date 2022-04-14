import * as cdk from 'aws-cdk-lib';
import { EndpointType, LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { bumpFunctionVersion, IExtensions, ServerlessApp } from '../../lib';


/**
 * Construct properties for AntiHotlinking extension
 */
export interface PrewarmProps {
  readonly bucketName: string;
  readonly fileName: string;
  readonly popList: string;
  readonly cfMapping: string;
}

export class Prewarm extends ServerlessApp implements IExtensions {
  readonly functionArn: string;
  readonly functionVersion: lambda.Version;
  readonly eventType: cdk.aws_cloudfront.LambdaEdgeEventType;
  constructor(scope: Construct, id: string, props: PrewarmProps) {
    super(scope, id, {
      applicationId: 'arn:aws:serverlessrepo:us-east-1:418289889111:applications/prewarm',
      semanticVersion: '1.0.5',
      parameters: {
        S3BucketName: props.bucketName,
        S3FileKey: props.fileName,
        PoPList: props.popList,
        CFMapping: props.cfMapping,
      },
    });
    const stack = cdk.Stack.of(scope);
    this.functionArn = this.resource.getAtt('Outputs.PrewarmFunction').toString();
    this.functionVersion = bumpFunctionVersion(stack, id, this.functionArn);
  }
}

export class PrewarmStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    this.templateOptions.description = "(SO8138) - Prewarm";

    const s3BucketName = new cdk.CfnParameter(this, 'S3BucketName', {
      description: 'S3 bucket name to store the file which contains urls to pre-warm. eg. pre-warm-bucket. It will create a new S3 bucket by default',
      type: 'String',
    });

    const s3FileKey = new cdk.CfnParameter(this, 'S3FileKey', {
      description: 'The S3 key of the file which contains urls to pre-warm, eg. Prewarm/urls.txt. The urls in the files should be divided by \n, the file should be stored in an S3 bucket. It will create an empty file by default',
      type: 'String',
    });

    const popList = new cdk.CfnParameter(this, 'PoPList', {
      description: 'The pop which you want to prewarm, it supports multiple value with comma as separator, eg. ATL56-C1, DFW55-C3, SEA19-C3. You can get the pop node id by x-amz-cf-pop header in the request',
      type: 'String',
    });

    const cfMapping = new cdk.CfnParameter(this, 'CFMapping', {
      description: 'If your website has CName, you need to specify the relationship between CName and CloudFront domain name. For example, the CName of d123456789012.cloudfront.net is www.example.com, you need to add this JSON line {"www.example.com":"d123456789012.cloudfront.net"}. Use {} if your website does not use CName.',
      type: 'String',
    });

    const PrewarmBucket = s3.Bucket.fromBucketAttributes(this, 'PrewarmBucket', {
      bucketName: s3BucketName.valueAsString
    })

    const prewarmApp = new Prewarm(this, 'PrewarmFunction', {
      bucketName: s3BucketName.valueAsString,
      fileName: s3FileKey.valueAsString,
      popList: popList.valueAsString,
      cfMapping: cfMapping.valueAsString,
    });

    const importedLambdaFromArn = lambda.Function.fromFunctionArn(
      this,
      'ImportedLambdaFunction',
      prewarmApp.functionArn,
    );

    
    
    new cdk.CfnOutput(this, "Prewarm Lambda function", {
      value: prewarmApp.functionArn
    });

    new cdk.CfnOutput(this, "S3Bucket", {
      value: PrewarmBucket.bucketArn
    });

    new cdk.CfnOutput(this, "File contains urls in S3 bucket", {
      value: s3FileKey.valueAsString
    });

    new cdk.CfnOutput(this, "PoP to prewarm", {
      value: popList.valueAsString
    });


  }



}
