/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const deployExtension = /* GraphQL */ `
  mutation DeployExtension($name: String!, $parameters: [ExtensionParameter]) {
    deployExtension(name: $name, parameters: $parameters)
  }
`;
export const syncExtensions = /* GraphQL */ `
  mutation SyncExtensions {
    syncExtensions
  }
`;
export const certCreateOrImport = /* GraphQL */ `
  mutation CertCreateOrImport($input: certInput) {
    certCreateOrImport(input: $input) {
      status
      createdAt
      updatedAt
    }
  }
`;
