/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const apply_config = /* GraphQL */ `
  query Apply_config(
    $src_distribution_id: String
    $version: String
    $target_distribution_ids: [String]
  ) {
    apply_config(
      src_distribution_id: $src_distribution_id
      version: $version
      target_distribution_ids: $target_distribution_ids
    )
  }
`;
export const cf_list = /* GraphQL */ `
  query Cf_list {
    cf_list {
      id
      domainName
      status
      enabled
      versionCount
    }
  }
`;
export const config_tag_update = /* GraphQL */ `
  query Config_tag_update(
    $distribution_id: String
    $version: String
    $note: String
  ) {
    config_tag_update(
      distribution_id: $distribution_id
      version: $version
      note: $note
    )
  }
`;
export const diff = /* GraphQL */ `
  query Diff($distribution_id: String, $version1: String, $version2: String) {
    diff(
      distribution_id: $distribution_id
      version1: $version1
      version2: $version2
    )
  }
`;
export const versions = /* GraphQL */ `
  query Versions($distribution_id: String) {
    versions(distribution_id: $distribution_id) {
      distribution_id
      versionId
      config_link
      dateTime
      note
      s3_bucket
      s3_key
    }
  }
`;
export const config_link = /* GraphQL */ `
  query Config_link($distribution_id: String, $versionId: String) {
    config_link(distribution_id: $distribution_id, versionId: $versionId) {
      config_link
    }
  }
`;
export const config_content = /* GraphQL */ `
  query Config_content($distribution_id: String, $versionId: String) {
    config_content(distribution_id: $distribution_id, versionId: $versionId)
  }
`;
