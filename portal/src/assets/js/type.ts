export interface AmplifyConfigType {
  aws_api_key: string;
  aws_project_region: string;
  aws_appsync_graphqlEndpoint: string;
  aws_appsync_region: string;
  aws_appsync_authenticationType: string;
  aws_cognito_region: string;
  aws_user_pools_id: string;
  aws_user_pools_web_client_id: string;
  aws_monitoring_url: string;
  aws_monitoring_api_key: string;
  aws_monitoring_stack_name: string;
}

export enum MetricType {
  request = "request",
  requestOrigin = "requestOrigin",
  requestLatency = "requestLatency",
  requestOriginLatency = "requestOriginLatency",
  statusCode = "statusCode",
  statusCodeOrigin = "statusCodeOrigin",
  statusCodeLatency = "statusCodeLatency",
  statusCodeOriginLatency = "statusCodeOriginLatency",
  latencyRatio = "latencyRatio",
  topNUrlRequests = "topNUrlRequests",

  bandwidth = "bandwidth",
  bandwidthOrigin = "bandwidthOrigin",
  downstreamTraffic = "downstreamTraffic",
  topNUrlSize = "topNUrlSize",

  chr = "chr",
  chrBandWidth = "chrBandWidth",
  edgeType = "edgeType",
  edgeTypeLatency = "edgeTypeLatency",
}
