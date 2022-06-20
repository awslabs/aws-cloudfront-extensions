import {Stack} from "aws-cdk-lib";
import * as appsync from '@aws-cdk/aws-appsync-alpha';
import path from "path";
import * as cdk from 'aws-cdk-lib';
import {PortalStack} from "./web_portal_stack";

//This stack is created to holding shared resources between cloudfront submodules like appsync and cognito user pool
export interface CommonProps extends cdk.StackProps {
    appsyncApi: appsync.GraphqlApi;
}

export class CommonStack extends Stack {
    public readonly appsyncApi: appsync.GraphqlApi;

    constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // Creates the AppSync API
        this.appsyncApi = new appsync.GraphqlApi(this, 'appsyncApi', {
            name: 'cloudfront-extension-appsync-api',
            schema: appsync.Schema.fromAsset(path.join(__dirname, '../../graphql/schema.graphql')),
            authorizationConfig: {
                defaultAuthorization: {
                    authorizationType: appsync.AuthorizationType.API_KEY,
                },
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

        new PortalStack(this, "WebConsole", {
            aws_api_key: this.appsyncApi.apiKey,
            aws_appsync_authenticationType: appsync.AuthorizationType.API_KEY,
            aws_appsync_graphqlEndpoint: this.appsyncApi.graphqlUrl,
            aws_appsync_region: this.region,
            aws_cognito_region: "",
            aws_project_region: this.region,
            aws_user_pools_id: "",
            aws_user_pools_web_client_id: ""
        });
    }
}