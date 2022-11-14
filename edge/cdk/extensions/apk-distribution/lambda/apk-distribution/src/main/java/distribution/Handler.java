package distribution;

import com.amazonaws.RequestClientOptions;
import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayV2HTTPEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayV2HTTPResponse;

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.GetObjectRequest;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;

import com.meituan.android.walle.ChannelWriter;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Handler implements RequestHandler<APIGatewayV2HTTPEvent, APIGatewayV2HTTPResponse> {
  private static final String srcBucket = System.getenv("BUCKET");
  private static final String tmpBucket = System.getenv("TMPBUCKET");
  private static final String appKey = System.getenv("APPKEY");
  private static final String region = System.getenv("REGION");

  private static final Logger logger = LoggerFactory.getLogger(Handler.class);
  private static final Gson gson = new GsonBuilder().setPrettyPrinting().create();
  private static AmazonS3 s3Client = AmazonS3ClientBuilder.standard().withRegion(region).build();

  private String apkKey;
  private String channel;
  private String sign;

  @Override
  public APIGatewayV2HTTPResponse handleRequest(APIGatewayV2HTTPEvent event, Context context) {
    logger.debug("ENVIRONMENT VARIABLES: {}", gson.toJson(System.getenv()));
    logger.debug("CONTEXT: {}", gson.toJson(context));
    logger.debug("EVENT: {}", gson.toJson(event));

    this.setRequestKeys(event);

    int apkIndex = apkKey.lastIndexOf(".apk");
    if (apkKey.length() == 0 || apkIndex == -1) {
      return Util.HttpResponse(200, "key should end with .apk");
    }

    if (appKey.length() > 0 && !Util.SignValid(apkKey, channel, appKey, sign)) {
      return Util.HttpResponse(200, "sign is invalid");
    }

    String tmpApkKey = Util.TmpKey(apkKey, apkIndex, channel);
    logger.debug("tmp apk key is: {}", tmpApkKey);
    try {
      // tmp apk already exist
      if (s3Client.doesObjectExist(tmpBucket, tmpApkKey)) {
        logger.debug("tmp apk exist: {}", tmpApkKey);
        return Util.HttpResponseWithRedirectURI(302, "", "/" + tmpApkKey);
      }

      // source apk does not exist
      if (!s3Client.doesObjectExist(srcBucket, apkKey)) {
        logger.warn("source apk does not exist: {}", apkKey);
        return Util.HttpResponse(404, "");
      }

      File apkFile = new File("/tmp/tmp.apk");
      s3Client.getObject(new GetObjectRequest(srcBucket, apkKey), apkFile);
      ChannelWriter.put(apkFile, channel); // sign apk
      s3Client.putObject(tmpBucket, tmpApkKey, apkFile);

      return Util.HttpResponseWithRedirectURI(302, "", "/" + tmpApkKey);// redirect
    } catch (Exception e) {
      logger.error("Exception: {}", e.toString());
      return Util.HttpResponse(500, "internal error. " + "key: " + apkKey);
    }
  }

  private void setRequestKeys(APIGatewayV2HTTPEvent event) {
    this.apkKey = Util.GetEventKeyValue(event, "key");
    this.channel = Util.GetEventKeyValue(event, "channel");
    this.sign = Util.GetEventKeyValue(event, "sign");
  }
}