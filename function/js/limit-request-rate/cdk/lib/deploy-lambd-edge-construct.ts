import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cr from 'aws-cdk-lib/custom-resources';

export interface LambdaDeployConstructProps {
    funcName: string,
    funcVersion: string,
    distributionId: string,
    webacl: string
}

export class DeployLambdaEdge extends Construct {

    public readonly cfLambda: lambda.IFunction;

    constructor(scope: Construct, id: string, props: LambdaDeployConstructProps) {
        super(scope, id);

        const lambdaExecuteRole = new iam.Role(this, 'lambda-execute-role', {
            assumedBy: new iam.CompositePrincipal(new iam.ServicePrincipal("lambda.amazonaws.com"), new iam.ServicePrincipal("edgelambda.amazonaws.com")),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
                iam.ManagedPolicy.fromAwsManagedPolicyName('CloudFrontFullAccess'),
                iam.ManagedPolicy.fromAwsManagedPolicyName('AWSLambda_FullAccess')
            ]
        });

    const CustomResourceLambda = new lambda.Function(this, 'AssociaterEdgeAndWafLambda', {
            runtime: lambda.Runtime.NODEJS_16_X,    // execution environment
            code: lambda.Code.fromAsset('lambda'),  // code loaded from "lambda" directory
            handler: 'lambda-cf-associater.handler',
            memorySize: 1024,
            timeout: cdk.Duration.seconds(180),
            role: lambdaExecuteRole,
            environment: {
                funcName: props.funcName,
                funcVersion: props.funcVersion,
                distributionId: props.distributionId,
                webacl: props.webacl
            },
        });

        this.cfLambda = CustomResourceLambda;

        let customResourceExecuteRole = new iam.Role(this, `Custom-Resource-Role`, {
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        });
        customResourceExecuteRole.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['lambda:InvokeFunction'],
            resources: ['*']
        }));

        new cr.AwsCustomResource(this, 'Custom-Resource-Lambda', {
            onCreate: {
                service: 'Lambda',
                action: 'invoke',
                parameters: {
                    FunctionName: CustomResourceLambda.functionName,
                    Payload: '{"phase":"create"}'
                },
                outputPaths: ['Contents.0.Key'],
                physicalResourceId: cr.PhysicalResourceId.of(`create-exec-${Date.now()}`)
            },
            onUpdate: {
                service: 'Lambda',
                action: 'invoke',
                parameters: {
                    FunctionName: CustomResourceLambda.functionName,
                    Payload: '{"phase":"update"}'
                },
                physicalResourceId: cr.PhysicalResourceId.of(`update-exec-${Date.now()}`)

            },
            onDelete: {
                service: 'Lambda',
                action: 'invoke',
                parameters: {
                    FunctionName: CustomResourceLambda.functionName,
                    Payload: '{"phase":"delete"}'
                },
                physicalResourceId: cr.PhysicalResourceId.of(`delete-exec-${Date.now()}`)
            },
            role: customResourceExecuteRole,
            policy: cr.AwsCustomResourcePolicy.fromSdkCalls({ resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE })
        });
    }


}

