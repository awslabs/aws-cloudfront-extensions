/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const listExtensions = /* GraphQL */ `
  query ListExtensions($page: Int, $count: Int) {
    listExtensions(page: $page, count: $count) {
      extension {
        name
        templateUri
        type
        desc
        codeUri
        stage
        updateDate
        author
        status
        tag
        cfnParameter
      }
      total
    }
  }
`;
export const listCloudFrontDistWithId = /* GraphQL */ `
  query ListCloudFrontDistWithId($maxItems: Int, $marker: String) {
    listCloudFrontDistWithId(maxItems: $maxItems, marker: $marker) {
      dist {
        id
      }
      total
    }
  }
`;
export const queryByName = /* GraphQL */ `
  query QueryByName($name: String!) {
    queryByName(name: $name) {
      name
      templateUri
      type
      desc
      codeUri
      stage
      updateDate
      author
      status
      tag
      cfnParameter
    }
  }
`;
export const checkSyncStatus = /* GraphQL */ `
  query CheckSyncStatus {
    checkSyncStatus
  }
`;
export const behaviorById = /* GraphQL */ `
  query BehaviorById($id: String!) {
    behaviorById(id: $id)
  }
`;
export const applyConfig = /* GraphQL */ `
  query ApplyConfig(
    $src_distribution_id: String
    $version: String
    $target_distribution_ids: [String]
  ) {
    applyConfig(
      src_distribution_id: $src_distribution_id
      version: $version
      target_distribution_ids: $target_distribution_ids
    )
  }
`;
export const listDistribution = /* GraphQL */ `
  query ListDistribution {
    listDistribution {
      id
      domainName
      status
      enabled
      versionCount
      aliases {
        Quantity
        Items
      }
    }
  }
`;
export const updateConfigTag = /* GraphQL */ `
  query UpdateConfigTag(
    $distribution_id: String
    $version: String
    $note: String
  ) {
    updateConfigTag(
      distribution_id: $distribution_id
      version: $version
      note: $note
    )
  }
`;
export const diffCloudfrontConfig = /* GraphQL */ `
  query DiffCloudfrontConfig(
    $distribution_id: String
    $version1: String
    $version2: String
  ) {
    diffCloudfrontConfig(
      distribution_id: $distribution_id
      version1: $version1
      version2: $version2
    )
  }
`;
export const listCloudfrontVersions = /* GraphQL */ `
  query ListCloudfrontVersions($distribution_id: String) {
    listCloudfrontVersions(distribution_id: $distribution_id) {
      id
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
export const getConfigLink = /* GraphQL */ `
  query GetConfigLink($distribution_id: String, $versionId: String) {
    getConfigLink(distribution_id: $distribution_id, versionId: $versionId) {
      config_link
    }
  }
`;
export const getConfigContent = /* GraphQL */ `
  query GetConfigContent($distribution_id: String, $versionId: String) {
    getConfigContent(distribution_id: $distribution_id, versionId: $versionId)
  }
`;
export const notifications = /* GraphQL */ `
  query Notifications($limit: Int) {
    Notifications(limit: $limit) {
      id
      date
      type
    }
  }
`;
export const listCertifications = /* GraphQL */ `
  query ListCertifications {
    listCertifications {
      CertificateArn
      DomainName
      SubjectAlternativeNames
      Issuer
      Status
      CreatedAt
      IssuedAt
      NotBefore
      NotAfter
      KeyAlgorithm
    }
  }
`;
