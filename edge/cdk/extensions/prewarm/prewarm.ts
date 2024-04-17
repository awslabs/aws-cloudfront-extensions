#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import {CfnParameter, Token} from 'aws-cdk-lib';
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
    const VPC_ID_PARRERN = '^vpc-[a-f0-9]+$';

    const envName = new CfnParameter(this, 'env', { type: 'String' , default: 'prod'});
    // const vpcId = new CfnParameter(this, 'vpc', { type: 'String'});
    const vpcId = new CfnParameter(this, 'vpc', {
      description: 'Select the virtual private cloud (VPC).',
      type: 'AWS::EC2::VPC::Id',
      allowedPattern: `^${VPC_ID_PARRERN}$`,
      constraintDescription: `VPC id must match pattern ${VPC_ID_PARRERN}`,
    });
    const subnetIds = new CfnParameter(this, 'subnet', {
      description: 'Select the subnet ids.',
      type: 'AWS::EC2::Subnet::Id'
    });

    // const subnetIdString = Token.asList(subnetIds.valueAsList).join(',');

    const securityGroupId = new CfnParameter(this, 'sg', {
      description: 'Select the security group.',
      type: 'AWS::EC2::SecurityGroup::Id',
    });

    const key = new CfnParameter(this, 'key', {
      description: 'Select the keypair name.',
      type: 'AWS::EC2::KeyPair::KeyName',
    });


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
    new NewPrewarmStack(this, 'NewPrewarmStack', <NewPrewarmStackProps>params);
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
