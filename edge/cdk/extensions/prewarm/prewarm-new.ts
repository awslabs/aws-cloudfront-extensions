import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {Aws, aws_iam, NestedStack, StackProps} from 'aws-cdk-lib';
import { CfnParameter } from 'aws-cdk-lib';
import { LambdaIntegration, RestApi, ResourceBase } from 'aws-cdk-lib/aws-apigateway';
import {PolicyStatement, Effect, ServicePrincipal, User, Policy, Role} from 'aws-cdk-lib/aws-iam';
import { Database } from './new-prewarm/database/ddb-stack';
import { API } from './new-prewarm/api/api-stack';
import { Lambda } from './new-prewarm/lambda/lambda-stack';
import { SQS } from './new-prewarm/sqs/sqs-stack';
import { ASG } from './new-prewarm/asg/asg-stack';
import { Bucket } from './new-prewarm/bucket/s3-bucket-stack';
import * as path from 'path';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as ec2 from "aws-cdk-lib/aws-ec2";
import {GatewayVpcEndpoint, InterfaceVpcEndpoint} from "aws-cdk-lib/aws-ec2";


export interface NewPrewarmStackProps extends StackProps {
  needInit: string;
  // 定义嵌套堆栈需要的参数
  envName: string;
  vpcId: string;
  subnetIds: string;
  securityGroupId: string;
  key: string;
  vpcEndpointId: string;
}

export class NewPrewarmStack extends NestedStack {
  constructor(scope: Construct, id: string, props: NewPrewarmStackProps) {
    super(scope, id, props);
    this.templateOptions.description = "(SO8138) - Prewarm resources in specific pop new";

    const region = Aws.REGION;
    const account = Aws.ACCOUNT_ID;
    const eventRuleName = 'SCHEDULER_TO_STOP_PREWARM';

    const envName = props.envName;

    const vpcId = props.vpcId;
    const subnetIds = props.subnetIds.split(",");
    const securityGroupId = props.securityGroupId
    const key = props.key
    const vpcEndpointId = props.vpcEndpointId
    let publicSubnetIds: string[] = []

    const isPrivateApi = this.node.tryGetContext('is_private');

    const needInit = props.needInit;
    if(needInit === 'true'){
      const vpc = new ec2.Vpc(this, 'NewPrewarmVpc', {
        maxAzs: 2,
        subnetConfiguration: [
          {
            cidrMask: 24,
            name: 'ingress',
            subnetType: ec2.SubnetType.PUBLIC,
          }
        ]
      });
      const vpcId = vpc.vpcId
      const securityGroup = new ec2.SecurityGroup(this, 'NewPrewarmSG', { vpc });
      // 允许来自安全组自身的流量
      securityGroup.addIngressRule(securityGroup, ec2.Port.allTraffic());
      const securityGroupId = securityGroup.securityGroupId
      publicSubnetIds = vpc.publicSubnets.map(subnet => subnet.subnetId);
      const keyPair = new ec2.KeyPair(this, 'NewPrewarmKeyPair', {});
      const key = keyPair.keyPairName

      // 创建S3 Gateway Endpoint
      new GatewayVpcEndpoint(this, 'S3Endpoint', {
          vpc: vpc,
          service: ec2.GatewayVpcEndpointAwsService.S3,
          subnets:  [{subnetType: ec2.SubnetType.PUBLIC}],
      });

      // 创建SQS Interface VPC Endpoint
      new InterfaceVpcEndpoint(this, 'SQSEndpoint', {
          vpc: vpc,
          service: ec2.InterfaceVpcEndpointAwsService.SQS,
          privateDnsEnabled: true,
          subnets: { subnetType: ec2.SubnetType.PUBLIC }
      });

      // 创建DynamoDB Interface VPC Endpoint
      new GatewayVpcEndpoint(this, 'DynamoDBEndpoint', {
          vpc: vpc,
          service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
          subnets:  [{ subnetType: ec2.SubnetType.PUBLIC }]
      });

      if(isPrivateApi != undefined){
        // 如果需要部署为私有API，则创建API Gateway Interface VPC Endpoint
        const executeApiEndpoint = new InterfaceVpcEndpoint(this, 'ExecuteApiEndpoint', {
            vpc: vpc,
            service: ec2.InterfaceVpcEndpointAwsService.APIGATEWAY,
            privateDnsEnabled: true,
            subnets: { subnetType: ec2.SubnetType.PUBLIC }
        });
        const vpcEndpointId = executeApiEndpoint.vpcEndpointId
      }
    }

    const bucket = new Bucket(this, 'bucket', {
      account: account,
      region: region,
      envNameString: envName,
    });

    const sqs = new SQS(this, 'task_queue', { envNameString: envName });

    const database = new Database(this, 'database', { envNameString: envName });

    const params = {
      securityGroupId: securityGroupId,
      vpcId: vpcId,
      subnetIds: publicSubnetIds,
      key: key,
      region: region,
      sourceCode: `s3://${bucket.bucket.bucketName}/code/`,
      queueUrl: sqs.prewarmTaskQueue.queueUrl,
      taskDynamodbName: database.taskTable.tableName,
    };

    const asg = new ASG(this, 'asg', { envNameString: envName, params: params });
    asg.agentRole.addToPrincipalPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['sqs:ReceiveMessage', 'sqs:DeleteMessage', 'sqs:ChangeMessageVisibility'],
        resources: [sqs.prewarmTaskQueue.queueArn],
      })
    );
    asg.agentRole.addToPrincipalPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['dynamodb:PutItem'],
        resources: [database.taskTable.tableArn],
      })
    );
    bucket.bucket.grantRead(asg.agentRole);

    // lambda function
    const lambdaFunctions = new Lambda(this, 'lambda_functions', { envNameString: envName });

    lambdaFunctions.apiPostPrewarm.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['autoscaling:UpdateAutoScalingGroup'],
        resources: [asg.asg.autoScalingGroupArn],
      })
    );

    bucket.bucket.grantWrite(lambdaFunctions.apiPostPrewarm);

    lambdaFunctions.getUrlSize.addEventSource(database.requestTableDDbSource);
    lambdaFunctions.getDownloadSize.addEventSource(database.taskTableDDbSource);
    lambdaFunctions.insertTaskToQueue.addEventSource(database.popTableDDbSource);
    lambdaFunctions.generateErrorReport.addEventSource(database.requestTableUpdateDDbSource);

    database.requestTable.grantWriteData(lambdaFunctions.apiPostPrewarm);
    lambdaFunctions.apiPostPrewarm.addEnvironment('BUCKET_NAME', bucket.bucket.bucketName);
    lambdaFunctions.apiPostPrewarm.addEnvironment('ASG_NAME', asg.asg.autoScalingGroupName);
    lambdaFunctions.apiPostPrewarm.addEnvironment('REQUEST_TABLE_NAME', database.requestTable.tableName);
    lambdaFunctions.apiPostPrewarm.addEnvironment('LAMBDA_SET_ASG_ARN', lambdaFunctions.setAsgCapacity.functionArn);
    lambdaFunctions.apiPostPrewarm.addEnvironment('EVENT_RULE_NAME', eventRuleName);
    lambdaFunctions.apiPostPrewarm.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['events:PutRule', 'events:PutTargets'],
        resources: ['*'],
      })
    );

    database.requestTable.grantReadWriteData(lambdaFunctions.getUrlSize)
    lambdaFunctions.getUrlSize.addEnvironment("REQUEST_TABLE_NAME", database.requestTable.tableName)
    bucket.bucket.grantReadWrite(lambdaFunctions.getUrlSize)

    database.requestTable.grantReadWriteData(lambdaFunctions.getPopIp)
    database.popTable.grantReadWriteData(lambdaFunctions.getPopIp)
    lambdaFunctions.getPopIp.addEnvironment("REQUEST_TABLE_NAME", database.requestTable.tableName)
    lambdaFunctions.getPopIp.addEnvironment("POP_TABLE_NAME", database.popTable.tableName)

    database.requestTable.grantReadWriteData(lambdaFunctions.insertTaskToQueue)
    database.popTable.grantReadWriteData(lambdaFunctions.insertTaskToQueue)
    sqs.prewarmTaskQueue.grantSendMessages(lambdaFunctions.insertTaskToQueue)
    lambdaFunctions.insertTaskToQueue.addEnvironment("REQUEST_TABLE_NAME",database.requestTable.tableName)
    lambdaFunctions.insertTaskToQueue.addEnvironment("TASK_SQS_URL",sqs.prewarmTaskQueue.queueUrl)
    lambdaFunctions.insertTaskToQueue.addEnvironment("POP_TABLE_NAME", database.popTable.tableName)
    bucket.bucket.grantReadWrite(lambdaFunctions.insertTaskToQueue)

    database.requestTable.grantReadWriteData(lambdaFunctions.getDownloadSize)
    lambdaFunctions.getDownloadSize.addEnvironment("REQUEST_TABLE_NAME", database.requestTable.tableName)

    database.taskTable.grantReadData(lambdaFunctions.generateErrorReport)
    bucket.bucket.grantReadWrite(lambdaFunctions.generateErrorReport)
    lambdaFunctions.generateErrorReport.addEnvironment("TASK_TABLE_NAME", database.taskTable.tableName)

    sqs.prewarmTaskQueue.grantPurge(lambdaFunctions.setAsgCapacity)
    lambdaFunctions.setAsgCapacity.addEnvironment("TASK_SQS_URL", sqs.prewarmTaskQueue.queueUrl)
    lambdaFunctions.setAsgCapacity.addEnvironment("ASG_NAME", asg.asg.autoScalingGroupName)
    lambdaFunctions.setAsgCapacity.addEnvironment("REQUEST_TABLE_NAME", database.requestTable.tableName)
    database.requestTable.grantReadWriteData(lambdaFunctions.setAsgCapacity)
    lambdaFunctions.setAsgCapacity.addToRolePolicy(new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['autoscaling:UpdateAutoScalingGroup'],
        resources: [asg.asg.autoScalingGroupArn],
      })
    );

    // grant event_asg_capacity_permission
    lambdaFunctions.setAsgCapacity.addPermission(
        'event_asg_capacity_permission',
        {
            principal: new ServicePrincipal('events.amazonaws.com'),
            sourceArn: `arn:aws:events:${region}:${account}:rule/${eventRuleName}`
        }
    );

    // grant get_asg_capacity lambda function permission
    lambdaFunctions.getAsgCapacity.addEnvironment('ASG_NAME', asg.asg.autoScalingGroupName);
    lambdaFunctions.getAsgCapacity.addToRolePolicy(
        new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ['autoscaling:DescribeAutoScalingGroups'],
            resources: ['*']
        })
    );

    // grant prewarm_progress_query lambda function permission
    lambdaFunctions.prewarmProgressQuery.addEnvironment('ASG_NAME', asg.asg.autoScalingGroupName);
    lambdaFunctions.prewarmProgressQuery.addEnvironment('REQUEST_TABLE_NAME', database.requestTable.tableName);
    lambdaFunctions.prewarmProgressQuery.addEnvironment('TASK_SQS_URL', sqs.prewarmTaskQueue.queueUrl);

    database.requestTable.grantReadData(lambdaFunctions.prewarmProgressQuery);
    sqs.prewarmTaskQueue.grantConsumeMessages(lambdaFunctions.prewarmProgressQuery);

    lambdaFunctions.prewarmProgressQuery.addToRolePolicy(
        new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ['cloudwatch:GetMetricData', 'cloudwatch:GetMetricStatistics', 'cloudwatch:ListMetrics'],
            resources: ['*']
        })
    );

    // grant get_prewarm_summary lambda function permission
    lambdaFunctions.getPrewarmSummary.addEnvironment('REQUEST_TABLE_NAME', database.requestTable.tableName);
    lambdaFunctions.getPrewarmSummary.addEnvironment('REQUEST_POP_TABLE_NAME', database.popTable.tableName);
    lambdaFunctions.getPrewarmSummary.addEnvironment('TASK_TABLE_NAME', database.taskTable.tableName);

    database.requestTable.grantReadData(lambdaFunctions.getPrewarmSummary);
    database.popTable.grantReadData(lambdaFunctions.getPrewarmSummary);
    database.taskTable.grantReadData(lambdaFunctions.getPrewarmSummary);
    bucket.bucket.grantRead(lambdaFunctions.getPrewarmSummary);


    const api = new API(this, 'api', {
      envNameString: envName,
      vpcEndpointId: vpcEndpointId,
      isPrivate: isPrivateApi,
    });

    const apiPrewarmResource = api.api.root.addResource('prewarm');
    const apiPostPrewarmIntegration = new LambdaIntegration(lambdaFunctions.apiPostPrewarm);
    const apiGetPrewarmIntegrationProgress = new LambdaIntegration(lambdaFunctions.prewarmProgressQuery);

    const apiPrewarmResourceInstances = api.api.root.addResource('instances');
    const apiPostPrewarmIntegrationInstances = new LambdaIntegration(lambdaFunctions.setAsgCapacity);
    const apiGetPrewarmIntegrationInstancesGet = new LambdaIntegration(lambdaFunctions.getAsgCapacity);

    const apiPrewarmResourceSummary = api.api.root.addResource('summary');
    const apiGetPrewarmSummary = new LambdaIntegration(lambdaFunctions.getPrewarmSummary);

    if (isPrivateApi === undefined) {
      apiPrewarmResource.addMethod('POST', apiPostPrewarmIntegration, { apiKeyRequired: true });
      apiPrewarmResource.addMethod('GET', apiGetPrewarmIntegrationProgress, { apiKeyRequired: true });
      apiPrewarmResourceInstances.addMethod('POST', apiPostPrewarmIntegrationInstances, { apiKeyRequired: true });
      apiPrewarmResourceInstances.addMethod('GET', apiGetPrewarmIntegrationInstancesGet, { apiKeyRequired: true });
      apiPrewarmResourceSummary.addMethod('GET', apiGetPrewarmSummary, { apiKeyRequired: true });
    } else {
      apiPrewarmResource.addMethod('POST', apiPostPrewarmIntegration);
      apiPrewarmResource.addMethod('GET', apiGetPrewarmIntegrationProgress);
      apiPrewarmResourceInstances.addMethod('POST', apiPostPrewarmIntegrationInstances);
      apiPrewarmResourceInstances.addMethod('GET', apiGetPrewarmIntegrationInstancesGet);
      apiPrewarmResourceSummary.addMethod('GET', apiGetPrewarmSummary);
    }

    if (bucket.bucket.bucketName != undefined) {
      this.uploadAgentToS3(this, bucket.bucket);
    }
  }

  private uploadAgentToS3(scope: Construct, s3_bucket: s3.Bucket) {
    const folderKey = 'code/';
    console.log(__dirname);
    const modelPath = path.resolve(__dirname, 'new-prewarm/', 'lambda/', 'lambda_agent');
    new s3deploy.BucketDeployment(scope, 'DeployLocalAgentFile', {
      sources: [s3deploy.Source.asset(modelPath)],
      destinationBucket: s3_bucket,
      destinationKeyPrefix: folderKey,
      retainOnDelete: false,
    });
  }

  private createBaseRole(){
    const prewarmBuilderUser = new Role(this, 'prewarm-builder', {
      roleName: 'prewarm-builder',
      assumedBy: new ServicePrincipal('cloudformation.amazonaws.com'),
    });

    const policy = new Policy(this, 'NewPrewarmStackPolicy', {
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            "sts:AssumeRole",
            "iam:DeleteRole",
            "iam:DetachRolePolicy",
            "iam:GetRole",
            "iam:CreateRole",
            "iam:AttachRolePolicy",
            "iam:DeleteRolePolicy",
            "iam:PutRolePolicy"
          ],
          resources: [
            "arn:aws:iam::*:policy/*",
            "arn:aws:iam::*:role/cdk-*"
          ],
        }),
        new PolicyStatement({
          sid: "Statement1",
          effect: Effect.ALLOW,
          actions: [
            "cloudformation:DescribeStacks",
            "cloudformation:CreateChangeSet",
            "cloudformation:DescribeChangeSet",
            "cloudformation:ExecuteChangeSet",
            "cloudformation:DescribeStackEvents",
            "cloudformation:DeleteChangeSet",
            "cloudformation:GetTemplate"
          ],
          resources: [
            `arn:aws:cloudformation:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:stack/CDKToolkit/*`,
          ]
        }),
        new PolicyStatement({
          sid: "Statement2",
          effect: Effect.ALLOW,
          actions: [
            "s3:CreateBucket",
            "s3:DeleteBucket",
            "s3:PutBucketPolicy",
            "s3:DeleteBucketPolicy",
            "s3:PutBucketPublicAccessBlock",
            "s3:PutBucketVersioning",
            "s3:PutEncryptionConfiguration",
            "s3:PutLifecycleConfiguration"
          ],
          resources: [
            "arn:aws:s3:::cdk-*"
          ]
        }),
        new PolicyStatement({
          sid: "Statement2",
          effect: Effect.ALLOW,
          actions: [
            "ecr:SetRepositoryPolicy",
            "ecr:GetLifecyclePolicy",
            "ecr:PutImageScanningConfiguration",
            "ecr:DescribeRepositories",
            "ecr:CreateRepository",
            "ecr:DeleteRepository",
            "ecr:PutLifecyclePolicy"
          ],
          resources: [
            `arn:aws:ecr:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:repository/cdk-*`,
          ]
        }),
        new PolicyStatement({
          sid: "Statement2",
          effect: Effect.ALLOW,
          actions: [
            "ssm:GetParameter*",
            "ssm:PutParameter*",
            "ssm:DeleteParameter*"
          ],
          resources: [
            `arn:aws:ssm:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:parameter/cdk-bootstrap/*`,
          ]
        })
      ]
    });
    prewarmBuilderUser.attachInlinePolicy(policy);
  }
}