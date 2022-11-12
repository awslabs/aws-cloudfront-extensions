import * as appsync from '@aws-cdk/aws-appsync-alpha';
import * as cdk from 'aws-cdk-lib';
import { CustomResource, Stack } from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cr from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
import * as path from 'path';
import { CommonProps } from '../cf-common/cf-common-stack';

export class RepoStack extends Stack {
  constructor(scope: Construct, id: string, props?: CommonProps) {
    super(scope, id, props);
    new RepoConstruct(scope, id, props);
  }
}

export class RepoConstruct extends Construct {
  constructor(scope: Construct, id: string, props?: CommonProps) {
    super(scope, id);

    // Create Dynamodb table to store extensions
    const cfExtensionsTable = new dynamodb.Table(this, 'CloudFrontExtensions', {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      partitionKey: { name: 'name', type: dynamodb.AttributeType.STRING },
      pointInTimeRecovery: true,
    });

    // Extensions repository role
    const extDeployerRole = new iam.Role(this, 'ExtDeployerRole', {
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal("lambda.amazonaws.com"),
        new iam.ServicePrincipal("appsync.amazonaws.com"),
        new iam.ServicePrincipal('ec2.amazonaws.com'),
        new iam.ServicePrincipal('edgelambda.amazonaws.com'),
        new iam.ServicePrincipal('cloudfront.amazonaws.com')
      ),
    });

    // Extensions repository policy to access DynamoDB
    const extDDBPolicy = new iam.Policy(this, 'ExtDDBPolicy', {
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          resources: ['*'],
          actions: [
            "dynamodb:*"
          ]
        })
      ]
    });

    // Extensions repository policy to access Lambda
    const extLambdaPolicy = new iam.Policy(this, 'ExtLambdaPolicy', {
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          resources: ['*'],
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
            "logs:PutLogEvents",
            "logs:PutRetentionPolicy",
            "logs:DescribeLogGroups"
          ],
        }),
      ]
    });

    // Policy to deploy an extension
    const extDeploymentPolicy = new iam.Policy(this, 'ExtDeploymentPolicy', {
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          resources: ['*'],
          actions: [
            "cloudformation:*",
            "cloudfront:*",
            "ssm:GetParameters",
            "serverlessrepo:CreateCloudFormationTemplate",
            "serverlessrepo:GetCloudFormationTemplate",
            "serverlessrepo:CreateCloudFormationChangeSet",
            "s3:GetObject",
            "ec2:*",
            "apigateway:*",
            "sqs:*",
            "iam:*",
            "autoscaling:*",
            "cloudwatch:*"
          ]
        })
      ]
    });

    extDeployerRole.attachInlinePolicy(extDDBPolicy);
    extDeployerRole.attachInlinePolicy(extLambdaPolicy);
    extDeployerRole.attachInlinePolicy(extDeploymentPolicy);

    if (props && props.appsyncApi) {
      const extDeployerApi = props?.appsyncApi;

      // AWS Lambda Powertools
      const powertools_layer = lambda.LayerVersion.fromLayerVersionArn(
        this,
        `PowertoolLayer`,
        `arn:aws:lambda:${cdk.Aws.REGION}:017000801446:layer:AWSLambdaPowertoolsPython:16`
      );

      // Deployer lambda in extensions repository
      const extDeployerLambda = new lambda.Function(this, 'ExtDeployerLambda', {
        runtime: lambda.Runtime.PYTHON_3_9,
        handler: 'deployer.lambda_handler',
        timeout: cdk.Duration.seconds(300),
        code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/common/lambda-assets/deployer.zip')),
        role: extDeployerRole,
        memorySize: 512,
        environment: {
          DDB_TABLE_NAME: cfExtensionsTable.tableName,
          EXT_META_DATA_URL: 'https://aws-cloudfront-ext-metadata.s3.amazonaws.com/metadata.csv'
        },
        logRetention: logs.RetentionDays.ONE_WEEK,
        layers: [powertools_layer]
      });

      // Set Deployer Lambda function as a data source for Deployer API
      const deployerLambdaDs = extDeployerApi.addLambdaDataSource('lambdaDatasource', extDeployerLambda);

      deployerLambdaDs.createResolver({
        typeName: "Query",
        fieldName: "listExtensions",
        requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
        responseMappingTemplate: appsync.MappingTemplate.lambdaResult()
      });

      deployerLambdaDs.createResolver({
        typeName: "Query",
        fieldName: "queryByName",
        requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
        responseMappingTemplate: appsync.MappingTemplate.lambdaResult()
      });

      deployerLambdaDs.createResolver({
        typeName: "Mutation",
        fieldName: "syncExtensions",
        requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
        responseMappingTemplate: appsync.MappingTemplate.lambdaResult()
      });

      deployerLambdaDs.createResolver({
        typeName: "Mutation",
        fieldName: "updateDomains",
        requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
        responseMappingTemplate: appsync.MappingTemplate.lambdaResult()
      });

      deployerLambdaDs.createResolver({
        typeName: "Mutation",
        fieldName: "deployExtension",
        requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
        responseMappingTemplate: appsync.MappingTemplate.lambdaResult()
      });

      deployerLambdaDs.createResolver({
        typeName: "Query",
        fieldName: "listCloudFrontDistWithId",
        requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
        responseMappingTemplate: appsync.MappingTemplate.lambdaResult()
      });

      deployerLambdaDs.createResolver({
        typeName: "Query",
        fieldName: "checkSyncStatus",
        requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
        responseMappingTemplate: appsync.MappingTemplate.lambdaResult()
      });

      deployerLambdaDs.createResolver({
        typeName: "Query",
        fieldName: "behaviorById",
        requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
        responseMappingTemplate: appsync.MappingTemplate.lambdaResult()
      });
    }

    // Custom resource to sync extensions once the CloudFormation is completed
    const customResourceLambda = new lambda.Function(this, "SyncExtensions", {
      description: "This lambda function sync the latest extensions to your AWS account.",
      runtime: lambda.Runtime.PYTHON_3_9,
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/common/lambda-assets/custom_resource.zip')),
      handler: "custom_resource.lambda_handler",
      role: extDeployerRole,
      memorySize: 256,
      timeout: cdk.Duration.seconds(300),
      environment: {
        DDB_TABLE_NAME: cfExtensionsTable.tableName,
        EXT_META_DATA_URL: 'https://aws-cloudfront-ext-metadata.s3.amazonaws.com/metadata.csv'
      }
    });

    customResourceLambda.node.addDependency(cfExtensionsTable)

    const customResourceProvider = new cr.Provider(this, 'customResourceProvider', {
      onEventHandler: customResourceLambda,
      logRetention: logs.RetentionDays.ONE_DAY,
    });

    new CustomResource(this, 'SyncExtensionsCustomResource', {
      serviceToken: customResourceProvider.serviceToken,
      resourceType: "Custom::SyncExtensions",
    });


    // Output
    new cdk.CfnOutput(this, 'CloudFront Extensions DynamoDB table', {
      value: cfExtensionsTable.tableName,
      description: "the cloudfront extensions dynamodb table name"
    });


  }
}
