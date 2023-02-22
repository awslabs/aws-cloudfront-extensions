import { aws_cognito as cognito, Stack } from "aws-cdk-lib";
import * as appsync from '@aws-cdk/aws-appsync-alpha';
import path from "path";
import * as cdk from 'aws-cdk-lib';
import { Construct } from "constructs";
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';


//This stack is created to holding shared resources between cloudfront submodules like appsync and cognito user pool
export interface CommonProps extends cdk.StackProps {
    appsyncApi?: appsync.GraphqlApi;

}

export interface CognitoProps extends CommonProps {
    sslForSaasOnly?: boolean;
    cognitoUserPool?: cognito.UserPool;
    cognitoClient?: cognito.UserPoolClient;
}

export class CommonStack extends Stack {
    constructor(scope: Construct, id: string, props: CognitoProps) {
        super(scope, id);
        new CommonConstruct(this, id, props);
    }
}

export class CommonConstruct extends Construct {
    public readonly appsyncApi: appsync.GraphqlApi;
    public listCountry: lambda.Function;

    constructor(scope: Stack, id: string, props: CognitoProps) {
        super(scope, id);
        let config: appsync.AuthorizationConfig = {
            defaultAuthorization: {
                authorizationType: appsync.AuthorizationType.USER_POOL,
                userPoolConfig: {
                    userPool: props.cognitoUserPool!,
                },
            },
            additionalAuthorizationModes: [
                {
                    authorizationType: appsync.AuthorizationType.API_KEY,
                }
            ],
        }

        if (props.sslForSaasOnly) {
            config = {
                defaultAuthorization: {
                    authorizationType: appsync.AuthorizationType.API_KEY,
                },
            }
        }

        // Creates the AppSync API
        this.appsyncApi = new appsync.GraphqlApi(scope, 'appsyncApi', {
            name: 'cloudfront-extension-appsync-api',
            schema: appsync.Schema.fromAsset(path.join(__dirname, '../../graphql/schema.graphql')),
            authorizationConfig: config,
            logConfig: {
                fieldLogLevel: appsync.FieldLogLevel.ALL,
                excludeVerboseContent: true
            },
        });

        // AWS Lambda Powertools
        const powertools_layer = lambda.LayerVersion.fromLayerVersionArn(
            this,
            `PowertoolLayer`,
            `arn:aws:lambda:${cdk.Aws.REGION}:017000801446:layer:AWSLambdaPowertoolsPython:16`
        );
        this.listCountry = new lambda.Function(this, 'listCountry', {
            runtime: lambda.Runtime.PYTHON_3_9,
            handler: 'country_list.lambda_handler',
            memorySize: 512,
            timeout: cdk.Duration.seconds(900),
            code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/monitoring/country_list')),
            logRetention: logs.RetentionDays.ONE_WEEK,
            layers: [powertools_layer]
        });
        const listCountryDs = this.appsyncApi.addLambdaDataSource('listCountryDs', this.listCountry);
        listCountryDs.createResolver({
            typeName: "Query",
            fieldName: "listCountry",
            requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
            responseMappingTemplate: appsync.MappingTemplate.lambdaResult()
        });

        // // Prints out the AppSync GraphQL endpoint to the terminal
        // new cdk.CfnOutput(this, "GraphQLAPIURL", {
        //     value: this.appsyncApi.graphqlUrl
        // });

        // Prints out the AppSync GraphQL API key to the terminal
        // new cdk.CfnOutput(this, "GraphQLAPIKey", {
        //     value: this.appsyncApi.apiKey || ''
        // });
    }
}