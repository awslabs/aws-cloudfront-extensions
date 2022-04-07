/* eslint-disable no-async-promise-executor */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import Swal from "sweetalert2";
import { AUTH_TYPE } from "aws-appsync-auth-link";

import { createAuthLink } from "aws-appsync-auth-link";
import { createSubscriptionHandshakeLink } from "aws-appsync-subscription-link";
import { User } from "oidc-client-ts";

import { ApolloLink } from "apollo-link";
import { ApolloClient, createHttpLink, InMemoryCache } from "@apollo/client";
import gql from "graphql-tag";
import { Auth } from "aws-amplify";
export enum AppSyncAuthType {
  OPEN_ID = AUTH_TYPE.OPENID_CONNECT,
  AMAZON_COGNITO_USER_POOLS = AUTH_TYPE.AMAZON_COGNITO_USER_POOLS,
  API_KEY = AUTH_TYPE.API_KEY,
}

interface AmplifyConfigType {
  aws_api_key: string;
  aws_project_region: string;
  aws_appsync_graphqlEndpoint: string;
  aws_appsync_region: string;
  aws_appsync_authenticationType: AppSyncAuthType;
  aws_cognito_region: string;
  aws_user_pools_id: string;
  aws_user_pools_web_client_id: string;
  aws_cloudfront_url: string;
}

const buildAppsyncLink = () => {
  const configJSONObj: AmplifyConfigType = {
    aws_api_key: "da2-adxs4vpsxzgrpfrnuroiz7fime",
    aws_project_region: "us-east-1",
    aws_appsync_graphqlEndpoint:
      "https://jdm77ubkn5ef7b2o4zhnxj5aa4.appsync-api.us-east-1.amazonaws.com/graphql",
    aws_appsync_region: "us-east-1",
    aws_appsync_authenticationType: AppSyncAuthType.API_KEY,
    aws_cognito_region: "us-east-1",
    aws_user_pools_id: "",
    aws_user_pools_web_client_id: "",
    aws_cloudfront_url: "",
  };

  function getOIDCUser() {
    const oidcStorage = "";
    if (!oidcStorage) {
      return null;
    }
    return User.fromStorageString(oidcStorage);
  }

  const url: string = configJSONObj.aws_appsync_graphqlEndpoint;
  const region: string = configJSONObj.aws_appsync_region;
  const authType = configJSONObj.aws_appsync_authenticationType;

  const auth: any = {
    type: configJSONObj.aws_appsync_authenticationType,
    apiKey: configJSONObj.aws_api_key,
    jwtToken:
      authType === AppSyncAuthType.API_KEY
        ? undefined
        : authType === AppSyncAuthType.OPEN_ID
        ? getOIDCUser()?.id_token
        : async () => (await Auth.currentSession()).getIdToken().getJwtToken(),
  };

  const httpLink: any = createHttpLink({ uri: url });

  const link = ApolloLink.from([
    createAuthLink({ url, region, auth }) as any,
    createSubscriptionHandshakeLink(
      { url, region, auth } as any,
      httpLink
    ) as any,
  ]);
  return link;
};

export const appSyncRequestQuery = (query: any, params?: any): any => {
  const requestLink: any = buildAppsyncLink();
  const client = new ApolloClient({
    link: requestLink,
    cache: new InMemoryCache(),
  });

  return new Promise(async (resolve, reject) => {
    try {
      // const result: any = await API.graphql(graphqlOperation(query, params));
      const result: any = await client.query({
        query: gql(query),
        variables: params,
        fetchPolicy: "no-cache",
      });
      resolve(result);
    } catch (error) {
      const showError: any = error;
      console.info("ERRROR:", showError.message);
      console.info("error:", showError.errors?.[0].message);
      Swal.fire(
        "Oops...",
        showError.message || showError.errors?.[0].message,
        "error"
      );
      reject(error);
    }
  });
};

export const appSyncRequestMutation = (mutation: any, params?: any): any => {
  const requestLink: any = buildAppsyncLink();
  const client = new ApolloClient({
    link: requestLink,
    cache: new InMemoryCache(),
  });

  return new Promise(async (resolve, reject) => {
    try {
      // const result: any = await API.graphql(graphqlOperation(query, params));
      const result: any = await client.mutate({
        mutation: gql(mutation),
        variables: params,
        fetchPolicy: "no-cache",
      });
      resolve(result);
    } catch (error) {
      const showError: any = error;
      console.info("ERRROR:", showError.message);
      console.info("error:", showError.errors?.[0].message);
      Swal.fire(
        "Oops...",
        showError.message || showError.errors?.[0].message,
        "error"
      );
      reject(error);
    }
  });
};
