function handler(event) {
  var request = event.request;
  var headers = request.headers;
  var host = headers.host.value;
  var reqUri = request.uri;
  var qs = request.querystring;

  var redirects = {
    de: "/de/",
    pl: "/pl/",
    gb: "/gb/",
    sa: "/sa/",
    cn: "/cn/",
    tr: "/tr/",
    eg: "/eg/",
    in: "/in/",
    th: "/th/",
    id: "/id/",
    tw: "/tw/",
    ph: "/ph/",
    my: "/my/",
    hk: "/hk/",
    jp: "/jp/",
    sg: "/sg/",
    kr: "/kr/",
    au: "/au/",
    fr: "/fr/",
    it: "/it/",
    br: "/br/",
    es: "/es/",
    ca: "/ca/",
    vn: "/vn/",
  };

  if (headers["cloudfront-viewer-country"]) {
    var country = headers["cloudfront-viewer-country"].value.toLowerCase();
    if (country in redirects && !reqUri.includes(redirects[country])) {
      var newQs = "";
      var count = Object.keys(qs).length;
      if (count > 0) {
        newQs += "?";
      }
      var qsIndex = 1;
      for (var i in qs) {
        if (qsIndex < count) {
          newQs += i + "=" + qs[i]["value"] + "&";
          qsIndex++;
        } else {
          newQs += i + "=" + qs[i]["value"];
        }
      }
      var newUrl = `https://${host}/${country}${reqUri}${newQs}`;

      return {
        statusCode: 302,
        statusDescription: "Found",
        headers: { location: { value: newUrl } },
      };
    } else {
      return request;
    }
  }

  return request;
}
