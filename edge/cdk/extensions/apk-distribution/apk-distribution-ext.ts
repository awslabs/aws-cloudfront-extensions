import * as cdk from 'aws-cdk-lib';
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Aws, Duration } from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import * as path from 'path';
import { CfnApi, CfnDeployment, CfnStage } from 'aws-cdk-lib/aws-apigatewayv2';

export class ApkDistributionStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        this.templateOptions.description = "(SXXX) - Android APK dynamically packaged and distributed";

        const s3BucketName = new cdk.CfnParameter(this, 'S3BucketName', {
            description: 'The S3 bucket name where the source APK is located',
            type: 'String',
        });

        const APPkey = new cdk.CfnParameter(this, 'APPkey', {
            description: 'APPkey is used for the signature and verification of distribution channels. Empty by default, indicating that the request will not be verified',
            type: 'String',
            default: '',
        });

        // Create new VPC with 2 PRIVATE_ISOLATED Subnets
        const vpc = new ec2.Vpc(this, 'VPC', {
            natGateways: 0,
            enableDnsSupport: true,
            subnetConfiguration: [{
                cidrMask: 20,
                name: "apk-distribution",
                subnetType: ec2.SubnetType.PRIVATE_ISOLATED
            }]
        });

        // Add S3 Gateway Endpoint
        vpc.addGatewayEndpoint('S3Endpoint', {
            service: ec2.GatewayVpcEndpointAwsService.S3,
            subnets: [
                { subnetType: ec2.SubnetType.PRIVATE_ISOLATED }
            ]
        });

        // Create S3 Bucket to store distribution package
        const tmpBucket = new s3.Bucket(this, 'TmpBucket');

        // Lambda layer
        const layer = new lambda.LayerVersion(this, 'APKDistributionLayer',{
            code: lambda.Code.fromAsset(path.join(__dirname, './lambda/lib/lambda-assets/apk-distribution-lib.zip')),
            description: 'APK distribution utility',
            compatibleRuntimes: [lambda.Runtime.JAVA_11],
            compatibleArchitectures: [lambda.Architecture.ARM_64],
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });

        // Lambda function
        const fn = new lambda.Function(this, 'APKDistributionFunction', {
            runtime: lambda.Runtime.JAVA_11,
            architecture: lambda.Architecture.ARM_64,
            code: lambda.Code.fromAsset(path.join(__dirname, './lambda/lib/lambda-assets/apk-distribution.zip')),
            handler: 'distribution.Handler::handleRequest',
            description: 'APK distribution',
            environment: {
                BUCKET: s3BucketName.valueAsString,
                TMPBUCKET: tmpBucket.bucketName,
                APPKEY: APPkey.valueAsString,
            },
            memorySize: 2048,
            ephemeralStorageSize: cdk.Size.mebibytes(2048),
            timeout: Duration.seconds(30),
            vpc: vpc,
            logRetention: logs.RetentionDays.THREE_MONTHS,
            layers: [layer]
        });

        // Add policy to access the s3 bucket where the apk store
        fn.addToRolePolicy(
            new iam.PolicyStatement({
                actions:['s3:Get*', 's3:List*'],
                effect: iam.Effect.ALLOW,
                resources: [`arn:aws:s3:::${s3BucketName.valueAsString}`, `arn:aws:s3:::${s3BucketName.valueAsString}/*`],
            }),
        );

        // Add policy to access the s3 bucket where the distribution apk store
        fn.addToRolePolicy(
            new iam.PolicyStatement({
                actions:['s3:*'],
                effect: iam.Effect.ALLOW,
                resources: [tmpBucket.bucketArn, tmpBucket.arnForObjects('*')],
            }),
        );

        // Create api gateway to invoke lambda
        const api = new CfnApi(this, 'apk-distribution-api', {
            name: 'apk-distribution',
            protocolType: 'HTTP',
            description: 'lambda proxy use for api-distribution',
            target: fn.functionArn,
        });

        // Add lambda invoke permission
        new lambda.CfnPermission(this, 'api-gateway-permisstion', {
            action: 'lambda:InvokeFunction',
            functionName: fn.functionArn,
            principal: 'apigateway.amazonaws.com',
            sourceAccount: Aws.ACCOUNT_ID,
            sourceArn: `arn:aws:execute-api:${Aws.REGION}:${Aws.ACCOUNT_ID}:${api.ref}/*`
        });

        // Add api gateway deployment
        const deployment = new CfnDeployment(this, 'api-gateway-deployment', {
            apiId: api.ref
        });

        // Add api gateway stage
        const stage = new CfnStage(this, `api-distribution-stage`, {
            apiId: api.ref,
            autoDeploy: true,
            deploymentId: deployment.ref,
            stageName: '$default',
        });
        
        // Add OAI for CloudFront Access S3
        const oai = new cloudfront.OriginAccessIdentity(this, 'original-identity', {
            comment: 'apk distribution cloudfront OAI',
        });

        // Grant access to cloudfront
        tmpBucket.addToResourcePolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['s3:GetObject'],
            resources: [tmpBucket.arnForObjects('*')],
            principals: [new iam.CanonicalUserPrincipal(oai.cloudFrontOriginAccessIdentityS3CanonicalUserId)],
        }));

        // Create distribution
        const distribution = new cloudfront.CfnDistribution(this, 'apk-distribution-distribution', {
            distributionConfig: {
                enabled: true,
                comment: 'apk distribution',
                origins: [{
                        domainName: tmpBucket.bucketRegionalDomainName,
                        id: 'tmp-apk-s3-bucket-access',
                        s3OriginConfig: {
                            originAccessIdentity: `origin-access-identity/cloudfront/${oai.originAccessIdentityName}`
                        },
                    },
                    {
                        domainName: `${api.ref}.execute-api.${Aws.REGION}.amazonaws.com`,
                        id: 'api-gateway-access',
                        customOriginConfig: {
                            originProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
                        }
                    },],
                defaultCacheBehavior: {
                    allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD.methods,
                    targetOriginId: 'tmp-apk-s3-bucket-access',
                    cachePolicyId: cloudfront.CachePolicy.CACHING_OPTIMIZED.cachePolicyId,
                    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                },
                cacheBehaviors: [{
                    allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD.methods,
                    targetOriginId: 'api-gateway-access',
                    cachePolicyId: cloudfront.CachePolicy.CACHING_DISABLED.cachePolicyId,
                    originRequestPolicyId: cloudfront.OriginRequestPolicy.ELEMENTAL_MEDIA_TAILOR.originRequestPolicyId,
                    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    pathPattern: '/',
                }],
                viewerCertificate: {
                    cloudFrontDefaultCertificate: true,
                },
            }
        });

        // Output
        new cdk.CfnOutput(this, "APK distribution URL", {
            value: distribution.attrDomainName,
            description: "APK distribution URL"
        });

        new cdk.CfnOutput(this, "Solution id", {
            value: "S00000",
            description: "Solution id"
        });
    }
}