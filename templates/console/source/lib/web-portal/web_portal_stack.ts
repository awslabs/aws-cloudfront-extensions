import { Construct } from "constructs";
import { CloudFrontToS3 } from "@aws-solutions-constructs/aws-cloudfront-s3";
import {
    Aws,
    aws_cloudfront as cloudfront,
    aws_s3 as s3,
    aws_s3_deployment as s3d,
    RemovalPolicy,
    Stack,
} from "aws-cdk-lib";
import * as path from "path";
import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from "aws-cdk-lib/custom-resources";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import * as cdk from "aws-cdk-lib";
import * as appsync from "@aws-cdk/aws-appsync-alpha";
import { CommonProps } from "../cf-common/cf-common-stack";

export interface PortalProps extends CommonProps {
    readonly aws_api_key?: string;
    readonly aws_project_region?: string;
    readonly aws_appsync_graphqlEndpoint?: string;
    readonly aws_appsync_region?: string;
    readonly aws_appsync_authenticationType?: string;
    readonly aws_cognito_region?: string;
    readonly aws_user_pools_id?: string;
    readonly aws_user_pools_web_client_id?: string;
    readonly aws_monitoring_url?: string;
    readonly aws_monitoring_api_key?: string;
    readonly aws_monitoring_stack_name?: string;
    readonly build_time?: string;
}

export class WebPortalStack extends Stack {

    constructor(scope: cdk.App, id: string, props: PortalProps) {
        super(scope, id, props);

        new PortalConstruct(this, "WebConsole", props);
    }
}

/**
 * Stack to provision Portal assets and CloudFront Distribution
 */
export class PortalConstruct extends Construct {

    readonly portalBucket: s3.Bucket;

    constructor(scope: Construct, id: string, props: PortalProps) {
        super(scope, id);

        // Use cloudfrontToS3 solution constructs
        const portal = new CloudFrontToS3(this, "UI", {
            bucketProps: {
                versioned: false,
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

        this.portalBucket = portal.s3Bucket as s3.Bucket;
        const portalUrl = portal.cloudFrontWebDistribution.distributionDomainName;

        // Prints out the AppSync GraphQL endpoint to the terminal
        new cdk.CfnOutput(this, "CloudFrontURL", {
            value: portalUrl,
            description: "the url of cloudfront extension console web portal"
        });
        const configFn = 'aws-exports.json';
        const configMonitoringFn = 'aws-monitoring-exports.json';
        // Upload static web assets
        const bucketFile = new s3d.BucketDeployment(this, "DeployWebAssets", {
            sources: [
                s3d.Source.asset(path.join(__dirname, "../../../../../portal/build")),
            ],
            destinationBucket: this.portalBucket,
            prune: false,
        });
        const configLambda = new AwsCustomResource(this, 'WebConfig', {
            logRetention: RetentionDays.ONE_DAY,
            onUpdate: {
                action: 'putObject',
                parameters: {
                    Body: JSON.stringify(props),
                    Bucket: this.portalBucket.bucketName,
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
                    resources: [this.portalBucket.arnForObjects(configFn)]
                })
            ])
        });
        configLambda.node.addDependency(bucketFile);
        const configMonitoringLambda = new AwsCustomResource(this, 'WebConfigMonitoring', {
            logRetention: RetentionDays.ONE_DAY,
            onUpdate: {
                action: 'putObject',
                parameters: {
                    Body: JSON.stringify({
                        'aws_monitoring_url': '',
                        'aws_monitoring_api_key': ''
                    }),
                    Bucket: this.portalBucket.bucketName,
                    CacheControl: 'max-age=0, no-cache, no-store, must-revalidate',
                    ContentType: 'application/json',
                    Key: configMonitoringFn,
                },
                service: 'S3',
                physicalResourceId: PhysicalResourceId.of('config'),
            },
            policy: AwsCustomResourcePolicy.fromStatements([
                new PolicyStatement({
                    actions: ['s3:PutObject'],
                    resources: [this.portalBucket.arnForObjects(configMonitoringFn)]
                })
            ])
        });
        configMonitoringLambda.node.addDependency(bucketFile);
    }


}