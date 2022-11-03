import {aws_iam as iam} from "aws-cdk-lib";



export const lambdaRunPolicy = new iam.PolicyStatement({
    resources: ["*"],
    actions: [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "lambda:GetFunction",
        "lambda:EnableReplication"
    ],
});

export const acm_admin_policy = new iam.PolicyStatement({
    resources: ["*"],
    actions: [
        "acm:AddTagsToCertificate",
        "acm:DescribeCertificate",
        "acm:GetAccountConfiguration",
        "acm:GetCertificate",
        "acm:ImportCertificate",
        "acm:ListCertificates",
        "acm:ListTagsForCertificate",
        "acm:RequestCertificate",
        "acm:DescribeCertificate",
    ],
});

export const ddb_rw_policy = new iam.PolicyStatement({
    resources: ["*"],
    actions: [
        "dynamodb:CreateTable",
        "dynamodb:DescribeTable",
        "dynamodb:DeleteItem",
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:UpdateItem",
        "dynamodb:UpdateTable",
    ],
});

export const stepFunction_run_policy = new iam.PolicyStatement({
    resources: ["*"],
    actions: [
        "states:StartExecution",
        "states:StopExecution",
        "states:SendTaskSuccess",
        "states:SendTaskFailure",
        "states:SendTaskHeartbeat",
    ],
});

export const s3_read_policy = new iam.PolicyStatement({
    resources: ["*"],
    actions: ["s3:GetObject", "s3-object-lambda:GetObject"],
});

export const lambda_rw_policy = new iam.PolicyStatement({
    resources: ["*"],
    actions: ["lambda:InvokeFunction"],
});

export const cloudfront_create_update_policy = new iam.PolicyStatement({
    resources: ["*"],
    actions: [
        "cloudfront:GetDistribution",
        "cloudfront:CreateDistribution",
        "cloudfront:TagResource",
        "cloudfront:GetDistributionConfig",
        "cloudfront:UpdateDistribution",
        "cloudfront:ListTagsForResource",
    ],
});

export const tag_update_policy = new iam.PolicyStatement({
    resources: ["*"],
    actions: [
        "tag:TagResources",
        "tag:UntagResources",
        "tag:GetResources",
        "tag:GetTagKeys",
        "tag:GetTagValues",
    ],
});

export const kms_policy = new iam.PolicyStatement({
    resources: ["*"],
    actions: [
        "kms:GenerateDataKey",
        "kms:Decrypt",
        "kms:Encrypt",
        "kms:GenerateDataKeyPair",
    ],
});

export const stepFunction_loggin_policy = new iam.PolicyStatement({
    resources: ["*"],
    actions: [
        "logs:CreateLogDelivery",
        "logs:GetLogDelivery",
        "logs:UpdateLogDelivery",
        "logs:DeleteLogDelivery",
        "logs:ListLogDeliveries",
        "logs:PutLogEvents",
        "logs:PutResourcePolicy",
        "logs:DescribeResourcePolicies",
        "logs:DescribeLogGroups",
    ],
});

export const sns_update_policy = function (topicArn:string): iam.PolicyStatement {
    return new iam.PolicyStatement({
                                resources: [topicArn],
                                actions: ["sns:Publish"],
                            })
}

