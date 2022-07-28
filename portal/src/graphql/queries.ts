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
      snapshotCount
      aliases {
        Quantity
        Items
      }
    }
  }
`;
export const getDistributionCname = /* GraphQL */ `
  query GetDistributionCname($distribution_id: String) {
    getDistributionCname(distribution_id: $distribution_id)
  }
`;
export const getAppliedSnapshotName = /* GraphQL */ `
  query GetAppliedSnapshotName($distribution_id: String) {
    getAppliedSnapshotName(distribution_id: $distribution_id)
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
export const updateConfigSnapshotTag = /* GraphQL */ `
  query UpdateConfigSnapshotTag(
    $distribution_id: String
    $snapshot_name: String
    $note: String
  ) {
    updateConfigSnapshotTag(
      distribution_id: $distribution_id
      snapshot_name: $snapshot_name
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
export const diffCloudfrontConfigSnapshot = /* GraphQL */ `
  query DiffCloudfrontConfigSnapshot(
    $distribution_id: String
    $snapshot1: String
    $snapshot2: String
  ) {
    diffCloudfrontConfigSnapshot(
      distribution_id: $distribution_id
      snapshot1: $snapshot1
      snapshot2: $snapshot2
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
export const listCloudfrontSnapshots = /* GraphQL */ `
  query ListCloudfrontSnapshots($distribution_id: String) {
    listCloudfrontSnapshots(distribution_id: $distribution_id) {
      id
      distribution_id
      snapshot_name
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
export const getConfigSnapshotLink = /* GraphQL */ `
  query GetConfigSnapshotLink(
    $distribution_id: String
    $snapshot_name: String
  ) {
    getConfigSnapshotLink(
      distribution_id: $distribution_id
      snapshot_name: $snapshot_name
    ) {
      config_link
    }
  }
`;
export const getConfigContent = /* GraphQL */ `
  query GetConfigContent($distribution_id: String, $versionId: String) {
    getConfigContent(distribution_id: $distribution_id, versionId: $versionId)
  }
`;
export const getConfigSnapshotContent = /* GraphQL */ `
  query GetConfigSnapshotContent(
    $distribution_id: String
    $snapshot_name: String
  ) {
    getConfigSnapshotContent(
      distribution_id: $distribution_id
      snapshot_name: $snapshot_name
    )
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
export const listCertificationsWithJobId = /* GraphQL */ `
  query ListCertificationsWithJobId($jobId: String) {
    listCertificationsWithJobId(jobId: $jobId)
  }
`;
export const listSSLJobs = /* GraphQL */ `
  query ListSSLJobs {
    listSSLJobs {
      jobId
      cert_completed_number
      cert_total_number
      cloudfront_distribution_created_number
      cloudfront_distribution_total_number
      job_input
      certCreateStageStatus
      certValidationStageStatus
      creationDate
      distStageStatus
      jobType
      certList
      distList
    }
  }
`;
export const getJobInfo = /* GraphQL */ `
  query GetJobInfo($jobId: String) {
    getJobInfo(jobId: $jobId) {
      jobId
      cert_completed_number
      cert_total_number
      cloudfront_distribution_created_number
      cloudfront_distribution_total_number
      job_input
      certCreateStageStatus
      certValidationStageStatus
      creationDate
      distStageStatus
      jobType
      certList
      distList
    }
  }
`;
