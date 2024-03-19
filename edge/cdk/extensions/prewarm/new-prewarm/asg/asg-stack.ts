import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import { Construct } from 'constructs';
import {RestApi} from "aws-cdk-lib/aws-apigateway";
import {aws_autoscaling} from "aws-cdk-lib";

interface ASGProps {
  envNameString: string;
  params: {
    subnetIds: string;
    securityGroupId: string;
    sourceCode: string;
    keyPair: ec2.IKeyPair;
    vpcId: string;
    region: string;
    queueUrl: string;
    taskDynamodbName: string;
  };
}

export class ASG extends Construct {
  public readonly asg: aws_autoscaling.AutoScalingGroup;
  public readonly agentRole: iam.Role;
  constructor(scope: Construct, id: string, props: ASGProps) {
    super(scope, id);

    const { envNameString, params } = props;
    const publicSubnetIds: string[] = params.subnetIds.split(",");
    const subnets: ec2.ISubnet[] = publicSubnetIds.map((subnetId, index) =>
      ec2.Subnet.fromSubnetId(this, `subnet_${index}`, subnetId)
    );

    const securityGroup = ec2.SecurityGroup.fromSecurityGroupId(this, "SG", params.securityGroupId, {
      mutable: false,
    });

    this.agentRole = new iam.Role(this, "prewarm_agent_role", {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
      roleName: `prewarm_agent_role_${envNameString}`,
    });
    this.agentRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore"));
    //
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'echo "user-data script start>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"',
      'cd /home/ec2-user/',
      'sudo -u ec2-user mkdir agent',
      'cd agent',
      `sudo -u ec2-user aws s3 sync ${params.sourceCode} .`,
      'yes | yum install python3-pip',
      'sudo -u ec2-user pip3 install -r requirements.txt',
      `echo "region=${params.region}" >> /home/ec2-user/agent/config.conf`,
      `echo "queue_url=${params.queueUrl}" >> /home/ec2-user/agent/config.conf`,
      `echo "task_dynamodb_name=${params.taskDynamodbName}" >> /home/ec2-user/agent/config.conf`,
      'sudo -u ec2-user python3 agent.py >/dev/null  2>&1 &',
      'echo "user-data script end>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"',
    );

    const vpc = ec2.Vpc.fromVpcAttributes(this, 'dev_vpc', {
      vpcId: params.vpcId,
      availabilityZones: cdk.Fn.getAzs(),
    });


    const launchTemplate = new ec2.LaunchTemplate(this, "prewarm_launch_template", {
      machineImage: ec2.MachineImage.latestAmazonLinux2({
        cpuType: ec2.AmazonLinuxCpuType.ARM_64,
      }),
      launchTemplateName: `prewarm_launch_template_${envNameString}`,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.C6GN, ec2.InstanceSize.MEDIUM),
      keyPair: params.keyPair,
      associatePublicIpAddress: true,
      securityGroup: securityGroup,
      role: this.agentRole,
      userData: userData,
      blockDevices: [
        {
          deviceName: "/dev/xvda",
          volume: ec2.BlockDeviceVolume.ebs(100, { encrypted: true }),
        },
      ],
    });
    launchTemplate.node.addDependency(securityGroup)
    launchTemplate.node.addDependency(vpc)


    this.asg = new autoscaling.AutoScalingGroup(this, "prewarm_asg", {
      launchTemplate,
      vpc,
      vpcSubnets: {
        subnets: subnets,
      },
      minCapacity: 0,
      maxCapacity: 0,
      autoScalingGroupName: `prewarm_asg_${envNameString}`,
      desiredCapacity: 0,
    });
  }
}
