export interface RepositoryType {
  id: string;
  name: string;
  desc: string;
  version: string;
  stage: string;
  tags: string;
}

export interface CloudFrontType {
  id: string;
  domain: string;
  // versionCount: number;
  status: string;
}

export interface CFTaskType {
  id: string;
  domain: string;
  time: string;
}

export interface StackType {
  name: string;
  status: string;
  version: string;
  created: string;
}

export interface VersionType {
  id: string;
  versionId: string;
  time: string;
  desc: string;
  tags: string;
}

export interface CertificateType {
  id: string;
  domainName: string;
  type: string;
  status: string;
  tags: string;
}

export interface CNameType {
  id: string;
  hostName: string;
  sslStatus: string;
  certExpireOn: string;
  distribution: string;
  expireOn: string;
  tags: string;
}

export const MOCK_REPOSITORY_LIST: RepositoryType[] = [
  {
    id: "1",
    name: "resize-picture",
    desc: "Resize pictures on the fly according to …",
    version: "1.0.2",
    stage: "Origin response",
    tags: "Image",
  },
  {
    id: "2",
    name: "pre-warm",
    desc: "This Lambda will prewarm static content ...",
    version: "1.0.1",
    stage: "-",
    tags: "CHR",
  },
  {
    id: "3",
    name: "anti-hotlinking",
    desc: "Prevent hotlinking by validation in referer…",
    version: "1.3.0",
    stage: "-",
    tags: "Security",
  },
  {
    id: "4",
    name: "bot-detection",
    desc: "Find Googlebot and Bingbot to ...",
    version: "1.0.0",
    stage: "Origin request",
    tags: "CHR",
  },
  {
    id: "5",
    name: "modify-response-header",
    desc: "Modify response header as per ...",
    version: "1.0.1",
    stage: "Viewer response",
    tags: "-",
  },
  {
    id: "6",
    name: "serving-based-on-device",
    desc: "Redirect according to device type",
    version: "1.0.0",
    stage: "Viewer request",
    tags: "Redirection",
  },
];

export const CF_STAGE_LIST = [
  { name: "viewer-request", value: "viewer-request" },
  { name: "viewer-response", value: "viewer-response" },
  { name: "origin-request", value: "origin-request" },
  { name: "origin-response", value: "origin-response" },
];

export const CF_VERSION_LIST = [
  { name: "Version 3 Latest Config", value: "v3" },
  { name: "Version 2 Dev Test", value: "v2" },
  { name: "Version 1 First Release", value: "v1" },
];

export const CF_LIST = [
  {
    name: "XEWIDSGMPMEK86",
    value: "XEWIDSGMPMEK86",
    optTitle: "demo website",
  },
  {
    name: "PGNMOCVBDDREE9",
    value: "PGNMOCVBDDREE9",
    optTitle: "prod test",
  },
  {
    name: "XKXIAQKCDTEP60",
    value: "XKXIAQKCDTEP60",
    optTitle: "static content",
  },
];

export const MOCK_CLOUDFRONT_LIST: CloudFrontType[] = [
  {
    id: "XLOWCQQFJJHM80",
    domain: "bbb.cloudfront.net",
    // versionCount: 2,
    status: "Enabled",
  },
  {
    id: "XEWIDSGMPMEK86",
    domain: "abc.cloudfront.net",
    // versionCount: 0,
    status: "Disabled",
  },
];

export const MOCK_CF_TASK_LIST: CFTaskType[] = [
  {
    id: "Task-01",
    domain: "XEWIDSGMPMEK86",
    time: "2022-01-12 18:00:00",
  },
  {
    id: "Task-02",
    domain: "XLOWCQQFJJHM80",
    time: "2022-02-12 17:00:00",
  },
];

export const MOCK_STACK_LIST: StackType[] = [
  {
    name: "prewarm",
    status: "create_complele",
    version: "1.3.0",
    created: "2022-01-22 14:12:30",
  },
  {
    name: "anti-hotlinking",
    status: "create_complele",
    version: "1.3.0",
    created: "2022-01-22 14:12:30",
  },
  {
    name: "resize-picture",
    status: "create_complele",
    version: "1.3.0",
    created: "2022-01-22 14:12:30",
  },
];

export const MOCK_VERSION_LIST: VersionType[] = [
  {
    id: "1",
    versionId: "3",
    time: "2022-01-22 19:12:12",
    desc: "Latest Config",
    tags: "v2.0",
  },
  {
    id: "2",
    versionId: "2",
    time: "2022-03-12 19:12:12",
    desc: "Dev Test",
    tags: "prod, v1.0",
  },
  {
    id: "3",
    versionId: "1",
    time: "2022-02-22 19:12:12",
    desc: "First Release",
    tags: "beta",
  },
];

export const CERT_IN_ACCOUNT_LIST: CertificateType[] = [
  {
    id: "xxx-001",
    domainName: "www.example1.com",
    type: "Amazon issued",
    status: "Issued",
    tags: "beta",
  },
  {
    id: "xxx-002",
    domainName: "www.example2.com",
    type: "Amazon issued",
    status: "Validtation time out",
    tags: "demo",
  },
];

export const MOCK_CNAME_LIST: CNameType[] = [
  {
    id: "1",
    hostName: "www.example1.com",
    sslStatus: "Issued",
    certExpireOn: "2022-01-22 18:12:12",
    distribution: "XLOWCQQFJJHM80",
    expireOn: "2022-05-22 18:12:12",
    tags: "eCommerce",
  },
  {
    id: "2",
    hostName: "demo.test.com",
    sslStatus: "Pending validateion",
    certExpireOn: "2022-01-22 18:12:12",
    distribution: "XLOWCQQFJJHM80",
    expireOn: "2022-05-22 18:12:12",
    tags: "Game",
  },
];
