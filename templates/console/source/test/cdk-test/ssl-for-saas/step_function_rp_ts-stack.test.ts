import {App, Stack} from "aws-cdk-lib";
import {StepFunctionRpTsConstruct} from "../../../lib/ssl-for-saas/step_function_rp_ts-stack";
import {BootstraplessStackSynthesizer} from "cdk-bootstrapless-synthesizer";
import {TestUtils} from "../test-util/utils";
import {CloudFrontConfigVersionConstruct} from "../../../lib/config-version/aws-cloudfront-config-version-stack";
import {Match, Template} from "aws-cdk-lib/assertions";

describe("StepFunctionRpTsConstruct", () => {
    test("Test Ssl step function construct create successfully", () => {
        const app = new App();
        const appStack = new Stack(app, "SslStepStack", {});
        // WHEN
        const appsyncApiStack = TestUtils.mockAppSync(appStack);
        const configVersion = new CloudFrontConfigVersionConstruct(
            appStack,
            "MyConfigVersionConstruct",
            {
                appsyncApi: appsyncApiStack,
            }
        );

        const temp = new StepFunctionRpTsConstruct(appStack, "sslStepFuncConstruct", {
            synthesizer: new BootstraplessStackSynthesizer(),
            appsyncApi: appsyncApiStack,
            configVersionDDBTableName: configVersion.configVersionDDBTableName,
            notificationEmail: "cfextn-test@amazon.com",
        });

        const template = Template.fromStack(appStack);

        // THEN
        // cat CloudFrontExtnConsoleStack.template.json | jq '.Resources | with_entries(select(.key | contains("StepFunction"))) | .[] | select(.Type=="AWS::Lambda::Function") | .Type' | wc -l
        // cat CloudFrontExtnConsoleStack.template.json | jq '.Resources | .[] | select(.Type=="AWS::Lambda::Function") | .Type' | wc -l
        template.resourceCountIs("AWS::DynamoDB::Table", 5);
        template.resourceCountIs("AWS::StepFunctions::StateMachine", 1);
        template.resourceCountIs("AWS::Lambda::Function", 17);
        template.resourceCountIs("AWS::AppSync::Resolver", 23);
        template.resourceCountIs("AWS::ApiGateway::Account", 2);
        template.resourceCountIs("AWS::ApiGateway::ApiKey", 2);
        template.resourceCountIs("AWS::ApiGateway::Deployment", 2 );
        template.resourceCountIs("AWS::ApiGateway::Method", 14 );
        template.resourceCountIs("AWS::ApiGateway::RequestValidator", 2 );
        template.resourceCountIs("AWS::ApiGateway::Resource", 15 );
        template.resourceCountIs("AWS::ApiGateway::RestApi", 2 );
        template.resourceCountIs("AWS::ApiGateway::Stage", 2 );
        template.resourceCountIs("AWS::ApiGateway::UsagePlan", 2 );
        template.resourceCountIs("AWS::ApiGateway::UsagePlanKey", 2 );
        template.resourceCountIs("AWS::AppSync::DataSource", 2 );
        template.resourceCountIs("AWS::AppSync::Resolver", 23 );
        template.resourceCountIs("AWS::ApplicationAutoScaling::ScalableTarget", 2 );
        template.resourceCountIs("AWS::ApplicationAutoScaling::ScalingPolicy", 2 );
        template.resourceCountIs("AWS::Events::Rule", 3);
        template.resourceCountIs("AWS::IAM::Policy", 14);
        template.resourceCountIs("AWS::IAM::Role", 18);
        template.resourceCountIs("AWS::KMS::Key", 1);
        template.resourceCountIs("AWS::Lambda::Permission", 30 );
        template.resourceCountIs("AWS::Logs::LogGroup", 3);
        template.resourceCountIs("AWS::SNS::Subscription", 1);
        template.resourceCountIs("AWS::SNS::Topic", 1 );
        template.resourceCountIs("AWS::SNS::TopicPolicy", 1 );
    });
    test("Test Ssl step function construct create successfully 222", () => {
        const app = new App();
        const appStack = new Stack(app, "SslStepStack", {});
        // WHEN
        const appsyncApiStack = TestUtils.mockAppSyncNoApiKey(appStack);
        const configVersion = new CloudFrontConfigVersionConstruct(
            appStack,
            "MyConfigVersionConstruct",
            {
                appsyncApi: appsyncApiStack,
            }
        );
        const temp = new StepFunctionRpTsConstruct(appStack, "sslStepFuncConstruct", {
            synthesizer: new BootstraplessStackSynthesizer(),
            appsyncApi: appsyncApiStack,
            configVersionDDBTableName: configVersion.configVersionDDBTableName,
            notificationEmail: "cfextn-test@amazon.com",
        });

        const template = Template.fromStack(appStack);

        // THEN
        template.resourceCountIs("AWS::StepFunctions::StateMachine", 1);
    });
    test("Test Ssl step function construct create fail", () => {
        const app = new App();
        const appStack = new Stack(app, "SslStepStack", {});
        // WHEN
        expect(() => new StepFunctionRpTsConstruct(appStack, "sslStepFuncStack", undefined)).toThrow(Error);
    });

    test("Test Ssl step function construct empty appsync create fail", () => {
        const app = new App();
        const appStack = new Stack(app, "SslStepStack", {});
        // WHEN
        expect(() => new StepFunctionRpTsConstruct(appStack, "sslStepFuncStack", {
            synthesizer: new BootstraplessStackSynthesizer(),
            appsyncApi: undefined,
            configVersionDDBTableName: "forTesting",
            notificationEmail: "cfextn-test@amazon.com",
        })).toThrow(Error);
    });


})