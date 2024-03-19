import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import { Construct } from 'constructs';
import {aws_lambda} from "aws-cdk-lib";

interface DatabaseProps {
  envNameString: string;
}

export class Database extends Construct {
  public readonly requestTable: dynamodb.Table;
  public readonly requestTableDDbSource: lambdaEventSources.DynamoEventSource;
  public readonly requestTableUpdateDDbSource: lambdaEventSources.DynamoEventSource;
  public readonly popTable: dynamodb.Table;
  public readonly popTableDDbSource: lambdaEventSources.DynamoEventSource;
  public readonly taskTable: dynamodb.Table;
  public readonly taskTableDDbSource: lambdaEventSources.DynamoEventSource;

  constructor(scope: Construct, id: string, props: DatabaseProps) {
    super(scope, id);

    const { envNameString } = props;

    // Request Table
    this.requestTable = new dynamodb.Table(this, 'prewarm_request_table', {
      tableName: `prewarm_request_table_${envNameString}`,
      partitionKey: { name: 'req_id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      stream: dynamodb.StreamViewType.NEW_IMAGE,
      pointInTimeRecovery: true,
    });

    this.requestTableDDbSource = new lambdaEventSources.DynamoEventSource(this.requestTable, {
      retryAttempts: 1,
      batchSize: 1,
      startingPosition: lambda.StartingPosition.LATEST,
      filters: [aws_lambda.FilterCriteria.filter({eventName: aws_lambda.FilterRule.isEqual("INSERT")})],
    });

    this.requestTableUpdateDDbSource = new lambdaEventSources.DynamoEventSource(this.requestTable, {
      retryAttempts: 1,
      batchSize: 1,
      startingPosition: lambda.StartingPosition.LATEST,
      filters: [aws_lambda.FilterCriteria.filter({
        dynamodb:{
          NewImage:{
            status:{
              S:["STOPPED", "FINISHED"]
            }
          }
        },
        eventName: aws_lambda.FilterRule.isEqual("MODIFY")})],
    });

    // Pop Table
    this.popTable = new dynamodb.Table(this, 'prewarm_request_pop_table', {
      tableName: `prewarm_request_pop_table_${envNameString}`,
      partitionKey: { name: 'req_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'pop', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      stream: dynamodb.StreamViewType.NEW_IMAGE,
      pointInTimeRecovery: true,
    });

    this.popTableDDbSource = new lambdaEventSources.DynamoEventSource(this.popTable, {
      retryAttempts: 1,
      batchSize: 1,
      startingPosition: lambda.StartingPosition.LATEST,
      filters: [aws_lambda.FilterCriteria.filter({eventName: aws_lambda.FilterRule.isEqual("INSERT")})],
    });

    // Task Table
    this.taskTable = new dynamodb.Table(this, 'prewarm_task_table', {
      tableName: `prewarm_task_table_${envNameString}`,
      partitionKey: { name: 'req_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'url_pop', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      stream: dynamodb.StreamViewType.NEW_IMAGE,
      pointInTimeRecovery: true,
    });

    this.taskTableDDbSource = new lambdaEventSources.DynamoEventSource(this.taskTable, {
      retryAttempts: 1,
      batchSize: 50,
      startingPosition: lambda.StartingPosition.LATEST,
      filters: [aws_lambda.FilterCriteria.filter({eventName: aws_lambda.FilterRule.isEqual("INSERT")})],
    });
  }
}
