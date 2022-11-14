package distribution;

import com.amazonaws.services.lambda.runtime.events.APIGatewayV2HTTPEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayV2HTTPResponse;

import org.apache.commons.codec.digest.DigestUtils;

import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Util {
  private static final Logger logger = LoggerFactory.getLogger(Util.class);

  public static String GetEventKeyValue(APIGatewayV2HTTPEvent event, String key) {
    if (event.getQueryStringParameters() != null && event.getQueryStringParameters().containsKey(key)) {
      return event.getQueryStringParameters().get(key);
    }
    return "";
  }

  public static APIGatewayV2HTTPResponse HttpResponseWithRedirectURI(int statusCode, String body,
      String redirectURI) {
    APIGatewayV2HTTPResponse response = new APIGatewayV2HTTPResponse();
    if (redirectURI != null) {
      logger.debug("redirctURI is: {}", redirectURI);
      Map<String, String> headers = new HashMap<>();
      headers.put("Location", redirectURI);
      response.setHeaders(headers);
    }
    response.setStatusCode(statusCode);
    response.setBody(body);
    return response;
  }

  public static APIGatewayV2HTTPResponse HttpResponse(int statusCode, String body) {
    return HttpResponseWithRedirectURI(statusCode, body, null);
  }

  public static boolean SignValid(String apkKey, String channel, String appKey, String sign) {
    if (sign.length() == 0) {
      logger.warn("sign is not provide");
      return false;
    }
    String correctSign = DigestUtils.md5Hex(apkKey + channel + appKey);
    if (!correctSign.equals(sign)) {
      logger.warn("the sign is: {}, verify sign is: {}", sign, correctSign);
      return false;
    }
    return true;
  }

  public static String TmpKey(String apkKey, int apkIndex, String channel) {
    if (channel.length() == 0) {
      return apkKey;
    }
    return apkKey.substring(0, apkIndex) + "_" + channel + ".apk";
  }
}
