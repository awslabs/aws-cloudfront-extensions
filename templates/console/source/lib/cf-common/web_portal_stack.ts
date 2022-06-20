import {Construct} from "constructs";
import {CloudFrontToS3} from "@aws-solutions-constructs/aws-cloudfront-s3";
import {Aws, aws_cloudfront as cloudfront, aws_s3 as s3, aws_s3_deployment as s3d, RemovalPolicy,} from "aws-cdk-lib";
import * as path from "path";
import {AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId} from "aws-cdk-lib/custom-resources";
import {RetentionDays} from "aws-cdk-lib/aws-logs";
import {PolicyStatement} from "aws-cdk-lib/aws-iam";

export interface PortalProps {
 readonly aws_api_key?: string;
 readonly aws_project_region?: string;
 readonly aws_appsync_graphqlEndpoint?: string;
 readonly aws_appsync_region?: string;
 readonly aws_appsync_authenticationType?: string;
 readonly aws_cognito_region?: string;
 readonly aws_user_pools_id?: string;
 readonly aws_user_pools_web_client_id?: string;
}

/**
 * Stack to provision Portal assets and CloudFront Distribution
 */
export class PortalStack extends Construct {
    constructor(scope: Construct, id: string, props: PortalProps) {
        super(scope, id);
        const https_header = "https://";

        // Use cloudfrontToS3 solution constructs
        const portal = new CloudFrontToS3(this, "UI", {
            bucketProps: {
                versioned: true,
                encryption: s3.BucketEncryption.S3_MANAGED,
                accessControl: s3.BucketAccessControl.PRIVATE,
                enforceSSL: true,
                removalPolicy: RemovalPolicy.RETAIN,
                autoDeleteObjects: false,
            },
            cloudFrontDistributionProps: {
                priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL,
                minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2019,
                enableIpv6: false,
                enableLogging: true, //Enable access logging for the distribution.
                comment: `${Aws.STACK_NAME} - Web Console Distribution (${Aws.REGION})`,
                errorResponses: [
                  {
                    httpStatus: 403,
                    responseHttpStatus: 200,
                    responsePagePath: "/index.html",
                  },
                ],
            },
            insertHttpSecurityHeaders: false,
        });

        const portalBucket = portal.s3Bucket as s3.Bucket;
        const portalDist = portal.cloudFrontWebDistribution.node.defaultChild as cloudfront.CfnDistribution;
        const portalUrl = portal.cloudFrontWebDistribution.distributionDomainName;
        const configFn = 'aws-exports.json';
        // upload static web assets
        new s3d.BucketDeployment(this, "DeployWebAssets", {
          sources: [
            s3d.Source.asset(path.join(__dirname, "../../../../../portal/build")),
          ],
          destinationBucket: portalBucket,
          prune: false,
        });

        new AwsCustomResource(this, 'WebConfig', {
            logRetention: RetentionDays.ONE_DAY,
            onUpdate: {
                action: 'putObject',
                parameters: {
                    Body: JSON.stringify(props),
                    Bucket: portalBucket.bucketName,
                    CacheControl: 'max-age=0, no-cache, no-store, must-revalidate',
                    ContentType: 'application/json',
                    Key: configFn,
                },
                service: 'S3',
                physicalResourceId: PhysicalResourceId.of('config'),
            },
            policy: AwsCustomResourcePolicy.fromStatements([
                new PolicyStatement({
                    actions: ['s3:PutObject'],
                    resources: [portalBucket.arnForObjects(configFn)]
                })
            ])
        });

    }


}