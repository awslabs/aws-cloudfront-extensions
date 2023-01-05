import * as appsync from "@aws-cdk/aws-appsync-alpha";
import * as cdk from "aws-cdk-lib";
import { aws_cognito as cognito, StackProps } from "aws-cdk-lib";
import {
  AwsCustomResource,
  AwsCustomResourcePolicy,
  PhysicalResourceId
} from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";
import { NonRealtimeMonitoringStack } from "../lib/monitoring/non-realtime-monitoring-stack";
import { RealtimeMonitoringStack } from "../lib/monitoring/realtime-monitoring-stack";
import { CommonConstruct } from "./cf-common/cf-common-stack";
import { CloudFrontConfigVersionConstruct } from "./config-version/aws-cloudfront-config-version-stack";
import { RepoConstruct } from "./repo/repo-stack";
import { StepFunctionRpTsConstruct } from "./ssl-for-saas/step_function_rp_ts-stack";
import { PortalConstruct } from "./web-portal/web_portal_stack";

interface ConsoleStackProps extends StackProps {
  synthesizer: any;
}

export class ConsoleStack extends cdk.Stack {
  constructor(app: Construct, id: string, props: ConsoleStackProps) {
    super(app, id, props);
    this.templateOptions.description = "(SO8152-ui) - CloudFront Extensions UI";

    // Construct a cognito for auth
    const cognitoUserPool = new cognito.UserPool(this, "CloudFrontExtCognito", {
      userPoolName: "CloudFrontExtCognito_UserPool",
      selfSignUpEnabled: false,
      autoVerify: {
        email: true,
      },
      signInAliases: {
        username: true,
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: false,
        },
      },
    });

    const consoleAdminUserName = new cdk.CfnParameter(this, "InitialUserName", {
      type: "String",
      description: "The initial username for the web console",
    });

    const consoleAdminUserEmail = new cdk.CfnParameter(
      this,
      "InitialUserEmail",
      {
        type: "String",
        description: "The initial user email for the web console",
      }
    );

    const consoleAdminUserPassword = new cdk.CfnParameter(
      this,
      "InitialUserPassword",
      {
        type: "String",
        description: "The Initial Password for web console. Length 8~16 with space, Must contain 1 uppercase, 1 lowercase, 1 number, 1 non-alpha numeric number, 1 number (0-9)",
        allowedPattern:
          "^(?=.*\\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[^\\w\\d\\s:])([^\\s]){8,16}$",
        constraintDescription:
          "Length 8~16 with space, Must contain 1 uppercase, 1 lowercase, 1 number, 1 non-alpha numeric number, 1 number (0-9)",
        minLength: 8,
        maxLength: 32,
        noEcho: true,
      }
    );

    // Monitoring
    const monitoringType = new cdk.CfnParameter(this, "Monitoring", {
      description:
        "Monitoring dashboard to get CloudFront metrics. Set it to no to not deploy monitoring feature, set it to yes-Realtime to get monitoring metrics from realtime log, set it to yes-Non-Realtime to get monitoring metrics from standard log",
      type: "String",
      allowedValues: ["no", "yes-Realtime", "yes-Non-Realtime"],
      default: "no",
    });

    const domainList = new cdk.CfnParameter(this, "CloudFrontDomainList", {
      description:
        "The domain name to be monitored, input CName if your CloudFront distribution has one or else you can input CloudFront domain name, for example: d1v8v39goa3nap.cloudfront.net. For multiple domain, using ',' as seperation. Use ALL to monitor all domains",
      type: "String",
      default: "",
    });
    const monitoringInterval = new cdk.CfnParameter(this, "MonitoringInterval", {
      description:
        "The interval for monitoring metrics in minutes, the default interval is 5 min, eg. it will get the metric data at 09:00, 09:05, 09:10 etc.",
      type: "String",
      default: "5",
    });
    const logKeepingDays = new cdk.CfnParameter(this, "CloudFrontLogKeepDays", {
      description: "Max number of days to keep CloudFront standard logs or realtime logs in S3",
      type: "Number",
      default: 120,
    });
    const deleteLog = new cdk.CfnParameter(this, "DeleteLog", {
      description:
        "Delete original CloudFront standard logs in S3 bucket (true or false), this only applies to non-realtime monitoring",
      type: "String",
      allowedValues: ["false", "true"],
      default: "false",
    });
    const useStartTime = new cdk.CfnParameter(this, "UseStartTime", {
      description:
        "Set it to true if the Time in metric data is based on start time, set it to false if the Time in metric data is based on end time, this only applies to non-realtime monitoring",
      type: "String",
      allowedValues: ["false", "true"],
      default: "false",
    });
    const shardCount = new cdk.CfnParameter(this, "KinesisShardCount", {
      description: "The shard count of Kinesis data stream",
      type: "Number",
      default: 50,
    });


    // create email SSL subscription
    const sslEmailAddress = new cdk.CfnParameter(this, "EmailAddress", {
      description: "Email address to receive SSL certificates notification",
      type: "String",
      allowedPattern: '\\w[-\\w.+]*@([A-Za-z0-9][-A-Za-z0-9]+\\.)+[A-Za-z]{2,14}'
    });

    this.templateOptions.metadata = {
      "AWS::CloudFormation::Interface": {
        ParameterGroups: [
          {
            Label: {
              default: "Console User",
            },
            Parameters: [
              consoleAdminUserName.logicalId,
              consoleAdminUserEmail.logicalId,
              consoleAdminUserPassword.logicalId,
            ],
          },
          {
            Label: {
              default: "Monitoring",
            },
            Parameters: [
              monitoringType.logicalId,
              domainList.logicalId,
              monitoringInterval.logicalId,
              logKeepingDays.logicalId,
              deleteLog.logicalId,
              useStartTime.logicalId,
              shardCount.logicalId,
            ],
          },
          {
            Label: {
              default: "SSL Certificates",
            },
            Parameters: [
              sslEmailAddress.logicalId,
            ],
          },
        ],
        ParameterLabels: {
          [consoleAdminUserName.logicalId]: {
            default: "Initial User Name",
          },
          [consoleAdminUserEmail.logicalId]: {
            default: "Initial User Email",
          },
          [consoleAdminUserPassword.logicalId]: {
            default: "Initial User Password",
          },

          [monitoringType.logicalId]: {
            default: "CloudFront Log Type",
          },
          [domainList.logicalId]: {
            default: "CloudFront Domain List",
          },
          [monitoringInterval.logicalId]: {
            default: "Monitoring Interval",
          },
          [logKeepingDays.logicalId]: {
            default: "Log Keeping Days",
          },
          [deleteLog.logicalId]: {
            default: "Delete Log (Non-Realtime Only)",
          },
          [useStartTime.logicalId]: {
            default: "Use Start Time (Non-Realtime Only)",
          },
          [shardCount.logicalId]: {
            default: "Kinesis Data Stream Shard Count (Realtime Only)",
          }, 
          [sslEmailAddress.logicalId]: {
            default: "Notification Email",
          },
        },
      },
    };

    const nonRealTimeMonitoringCondition = new cdk.CfnCondition(
      this,
      "NonRealTimeMonitoringCondition",
      {
        expression: cdk.Fn.conditionEquals(
          monitoringType.valueAsString,
          "yes-Non-Realtime"
        ),
      }
    );

    const realtimeMonitoringCondition = new cdk.CfnCondition(
      this,
      "RealTimeMonitoringCondition",
      {
        expression: cdk.Fn.conditionEquals(
          monitoringType.valueAsString,
          "yes-Realtime"
        ),
      }
    );
    const user = new cognito.CfnUserPoolUser(this, "WebConsoleDefaultUser", {
      userPoolId: cognitoUserPool.userPoolId,
      // Properties below are optional
      desiredDeliveryMediums: ["EMAIL"],
      forceAliasCreation: true,
      messageAction: "SUPPRESS",
      userAttributes: [
        {
          name: "email_verified",
          value: "True",
        },
        {
          name: "email",
          value: consoleAdminUserEmail.valueAsString,
        },
      ],
      username: consoleAdminUserName.valueAsString,
    });

    // Force the password for the user, since new users created are in FORCE_PASSWORD_CHANGE status by default, such new user has no way to change it though
    // Refer to API details on https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_AdminSetUserPassword.html
    const adminSetUserPassword = new AwsCustomResource(
      this,
      "AwsCustomResource-ForcePassword",
      {
        onCreate: {
          service: "CognitoIdentityServiceProvider",
          action: "adminSetUserPassword",
          parameters: {
            UserPoolId: cognitoUserPool.userPoolId,
            Username: user.username,
            Password: consoleAdminUserPassword.valueAsString,
            Permanent: true,
          },
          physicalResourceId: PhysicalResourceId.of(
            `AwsCustomResource-ForcePassword-${user.username}`
          ),
        },
        policy: AwsCustomResourcePolicy.fromSdkCalls({
          resources: AwsCustomResourcePolicy.ANY_RESOURCE,
        }),
        installLatestAwsSdk: true,
      }
    );

    const cfnUserPool = cognitoUserPool.node
      .defaultChild as cognito.CfnUserPool;
    cfnUserPool.userPoolAddOns = {
      advancedSecurityMode: "ENFORCED",
    };

    const cognitoUserPoolClient = cognitoUserPool.addClient(
      "CloudFrontExtn_WebPortal"
    );

    // Main stack with shared components
    const commonConstruct = new CommonConstruct(this, `CfCommonConstruct`, {
      sslForSaasOnly: false,
      cognitoClient: cognitoUserPoolClient,
      cognitoUserPool: cognitoUserPool,
    });

    const webConsole = new PortalConstruct(this, "WebConsole", {
      aws_api_key: commonConstruct?.appsyncApi.apiKey,
      aws_appsync_authenticationType: appsync.AuthorizationType.USER_POOL,
      aws_appsync_graphqlEndpoint: commonConstruct?.appsyncApi.graphqlUrl,
      aws_appsync_region: this.region,
      aws_project_region: this.region,
      aws_user_pools_id: cognitoUserPool.userPoolId,
      aws_user_pools_web_client_id: cognitoUserPoolClient.userPoolClientId,
      aws_cognito_region: this.region,
      build_time: new Date().getTime() + "",
    });

    // Monitoring Stacks
    // Non-RealtimeMonitoring
    const nonRealtimeMonitoring = new NonRealtimeMonitoringStack(
      this,
      "NonRealtime",
      {
        nonRealTimeMonitoring: monitoringType.valueAsString,
        domainList: domainList.valueAsString,
        monitoringInterval: monitoringInterval.valueAsString,
        logKeepingDays: logKeepingDays.valueAsNumber,
        deleteLogNonRealtime: deleteLog.valueAsString,
        useStartTimeNonRealtime: useStartTime.valueAsString,
        shardCount: shardCount.valueAsNumber,
        portalBucket: webConsole.portalBucket,
        appsyncApi: commonConstruct.appsyncApi,
      }
    );
    (
      nonRealtimeMonitoring.nestedStackResource as cdk.CfnStack
    ).cfnOptions.condition = nonRealTimeMonitoringCondition;

    // RealtimeMonitoring
    const realtimeMonitoring = new RealtimeMonitoringStack(this, "Realtime", {
      nonRealTimeMonitoring: monitoringType.valueAsString,
      domainList: domainList.valueAsString,
      monitoringInterval: monitoringInterval.valueAsString,
      logKeepingDays: logKeepingDays.valueAsNumber,
      deleteLogNonRealtime: deleteLog.valueAsString,
      useStartTimeNonRealtime: useStartTime.valueAsString,
      shardCount: shardCount.valueAsNumber,
      portalBucket: webConsole.portalBucket,
      appsyncApi: commonConstruct.appsyncApi,
    });
    (
      realtimeMonitoring.nestedStackResource as cdk.CfnStack
    ).cfnOptions.condition = realtimeMonitoringCondition;

    realtimeMonitoring.node.addDependency(commonConstruct, webConsole);
    nonRealtimeMonitoring.node.addDependency(commonConstruct, webConsole);

    // Config version stack
    const configVersion = new CloudFrontConfigVersionConstruct(
      this,
      "CloudFrontConfigVersionConstruct",
      {
        tags: {
          app: "CloudFrontConfigVersion",
        },
        synthesizer: props.synthesizer,
        appsyncApi: commonConstruct.appsyncApi,
      }
    );

    new RepoConstruct(this, "RepoConstruct", {
      tags: {
        app: "CloudFrontExtensionsRepo",
      },
      synthesizer: props.synthesizer,
      appsyncApi: commonConstruct.appsyncApi,
    });

    // SSL for SaaS stack
    new StepFunctionRpTsConstruct(this, "StepFunctionRpTsConstruct", {
      /* If you don't specify 'env', this stack will be environment-agnostic.
       * Account/Region-dependent features and context lookups will not work,
       * but a single synthesized template can be deployed anywhere. */

      /* Uncomment the next line to specialize this stack for the AWS Account
       * and Region that are implied by the current CLI configuration. */
      // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

      /* Uncomment the next line if you know exactly what Account and Region you
       * want to deploy the stack to. */
      // env: { account: '123456789012', region: 'us-east-1' },

      /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
      synthesizer: props.synthesizer,
      appsyncApi: commonConstruct.appsyncApi,
      configVersionDDBTableName: configVersion.configVersionDDBTableName,
      notificationEmail: sslEmailAddress.valueAsString,
    });
  }
}
