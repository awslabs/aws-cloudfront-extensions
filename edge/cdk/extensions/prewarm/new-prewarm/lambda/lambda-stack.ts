import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Duration } from 'aws-cdk-lib/core';
import { Construct } from 'constructs';

interface LambdaProps {
  envNameString: string;
}

export class Lambda extends Construct {
  public readonly apiPostPrewarm: lambda.Function;
  public readonly getUrlSize: lambda.Function;
  public readonly getPopIp: lambda.Function;
  public readonly insertTaskToQueue: lambda.Function;
  public readonly getDownloadSize: lambda.Function;
  public readonly generateErrorReport: lambda.Function;
  public readonly setAsgCapacity: lambda.Function;
  public readonly getAsgCapacity: lambda.Function;
  public readonly prewarmProgressQuery: lambda.Function;
  public readonly getPrewarmSummary: lambda.Function;

  constructor(scope: Construct, id: string, props: LambdaProps) {
    super(scope, id);

    const { envNameString } = props;

    const dnspythonLayer = new lambda.LayerVersion(this, 'dnspython_layer', {
      code: lambda.Code.fromAsset('./new-prewarm/lambda/lambda_layer/dnspython'),
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_12],
      layerVersionName: `dnspython_layer_${envNameString}`,
    });

    this.apiPostPrewarm = new lambda.Function(this, 'api_post_prewarm', {
      runtime: lambda.Runtime.PYTHON_3_12,
      timeout: Duration.seconds(40),
      code: lambda.Code.fromAsset('./new-prewarm/lambda/lambda_function/api_post_prewarm'),
      handler: 'lambda_function.lambda_handler',
      functionName: `prewarm_api_post_prewarm_${envNameString}`,
    });

    this.getUrlSize = new lambda.Function(this, 'get_url_size', {
      runtime: lambda.Runtime.PYTHON_3_12,
      memorySize: 8192,
      timeout: Duration.minutes(10),
      code: lambda.Code.fromAsset('./new-prewarm/lambda/lambda_function/get_url_size'),
      handler: 'lambda_function.lambda_handler',
      functionName: `prewarm_get_url_size_${envNameString}`,
    });

    this.getPopIp = new lambda.Function(this, 'get_pop_ip', {
      runtime: lambda.Runtime.PYTHON_3_12,
      memorySize: 1024,
      timeout: Duration.minutes(10),
      code: lambda.Code.fromAsset('./new-prewarm/lambda/lambda_function/get_pop_ip'),
      handler: 'lambda_function.lambda_handler',
      functionName: `prewarm_get_pop_ip_${envNameString}`,
      layers: [dnspythonLayer],
    });

    this.insertTaskToQueue = new lambda.Function(this, 'insert_tasks_to_queue', {
      runtime: lambda.Runtime.PYTHON_3_12,
      memorySize: 8192,
      timeout: Duration.minutes(10),
      code: lambda.Code.fromAsset('./new-prewarm/lambda/lambda_function/insert_tasks_to_queue'),
      handler: 'lambda_function.lambda_handler',
      functionName: `prewarm_insert_tasks_to_queue_${envNameString}`,
    });

    this.getDownloadSize = new lambda.Function(this, 'get_download_size', {
      runtime: lambda.Runtime.PYTHON_3_12,
      timeout: Duration.minutes(10),
      code: lambda.Code.fromAsset('./new-prewarm/lambda/lambda_function/get_download_size'),
      handler: 'lambda_function.lambda_handler',
      functionName: `prewarm_get_download_size_${envNameString}`,
    });

    this.generateErrorReport = new lambda.Function(this, 'generate_error_report', {
      runtime: lambda.Runtime.PYTHON_3_12,
      timeout: Duration.minutes(10),
      code: lambda.Code.fromAsset('./new-prewarm/lambda/lambda_function/generate_error_report'),
      handler: 'lambda_function.lambda_handler',
      functionName: `prewarm_generate_error_report_${envNameString}`,
    });

    this.setAsgCapacity = new lambda.Function(this, 'prewarm_set_asg_capacity', {
      runtime: lambda.Runtime.PYTHON_3_12,
      timeout: Duration.minutes(5),
      code: lambda.Code.fromAsset('./new-prewarm/lambda/lambda_function/set_asg_capacity'),
      handler: 'lambda_function.lambda_handler',
      functionName: `prewarm_set_asg_capacity_${envNameString}`,
    });

    this.getAsgCapacity = new lambda.Function(this, 'prewarm_get_asg_capacity', {
      runtime: lambda.Runtime.PYTHON_3_12,
      timeout: Duration.minutes(5),
      code: lambda.Code.fromAsset('./new-prewarm/lambda/lambda_function/get_asg_capacity'),
      handler: 'lambda_function.lambda_handler',
      functionName: `prewarm_get_asg_capacity_${envNameString}`,
    });

    this.prewarmProgressQuery = new lambda.Function(this, 'prewarm_progress_query', {
      runtime: lambda.Runtime.PYTHON_3_12,
      timeout: Duration.minutes(5),
      code: lambda.Code.fromAsset('./new-prewarm/lambda/lambda_function/prewarm_progress_query'),
      handler: 'lambda_function.lambda_handler',
      functionName: `prewarm_progress_query_${envNameString}`,
    });

    this.getPrewarmSummary = new lambda.Function(this, 'get_prewarm_summary', {
      runtime: lambda.Runtime.PYTHON_3_12,
      timeout: Duration.minutes(5),
      code: lambda.Code.fromAsset('./new-prewarm/lambda/lambda_function/get_prewarm_summary'),
      handler: 'lambda_function.lambda_handler',
      functionName: `prewarm_get_summary_${envNameString}`,
    });

    this.getPopIp.grantInvoke(this.getUrlSize);
    this.getUrlSize.addEnvironment('TASK_LAMBDA_ARN', this.getPopIp.functionArn);

    this.setAsgCapacity.grantInvoke(this.getDownloadSize);
    this.getDownloadSize.addEnvironment('SET_CAPACTIY_LAMBDA_ARN', this.setAsgCapacity.functionArn);
    this.setAsgCapacity.grantInvoke(this.getPopIp);
    this.getPopIp.addEnvironment('SET_CAPACTIY_LAMBDA_ARN', this.setAsgCapacity.functionArn);
  }
}