#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import {CfnCondition, CfnParameter, Fn, Stack} from 'aws-cdk-lib';
import {BootstraplessStackSynthesizer} from 'cdk-bootstrapless-synthesizer';
import 'source-map-support/register';
import {PrewarmStack, PrewarmStackProps} from './prewarm-ext';
import {NewPrewarmStack, NewPrewarmStackProps} from './prewarm-new';
import {Construct} from "constructs";
import {Effect, Policy, PolicyStatement, User} from "aws-cdk-lib/aws-iam";

const app = new cdk.App();

export class CFEPrewarmStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // const ShowSuccessUrls = new CfnParameter(this, 'ShowSuccessUrls', {
    //   description: 'Show success url list in Prewarm status API (true or false)',
    //   type: 'String',
    //   default: 'false',
    // });
    //
    // const instanceType = new CfnParameter(this, 'InstanceType', {
    //   description: 'EC2 spot instance type to send pre-warm requests',
    //   type: 'String',
    //   default: 'c6a.large',
    // });
    //
    // const threadNumber = new CfnParameter(this, 'ThreadNumber', {
    //   description: 'Thread number to run in parallel in EC2',
    //   type: 'String',
    //   default: '6',
    // });
    //
    // // Create instances of the nested stacks
    // new PrewarmStack(this, 'PrewarmStack', <PrewarmStackProps>{
    //   ShowSuccessUrls: ShowSuccessUrls.valueAsString,
    //   instanceType: instanceType.valueAsString,
    //   threadNumber: threadNumber.valueAsString,
    // });

    const envName = new CfnParameter(this, 'env', { type: 'String' , default: 'prod'});
    const vpcId = new CfnParameter(this, 'vpc', { type: 'String', default: ''});
    const subnetIds = new CfnParameter(this, 'subnet', { type: 'String', default: '' });
    const securityGroupId = new CfnParameter(this, 'sg', { type: 'String', default: '' });
    const key = new CfnParameter(this, 'key', { type: 'String', default: '' });
    const vpcEndpointId = new CfnParameter(this, 'vpce', { type: 'String', default: '' });
    const params = {
      envName: envName.valueAsString,
      vpcId: vpcId.valueAsString,
      subnetIds: subnetIds.valueAsString,
      securityGroupId: securityGroupId.valueAsString,
      key: key.valueAsString,
      vpcEndpointId: vpcEndpointId.valueAsString,
    }
    new NewPrewarmStack(this, 'NewPrewarmStack', <NewPrewarmStackProps>params);
  }
}

new CFEPrewarmStack(app, 'CFEPrewarmStack');
app.synth();

function bssSynth() {
    return process.env.USE_BSS ? new BootstraplessStackSynthesizer() : undefined;
}
