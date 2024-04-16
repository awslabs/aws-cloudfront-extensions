import {Construct} from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import {GatewayVpcEndpoint, InterfaceVpcEndpoint} from "aws-cdk-lib/aws-ec2";
import * as cdk from "aws-cdk-lib";
import {CfnCondition, Fn} from "aws-cdk-lib";


interface VPCProps {
  useExistVPC: boolean;
  vpcId: string;
  securityGroupId: string;
  subnetIds: string[];
  key: string;
  envNameString: string;
}

export class VPCStack extends Construct {
  public readonly vpc: ec2.IVpc;
  public readonly securityGroup: ec2.ISecurityGroup;
  public readonly subnetIds: string[];
  public readonly keyPair: ec2.IKeyPair;

  constructor(scope: Construct, id: string, props: VPCProps) {
    super(scope, id);

    const { vpcId, securityGroupId, subnetIds, key, envNameString} = props;

    const useExistVPC = props.useExistVPC;

    if(useExistVPC) {
      this.vpc = ec2.Vpc.fromVpcAttributes(this, 'NewPrewarmUseExistVPC', {
        vpcId: vpcId,
        availabilityZones: cdk.Fn.getAzs(),
      });
      this.securityGroup =  ec2.SecurityGroup.fromSecurityGroupId(this, "NewPrewarmExistSG", securityGroupId, {
        mutable: false,
      });
      this.subnetIds = subnetIds;
      this.keyPair = ec2.KeyPair.fromKeyPairName(this, 'ExistKeyPair', props.key);
    }
    else {
      this.keyPair = new ec2.KeyPair(this, 'NewKeyPair', {});
      this.vpc = new ec2.Vpc(this, 'NewPrewarmVpc', {
      maxAzs: 2,
        subnetConfiguration: [
          {
            cidrMask: 24,
            name: 'ingress',
            subnetType: ec2.SubnetType.PUBLIC,
          }
        ]
      });
      this.securityGroup = new ec2.SecurityGroup(this, 'NewPrewarmSG', { vpc: this.vpc });
      // 允许来自安全组自身的流量
      this.securityGroup.addIngressRule(this.securityGroup, ec2.Port.allTraffic());
      this.subnetIds = this.vpc.publicSubnets.map(subnet => subnet.subnetId);

      // 创建S3 Gateway Endpoint
      const s3Endpoint = new GatewayVpcEndpoint(this, 'NewPrewarmS3Endpoint', {
          vpc: this.vpc,
          service: ec2.GatewayVpcEndpointAwsService.S3,
          subnets:  [{subnetType: ec2.SubnetType.PUBLIC}],
      });

      // 创建SQS Interface VPC Endpoint
      const sqsEndpoint = new InterfaceVpcEndpoint(this, 'NewPrewarmSQSEndpoint', {
          vpc: this.vpc,
          service: ec2.InterfaceVpcEndpointAwsService.SQS,
          privateDnsEnabled: true,
          subnets: { subnetType: ec2.SubnetType.PUBLIC }
      });

      // 创建DynamoDB Interface VPC Endpoint
      const gwEndpoint = new GatewayVpcEndpoint(this, 'NewPrewarmDynamoDBEndpoint', {
          vpc: this.vpc,
          service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
          subnets:  [{ subnetType: ec2.SubnetType.PUBLIC }]
      });
    }
  }
}
