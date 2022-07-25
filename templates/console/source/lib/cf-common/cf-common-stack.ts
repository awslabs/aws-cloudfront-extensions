import {aws_cognito as cognito, Stack} from "aws-cdk-lib";
import * as appsync from '@aws-cdk/aws-appsync-alpha';
import path from "path";
import * as cdk from 'aws-cdk-lib';
import {Construct} from "constructs";

//This stack is created to holding shared resources between cloudfront submodules like appsync and cognito user pool
export interface CommonProps extends cdk.StackProps {
    appsyncApi?: appsync.GraphqlApi;

}

export interface CognitoProps extends CommonProps {
    cognitoUserPool: cognito.UserPool;
    cognitoClient: cognito.UserPoolClient;
}

export class CommonStack extends Stack {
    constructor(scope: Construct, id: string, props: CognitoProps) {
        super(scope, id);
        new CommonConstruct(this, id, props);
    }
}

export class CommonConstruct extends Construct {
    public readonly appsyncApi: appsync.GraphqlApi;

    constructor(scope: Stack, id: string, props: CognitoProps) {
        super(scope, id);

        // Creates the AppSync API
        this.appsyncApi = new appsync.GraphqlApi(scope, 'appsyncApi', {
            name: 'cloudfront-extension-appsync-api',
            schema: appsync.Schema.fromAsset(path.join(__dirname, '../../graphql/schema.graphql')),
            authorizationConfig: {
                defaultAuthorization: {
                    authorizationType: appsync.AuthorizationType.USER_POOL,
                    userPoolConfig: {
                        userPool: props.cognitoUserPool,
                    },
                },
                additionalAuthorizationModes: [
                    {
                        authorizationType: appsync.AuthorizationType.API_KEY,
                    }
                ],
            },
            xrayEnabled: true,
        });



        // Prints out the AppSync GraphQL endpoint to the terminal
        new cdk.CfnOutput(this, "GraphQLAPIURL", {
          value: this.appsyncApi.graphqlUrl
        });

        // Prints out the AppSync GraphQL API key to the terminal
        new cdk.CfnOutput(this, "GraphQLAPIKey", {
          value: this.appsyncApi.apiKey || ''
        });
    }
}