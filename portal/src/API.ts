/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

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

export type Apply_configQueryVariables = {
  src_distribution_id?: string | null,
  version?: string | null,
  target_distribution_ids?: Array< string | null > | null,
};

export type Apply_configQuery = {
  apply_config?: string | null,
};

export type Cf_listQuery = {
  cf_list?:  Array< {
    __typename: "Cloudfront_info",
    id?: string | null,
    domainName?: string | null,
    status?: string | null,
    enabled?: string | null,
    versionCount?: string | null,
  } | null > | null,
};

export type Config_tag_updateQueryVariables = {
  distribution_id?: string | null,
  version?: string | null,
  note?: string | null,
};

export type Config_tag_updateQuery = {
  config_tag_update?: string | null,
};

export type DiffQueryVariables = {
  distribution_id?: string | null,
  version1?: string | null,
  version2?: string | null,
};

export type DiffQuery = {
  diff?: string | null,
};

export type VersionsQueryVariables = {
  distribution_id?: string | null,
};

export type VersionsQuery = {
  versions?:  Array< {
    __typename: "Version",
    distribution_id?: string | null,
    versionId?: string | null,
    config_link?: string | null,
    dateTime?: string | null,
    note?: string | null,
    s3_bucket?: string | null,
    s3_key?: string | null,
  } | null > | null,
};

export type Config_linkQueryVariables = {
  distribution_id?: string | null,
  versionId?: string | null,
};

export type Config_linkQuery = {
  config_link?:  {
    __typename: "ConfigLink",
    config_link?: string | null,
  } | null,
};

export type Config_contentQueryVariables = {
  distribution_id?: string | null,
  versionId?: string | null,
};

export type Config_contentQuery = {
  config_content?: string | null,
};
