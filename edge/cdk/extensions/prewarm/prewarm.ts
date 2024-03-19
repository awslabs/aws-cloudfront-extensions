#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CfnParameter } from 'aws-cdk-lib';
import { BootstraplessStackSynthesizer } from 'cdk-bootstrapless-synthesizer';
import { NewPrewarmStack, NewPrewarmStackProps } from './prewarm-new';
import { Construct } from 'constructs';

const app = new cdk.App();
export interface CFEPrewarmStackProps extends cdk.StackProps {
  useExistVPC?: boolean;
}
export class CFEPrewarmStackUseExistVPC extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CFEPrewarmStackProps) {
    super(scope, id, props);
    const envName = new CfnParameter(this, 'env', { type: 'String' , default: 'prod'});
    const vpcId = new CfnParameter(this, 'vpc', { type: 'String'});
    const subnetIds = new CfnParameter(this, 'subnet', { type: 'String'});
    const securityGroupId = new CfnParameter(this, 'sg', { type: 'String'});
    const key = new CfnParameter(this, 'key', { type: 'String'});
    const vpcEndpointId = new CfnParameter(this, 'vpce', { type: 'String'});
    const params = {
      useExistVPC: props.useExistVPC,
      envName: envName.valueAsString,
      vpcId: vpcId.valueAsString,
      subnetIds: subnetIds.valueAsString,
      securityGroupId: securityGroupId.valueAsString,
      key: key.valueAsString,
      vpcEndpointId: vpcEndpointId.valueAsString,
    }
    new NewPrewarmStack(this, 'NewPrewarmStackExistVPC', <NewPrewarmStackProps>params);
  }
}

export class CFEPrewarmStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CFEPrewarmStackProps) {
    super(scope, id, props);
    const envName = new CfnParameter(this, 'env', { type: 'String' , default: 'prod'});
    const params = {
      useExistVPC: props.useExistVPC,
      envName: envName.valueAsString,
      vpcId: '',
      subnetIds: '',
      securityGroupId: '',
      key: '',
      vpcEndpointId: '',
    }
    new NewPrewarmStack(this, 'NewPrewarmStackExistVPC', <NewPrewarmStackProps>params);
  }
}

new CFEPrewarmStack(app, 'CFEPrewarmStack', {
      synthesizer: synthesizer(),
      useExistVPC: false
    });
new CFEPrewarmStackUseExistVPC(app, 'CFEPrewarmStackUseExistVPC',{
      synthesizer: synthesizer(),
      useExistVPC: true
    })

app.synth();

function synthesizer() {
  return process.env.USE_BSS ? new BootstraplessStackSynthesizer() : undefined;
}
