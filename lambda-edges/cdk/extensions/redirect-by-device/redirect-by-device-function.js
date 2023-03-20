function handler(event) {
  var request = event.request;
  var headers = request.headers;
  var androidPath = "/android";
  var iosPath = "/ios";

  if (
    headers["cloudfront-is-ios-viewer"] &&
    headers["cloudfront-is-ios-viewer"].value === "true"
  ) {
    request.uri = iosPath + request.uri;
  } else if (
    headers["cloudfront-is-android-viewer"] &&
    headers["cloudfront-is-android-viewer"].value === "true"
  ) {
    request.uri = androidPath + request.uri;
  } 

  return request;
}
