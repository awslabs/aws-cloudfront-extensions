import {Aws, aws_cognito as cognito, Stack} from "aws-cdk-lib";
import * as appsync from '@aws-cdk/aws-appsync-alpha';
import path from "path";
import * as cdk from 'aws-cdk-lib';

//This stack is created to holding shared resources between cloudfront submodules like appsync and cognito user pool
export interface CommonProps extends cdk.StackProps {
    appsyncApi: appsync.GraphqlApi;
    cognitoUserPool: cognito.UserPool
    cognitoClient: cognito.UserPoolClient
}

export class CommonStack extends Stack {
    public readonly appsyncApi: appsync.GraphqlApi;
    public readonly cognitoUserPool: cognito.UserPool;
    public readonly cognitoUserPoolClient: cognito.UserPoolClient;

    constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
        // construct a cognito for auth
        this.cognitoUserPool = new cognito.UserPool(this, "CloudFrontExtCognito", {
            userPoolName: "CloudFrontExtCognito_UserPool",
            selfSignUpEnabled: true,
            autoVerify: {
                email:true,
            },
            signInAliases: {
                username: true,
                email:true,
            },
            standardAttributes: {
                email: {
                    required: true,
                    mutable: false,
                }
            }
        });

        this.cognitoUserPoolClient = this.cognitoUserPool.addClient('CloudFrontExtn_WebPortal');

        // Creates the AppSync API
        this.appsyncApi = new appsync.GraphqlApi(this, 'appsyncApi', {
            name: 'cloudfront-extension-appsync-api',
            schema: appsync.Schema.fromAsset(path.join(__dirname, '../../graphql/schema.graphql')),
            authorizationConfig: {
                defaultAuthorization: {
                    authorizationType: appsync.AuthorizationType.USER_POOL,
                    userPoolConfig: {
                        userPool: this.cognitoUserPool,
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