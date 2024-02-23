import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { RemovalPolicy, CfnOutput } from 'aws-cdk-lib';
import { DeployLambdaEdge } from './deploy-lambd-edge-construct';
import { WafCloudFrontStack } from './wafv2-cloudfront-construct';

import {readFileSync} from 'fs';

export class RateLimitCfStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    //cfn parameters
    const cfDistId = new cdk.CfnParameter(this, 'cfDistId', {
      description: 'CloudFront distribution id on which the Lambda@Edge is deployed',
      type: 'String',
      //default: process.env.DISTRIBUTE || "E3O37UQQXPQMPO",
    });
    const rateLimit = new cdk.CfnParameter(this, 'rateLimit', {
      description: 'Total rate limited requests per minute',
      type: 'Number',
      default: process.env.RATE || 30,
    });
    const urlRateLimit = new cdk.CfnParameter(this, 'urlRateLimit', {
      description: 'Url rate limited requests per minute',
      type: 'Number',
      default: process.env.RATE || 10,
    });
    const urlList = new cdk.CfnParameter(this, 'urlList', {
      description: 'The URL list that needs to be protected, separated by comma: \'/foo,/bar\'',
      type: 'String',
      default: process.env.RATE || "/foo,/bar",
    });
    const regionConf = this.node.tryGetContext('ddbregions');
    let regionsList = null;
    if(regionConf !== undefined){
      regionsList = regionConf.split(',');
    }
    const table = new dynamodb.Table(this, 'Request-Rate-Limit-Access', {
      partitionKey: {
        name: 'ip',
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'createAt',
        type: dynamodb.AttributeType.NUMBER
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      replicationRegions: regionsList,
      removalPolicy: RemovalPolicy.DESTROY,
      waitForReplicationToFinish: true,
    });
    const blackIpTable =  new dynamodb.Table(this, 'Black-Ip-List', {
      partitionKey: {
        name: 'ip',
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'createAt',
        type: dynamodb.AttributeType.NUMBER
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      replicationRegions: regionsList,
      removalPolicy: RemovalPolicy.DESTROY,
      waitForReplicationToFinish: true,
    });
    blackIpTable.addGlobalSecondaryIndex({
      indexName: 'secondIndex-createAt-index',
      partitionKey: {
        name: 'secondIndex',
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'createAt',
        type: dynamodb.AttributeType.NUMBER
      },
    });

    const lambdaExecuteRole = new iam.Role(this, 'lambda-execute-role', {
      assumedBy: new iam.CompositePrincipal(new iam.ServicePrincipal("lambda.amazonaws.com"), new iam.ServicePrincipal("edgelambda.amazonaws.com")),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSWAFFullAccess'),
    ]
    });
    const userDataOfLambda = readFileSync('./lambda/rate-limit.js', 'utf8')
    .replace('cf-country-mobile-rate-limit',table.tableName)
    .replace('black-ip-list',blackIpTable.tableName)
    .replace('GLOBAL_RATE_RRRRR', rateLimit.valueAsNumber+'')
    .replace('URL_LIST_RRRRR', urlList.valueAsString)
    .replace('URL_RATE_RRRRR', urlRateLimit.valueAsNumber+'')
    .replace('DDB_GLOBAL_TABLE_REGIONS_RRRRR', this.node.tryGetContext('ddbregions') === undefined?('us-east-1') : this.node.tryGetContext('ddbregions'));

    const RateLimitLambda = new lambda.Function(this, 'RateLimitLambdaEdge', {
      runtime: lambda.Runtime.NODEJS_16_X,    // execution environment
      code: lambda.Code.fromInline(userDataOfLambda),  // code loaded from "lambda" directory
      handler: 'index.handler',
      memorySize: 1024,
      timeout: cdk.Duration.seconds(30),
      role: lambdaExecuteRole,
    });
    // fullaccess to dynamodb
    table.grantFullAccess(RateLimitLambda);
    blackIpTable.grantFullAccess(RateLimitLambda);
    const edgeFuncVersion = RateLimitLambda.currentVersion

    const wafConstruct = new WafCloudFrontStack(this, 'WafCloudFrontStack', {
      ipSetNumber: 10,
      distributionId: cfDistId.valueAsString,
    });

    const UpdateWafLambda = new lambda.Function(this, 'UpdateWafLambda', {
      runtime: lambda.Runtime.NODEJS_16_X,    // execution environment
      code: lambda.Code.fromAsset('lambda'),  // code loaded from "lambda" directory
      handler: 'update-ipset.handler',
      memorySize: 2048,
      timeout: cdk.Duration.seconds(120),
      role: lambdaExecuteRole,
      environment: {
        TABLE_NAME: blackIpTable.tableName,
        WAFV2_IPSETS: JSON.stringify(wafConstruct.ipSets)
      }
    });
    blackIpTable.grantFullAccess(UpdateWafLambda);

    new events.Rule(this, 'UpdateWaf-Schedule-Cronjob', {
      schedule: events.Schedule.cron({ minute: '0/1' }), // Trigger  every min
      targets: [new targets.LambdaFunction(UpdateWafLambda)],
    });

    const cfLambda = new DeployLambdaEdge(this, 'CustomResourceDeploy', {
      funcName: RateLimitLambda.functionName,
      funcVersion: edgeFuncVersion.version,
      distributionId: cfDistId.valueAsString,
      webacl: wafConstruct.waf.attrArn,
    }).cfLambda;
    cfLambda.node.addDependency(RateLimitLambda);
    cfLambda.node.addDependency(wafConstruct);

    new CfnOutput(this, 'DdbTableName', { value: table.tableName });
    new CfnOutput(this, 'BlackIpTableName', { value: blackIpTable.tableName });
    new CfnOutput(this, 'LambdaDeployFunc', { value: cfLambda.functionArn });
    new CfnOutput(this, 'WebAcl', { value: wafConstruct.waf.attrArn });

  }
}
