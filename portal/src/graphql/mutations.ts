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
export const createVersionSnapShot = /* GraphQL */ `
  mutation CreateVersionSnapShot(
    $distributionId: String!
    $snapShotName: String!
    $snapShotNote: String
  ) {
    createVersionSnapShot(
      distributionId: $distributionId
      snapShotName: $snapShotName
      snapShotNote: $snapShotNote
    )
  }
`;
export const applySnapshot = /* GraphQL */ `
  mutation ApplySnapshot(
    $src_distribution_id: String
    $snapshot_name: String
    $target_distribution_ids: [String]
  ) {
    applySnapshot(
      src_distribution_id: $src_distribution_id
      snapshot_name: $snapshot_name
      target_distribution_ids: $target_distribution_ids
    )
  }
`;
export const deleteSnapshot = /* GraphQL */ `
  mutation DeleteSnapshot($distributionId: String, $snapShotName: String) {
    deleteSnapshot(distributionId: $distributionId, snapShotName: $snapShotName)
  }
`;
export const certCreateOrImport = /* GraphQL */ `
  mutation CertCreateOrImport($input: certInput) {
    certCreateOrImport(input: $input) {
      body
      statusCode
    }
  }
`;
