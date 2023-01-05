

// Creates the AppSync API
import * as appsync from "@aws-cdk/aws-appsync-alpha";
import path from "path";
import {Stack} from "aws-cdk-lib";
import {GraphqlApi} from "@aws-cdk/aws-appsync-alpha";
import {UserPool} from "aws-cdk-lib/aws-cognito";

export class TestUtils {
    static mockAppSync(stack: Stack): GraphqlApi {
        return new appsync.GraphqlApi(stack, "appsyncApi", {
            name: "cloudfront-extension-appsync-api",
            schema: appsync.Schema.fromAsset(
                path.join(__dirname, "../../../graphql/schema.graphql")
            ),
            // authorizationConfig: config,
            logConfig: {
                fieldLogLevel: appsync.FieldLogLevel.ALL,
                excludeVerboseContent: true,
            },
        });
    }

    static mockAppSyncNoApiKey(stack: Stack): GraphqlApi {
        return new appsync.GraphqlApi(stack, "appsyncApi", {
            name: "cloudfront-extension-appsync-api",
            schema: appsync.Schema.fromAsset(
                path.join(__dirname, "../../../graphql/schema.graphql")
            ),
            // authorizationConfig: config,
            authorizationConfig:{
                defaultAuthorization: {
                    authorizationType: appsync.AuthorizationType.IAM,
                },
            },
            logConfig: {
                fieldLogLevel: appsync.FieldLogLevel.ALL,
                excludeVerboseContent: true,
            },
        });
    }

    static mockAppSyncApi(stack: Stack): GraphqlApi {
        const api = new appsync.GraphqlApi(stack, "appsyncApi", {
            name: "cloudfront-extension-appsync-api",
            schema: appsync.Schema.fromAsset(
                path.join(__dirname, "../../../graphql/schema.graphql")
            ),
            // authorizationConfig: config,
            authorizationConfig:{
                defaultAuthorization: {
                    authorizationType: appsync.AuthorizationType.API_KEY,
                },
            },
            logConfig: {
                fieldLogLevel: appsync.FieldLogLevel.ALL,
                excludeVerboseContent: true,
            },
        });
        return api
    }

    static mockcognitoUserPool(stack: Stack): UserPool {
        const userPool = new UserPool(stack, 'UserPool', {
            userPoolName: 'MyUserPool',
            selfSignUpEnabled: true,
            signInAliases: {
                username: true,
                email: true,
            },
        });
        return userPool
    }
}

