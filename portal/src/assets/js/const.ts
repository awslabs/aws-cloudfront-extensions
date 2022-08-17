export const AMPLIFY_CONFIG_JSON =
  "__cloud_front_extension_amplify_config_json__";
export const StageListMap: any = {
  CFF: [
    { name: "viewer-request", value: "viewer-request" },
    { name: "viewer-response", value: "viewer-response" },
  ],
  LambdaEdge: [
    { name: "viewer-request", value: "viewer-request" },
    { name: "viewer-response", value: "viewer-response" },
    { name: "origin-request", value: "origin-request" },
    { name: "origin-response", value: "origin-response" },
  ],
};

export const EN_LANGUAGE_LIST = ["en", "en_US", "en_GB"];
export const ZH_LANGUAGE_LIST = ["zh", "zh_CN", "zh_TW"];

export const GITHUB_LINK =
  "https://github.com/awslabs/aws-cloudfront-extensions";
export const URL_FEEDBACK = GITHUB_LINK + "/issues";
