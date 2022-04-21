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
export const certCreate = /* GraphQL */ `
  mutation CertCreate($input: certCreateInput) {
    certCreate(input: $input) {
      statue
      createdAt
      updatedAt
    }
  }
`;
export const certImport = /* GraphQL */ `
  mutation CertImport($input: certImportInput!) {
    certImport(input: $input) {
      status
      createdAt
      updatedAt
    }
  }
`;
