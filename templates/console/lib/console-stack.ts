import * as cdk from '@aws-cdk/core';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as appsync from '@aws-cdk/aws-appsync';
import * as lambda from '@aws-cdk/aws-lambda';
import * as path from 'path';
import * as logs from '@aws-cdk/aws-logs';
import * as iam from '@aws-cdk/aws-iam';

export class ConsoleStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create Dynamodb table to store extensions
    const cf_extensions_table = new dynamodb.Table(this, 'CloudFrontExtensions', {
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
      ),
    });

    // Extensions repository policy to access DynamoDB
    const extDDBPolicy = new iam.Policy(this, 'ExtDDBPolicy', {
      policyName: 'ExtDDBPolicy',
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          resources: [cf_extensions_table.tableArn],
          actions: [
            "dynamodb:*",
            "iam:CreateServiceLinkedRole",
            "iam:PassRole",
            "iam:GetRole",
            "iam:ListRoles"
          ]
        })
      ]
    });

    // Extensions repository policy to access Lambda
    const extLambdaPolicy = new iam.Policy(this, 'ExtLambdaPolicy', {
      policyName: 'ExtLambdaPolicy',
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

    extDeployerRole.attachInlinePolicy(extDDBPolicy);
    extDeployerRole.attachInlinePolicy(extLambdaPolicy);

    // Deployer API in extensions repository
    const extDeployerApi = new appsync.GraphqlApi(this, 'ExtDeployerApi', {
      name: 'ext-deploy-api',
      schema: appsync.Schema.fromAsset(path.join(__dirname, '../graphql/schema.graphql')),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.IAM,
        },
      },
      xrayEnabled: true,
    });

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
      code: lambda.Code.fromAsset(path.join(__dirname, './lambda-assets/deployer.zip')),
      role: extDeployerRole,
      memorySize: 512,
      environment: {
        DDB_TABLE_NAME: cf_extensions_table.tableName,
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
      fieldName: "deployExtension",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult()
    });

    // Output
    new cdk.CfnOutput(this, "ExtDeployerApiURL", {
      value: extDeployerApi.graphqlUrl
    });
    new cdk.CfnOutput(this, "ExtDeployerApiKey", {
      value: extDeployerApi.apiKey || ''
    });
    new cdk.CfnOutput(this, 'CloudFront Extensions DynamoDB table', {
      value: cf_extensions_table.tableName
    });

  }
}
