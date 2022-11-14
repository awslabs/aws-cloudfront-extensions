package distribution;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayV2HTTPEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayV2HTTPResponse;

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.GetObjectRequest;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;

import com.meituan.android.walle.ChannelWriter;
import org.apache.commons.codec.digest.DigestUtils;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Handler implements RequestHandler<APIGatewayV2HTTPEvent, APIGatewayV2HTTPResponse> {
  private static final Logger logger = LoggerFactory.getLogger(Handler.class);
  private static final Gson gson = new GsonBuilder().setPrettyPrinting().create();
  private static final String srcBucket = System.getenv("BUCKET");
  private static final String tmpBucket = System.getenv("TMPBUCKET");
  private static final String appKey = System.getenv("APPKEY");

  @Override
  public APIGatewayV2HTTPResponse handleRequest(APIGatewayV2HTTPEvent event, Context context) {
    logger.debug("ENVIRONMENT VARIABLES: {}", gson.toJson(System.getenv()));
    logger.debug("CONTEXT: {}", gson.toJson(context));
    logger.debug("EVENT: {}", gson.toJson(event));

    String apkKey = Handler.GetEventKeyValue(event, "key");

    if (apkKey.length() == 0) {
      return httpResponse(200, "key is empty");
    }

    int apkIndex = apkKey.lastIndexOf(".apk");
    if (apkIndex == -1) {
      return httpResponse(200, "key should end with .apk");
    }

    String channel = Handler.GetEventKeyValue(event, "channel");

    if (appKey.length() > 0) {
      String sign = Handler.GetEventKeyValue(event, "sign");
      if (sign.length() == 0) {
        logger.warn("sign is not provide");
        return httpResponse(200, "sign is need");
      }
      String correctSign = DigestUtils.md5Hex(apkKey + channel + appKey);
      if (!correctSign.equals(sign)) {
        logger.warn("the sign is: {}, verify sign is: {}", sign, correctSign);
        return httpResponse(200, "incorrect sign");
      }
    }

    AmazonS3 s3Client = AmazonS3ClientBuilder.defaultClient();
    try {
      // tmp apk key
      String tmpApkKey = apkKey.substring(0, apkIndex) + "_" + channel + ".apk";
      if (channel.isEmpty()) {
        tmpApkKey = apkKey;
      }

      // tmp apk already exist
      if (s3Client.doesObjectExist(tmpBucket, tmpApkKey)) {
        logger.debug("tmp apk exist: {}", tmpApkKey);
        Map<String, String> headers = new HashMap<>();
        headers.put("Location", "/" + tmpApkKey);
        return httpResponseWithHeader(302, "", headers);
      }

      // source apk does not exist
      if (!s3Client.doesObjectExist(srcBucket, apkKey)) {
        logger.warn("source apk does not exist: {}", apkKey);
        return httpResponse(404, "");
      }

      // download object
      File apkFile = new File("/tmp/tmp.apk");
      s3Client.getObject(new GetObjectRequest(srcBucket, apkKey), apkFile);

      // sign apk
      ChannelWriter.put(apkFile, channel);

      // upload to s3
      InputStream targetStream = new FileInputStream(apkFile);
      ObjectMetadata metaData = new ObjectMetadata();
      metaData.setContentLength(apkFile.length());
      s3Client.putObject(tmpBucket, tmpApkKey, targetStream, metaData);

      // redirect
      Map<String, String> headers = new HashMap<>();
      headers.put("Location", "/" + tmpApkKey);
      return httpResponseWithHeader(302, "", headers);
    } catch (Exception e) {
      logger.error("Exception: {}", e.toString());
      return httpResponse(500, "internal error. " + "key: " + apkKey);
    }
  }

  public static String GetEventKeyValue(APIGatewayV2HTTPEvent event, String key) {
    if (event.getQueryStringParameters() != null && event.getQueryStringParameters().containsKey(key)) {
      return event.getQueryStringParameters().get(key);
    }
    return "";
  }

  private static APIGatewayV2HTTPResponse httpResponseWithHeader(int statusCode, String body,
      Map<String, String> headers) {
    APIGatewayV2HTTPResponse response = new APIGatewayV2HTTPResponse();
    if (headers != null && !headers.isEmpty()) {
      logger.debug("Response header set: {}", headers.toString());
      response.setHeaders(headers);
    }
    response.setStatusCode(statusCode);
    response.setBody(body);
    return response;
  }

  private static APIGatewayV2HTTPResponse httpResponse(int statusCode, String body) {
    return httpResponseWithHeader(statusCode, body, null);
  }
}