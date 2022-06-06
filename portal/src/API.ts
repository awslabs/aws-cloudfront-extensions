/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export type ExtensionParameter = {
  parameterKey?: string | null,
  parameterValue?: string | null,
};

export type certInput = {
  acm_op: string,
  auto_creation: string,
  dist_aggregate: string,
  enable_cname_check: string,
  cnameList: Array< cnameInput | null >,
  pemList: Array< pemInput | null >,
};

export type cnameInput = {
  domainName: string,
  sanList?: Array< string > | null,
  originsItemsDomainName: string,
  existing_cf_info: existingCFInfo,
};

export type existingCFInfo = {
  distribution_id: string,
  config_version_id: string,
};

export type pemInput = {
  CertPem: string,
  PrivateKeyPem: string,
  ChainPem: string,
  originsItemsDomainName: string,
};

export type certOutput = {
  __typename: "certOutput",
  status: string,
  createdAt: string,
  updatedAt: string,
};

export type ExtensionResponse = {
  __typename: "ExtensionResponse",
  extension?:  Array<Extension | null > | null,
  total?: number | null,
};

export type Extension = {
  __typename: "Extension",
  name: string,
  templateUri: string,
  type: ExtensionType,
  desc: string,
  codeUri: string,
  stage?: string | null,
  updateDate: string,
  author?: string | null,
  status: string,
  tag?: string | null,
  cfnParameter?: string | null,
};

export enum ExtensionType {
  Lambda = "Lambda",
  LambdaEdge = "LambdaEdge",
  CFF = "CFF",
}


export type ListCloudFrontDistResponse = {
  __typename: "ListCloudFrontDistResponse",
  dist?:  Array<CloudFrontDist | null > | null,
  total?: number | null,
};

export type CloudFrontDist = {
  __typename: "CloudFrontDist",
  id: string,
};

export type Cloudfront_info = {
  __typename: "Cloudfront_info",
  id?: string | null,
  domainName?: string | null,
  status?: string | null,
  enabled?: string | null,
  versionCount?: string | null,
};

export type Version = {
  __typename: "Version",
  id: string,
  distribution_id?: string | null,
  versionId?: string | null,
  config_link?: string | null,
  dateTime?: string | null,
  note?: string | null,
  s3_bucket?: string | null,
  s3_key?: string | null,
};

export type ConfigLink = {
  __typename: "ConfigLink",
  config_link?: string | null,
};

export type Notification = {
  __typename: "Notification",
  id?: string | null,
  date?: string | null,
  type?: string | null,
};

export type certification_info = {
  __typename: "certification_info",
  CertificateArn: string,
  DomainName: string,
  SubjectAlternativeNames?: string | null,
  Issuer: string,
  Status: string,
  CreatedAt: string,
  IssuedAt: string,
  NotBefore: string,
  NotAfter: string,
  KeyAlgorithm: string,
};

export type DeployExtensionMutationVariables = {
  name: string,
  parameters?: Array< ExtensionParameter | null > | null,
};

export type DeployExtensionMutation = {
  // Deploy an extension
  deployExtension?: string | null,
};

export type SyncExtensionsMutation = {
  // Get the latest extensions
  syncExtensions?: string | null,
};

export type CertCreateOrImportMutationVariables = {
  input?: certInput | null,
};

export type CertCreateOrImportMutation = {
  // SSL for SAAS
  certCreateOrImport?:  {
    __typename: "certOutput",
    status: string,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type ListExtensionsQueryVariables = {
  page?: number | null,
  count?: number | null,
};

export type ListExtensionsQuery = {
  // List CloudFront extensions in extension repo
  listExtensions?:  {
    __typename: "ExtensionResponse",
    extension?:  Array< {
      __typename: "Extension",
      name: string,
      templateUri: string,
      type: ExtensionType,
      desc: string,
      codeUri: string,
      stage?: string | null,
      updateDate: string,
      author?: string | null,
      status: string,
      tag?: string | null,
      cfnParameter?: string | null,
    } | null > | null,
    total?: number | null,
  } | null,
};

export type ListCloudFrontDistWithIdQueryVariables = {
  maxItems?: number | null,
  marker?: string | null,
};

export type ListCloudFrontDistWithIdQuery = {
  // List CloudFront distributions with id in drop-down list
  listCloudFrontDistWithId?:  {
    __typename: "ListCloudFrontDistResponse",
    dist?:  Array< {
      __typename: "CloudFrontDist",
      id: string,
    } | null > | null,
    total?: number | null,
  } | null,
};

export type QueryByNameQueryVariables = {
  name: string,
};

export type QueryByNameQuery = {
  // Get the extension details
  queryByName?:  {
    __typename: "Extension",
    name: string,
    templateUri: string,
    type: ExtensionType,
    desc: string,
    codeUri: string,
    stage?: string | null,
    updateDate: string,
    author?: string | null,
    status: string,
    tag?: string | null,
    cfnParameter?: string | null,
  } | null,
};

export type CheckSyncStatusQuery = {
  // Check whether it is need to sync extensions
  checkSyncStatus?: string | null,
};

export type BehaviorByIdQueryVariables = {
  id: string,
};

export type BehaviorByIdQuery = {
  // Get CloudFront behavior config
  behaviorById?: Array< string | null > | null,
};

export type ApplyConfigQueryVariables = {
  src_distribution_id?: string | null,
  version?: string | null,
  target_distribution_ids?: Array< string | null > | null,
};

export type ApplyConfigQuery = {
  // query for config-version part
  applyConfig?: string | null,
};

export type ListDistributionQuery = {
  listDistribution?:  Array< {
    __typename: "Cloudfront_info",
    id?: string | null,
    domainName?: string | null,
    status?: string | null,
    enabled?: string | null,
    versionCount?: string | null,
  } | null > | null,
};

export type UpdateConfigTagQueryVariables = {
  distribution_id?: string | null,
  version?: string | null,
  note?: string | null,
};

export type UpdateConfigTagQuery = {
  updateConfigTag?: string | null,
};

export type DiffCloudfrontConfigQueryVariables = {
  distribution_id?: string | null,
  version1?: string | null,
  version2?: string | null,
};

export type DiffCloudfrontConfigQuery = {
  diffCloudfrontConfig?: string | null,
};

export type ListCloudfrontVersionsQueryVariables = {
  distribution_id?: string | null,
};

export type ListCloudfrontVersionsQuery = {
  listCloudfrontVersions?:  Array< {
    __typename: "Version",
    id: string,
    distribution_id?: string | null,
    versionId?: string | null,
    config_link?: string | null,
    dateTime?: string | null,
    note?: string | null,
    s3_bucket?: string | null,
    s3_key?: string | null,
  } | null > | null,
};

export type GetConfigLinkQueryVariables = {
  distribution_id?: string | null,
  versionId?: string | null,
};

export type GetConfigLinkQuery = {
  getConfigLink?:  {
    __typename: "ConfigLink",
    config_link?: string | null,
  } | null,
};

export type GetConfigContentQueryVariables = {
  distribution_id?: string | null,
  versionId?: string | null,
};

export type GetConfigContentQuery = {
  getConfigContent?: string | null,
};

export type NotificationsQueryVariables = {
  limit?: number | null,
};

export type NotificationsQuery = {
  // SSL for SAAS
  Notifications?:  Array< {
    __typename: "Notification",
    id?: string | null,
    date?: string | null,
    type?: string | null,
  } | null > | null,
};

export type ListCertificationsQuery = {
  // list certifications for
  listCertifications?:  Array< {
    __typename: "certification_info",
    CertificateArn: string,
    DomainName: string,
    SubjectAlternativeNames?: string | null,
    Issuer: string,
    Status: string,
    CreatedAt: string,
    IssuedAt: string,
    NotBefore: string,
    NotAfter: string,
    KeyAlgorithm: string,
  } | null > | null,
};
