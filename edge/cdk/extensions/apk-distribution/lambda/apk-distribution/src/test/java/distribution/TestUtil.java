package distribution;

import com.amazonaws.services.lambda.runtime.events.APIGatewayV2HTTPEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayV2HTTPResponse;

import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

public class TestUtil {
  public TestUtil() {
  }

  @Test
  @DisplayName("get event key")
  void getEventKey() {
    APIGatewayV2HTTPEvent event = APIGatewayV2HTTPEvent.builder().build();
    Assertions.assertEquals("", Util.GetEventKeyValue(event, "test"));

    Map<String, String> parameters = new HashMap<>();
    parameters.put("test", "test");
    event = APIGatewayV2HTTPEvent.builder().withQueryStringParameters(parameters).build();
    Assertions.assertEquals("test", Util.GetEventKeyValue(event, "test"));
  }

  @Test
  @DisplayName("check sign")
  void checkSign() {
    Assertions.assertTrue(Util.SignValid("aws.apk", "aws", "aws", "90232e4131eb5f44577eca305bd5fd77"));
    Assertions.assertFalse(Util.SignValid("aws.apk", "aws", "aws", "abcdefg"));
  }

  @Test
  @DisplayName("tmp key")
  void tmpKey() {
    String tmpKey = Util.TmpKey("aws.apk", "aws.apk".lastIndexOf(".apk"), "aws");
    Assertions.assertEquals("aws_aws.apk", tmpKey);

    tmpKey = Util.TmpKey("aws_v1.0.1.apk", "aws_v1.0.1.apk".lastIndexOf(".apk"), "aws");
    Assertions.assertEquals("aws_v1.0.1_aws.apk", tmpKey);

    tmpKey = Util.TmpKey("apk/aws_v1.0.1.apk", "apk/aws_v1.0.1.apk".lastIndexOf(".apk"), "aws");
    Assertions.assertEquals("apk/aws_v1.0.1_aws.apk", tmpKey);

    tmpKey = Util.TmpKey("aws.apk", "aws.apk".lastIndexOf(".apk"), "");
    Assertions.assertEquals("aws.apk", tmpKey);
  }

  @Test
  @DisplayName("http response")
  void httpResponse() {
    APIGatewayV2HTTPResponse event = Util.HttpResponse(200, null);
    Assertions.assertEquals(200, event.getStatusCode());

    event = Util.HttpResponseWithRedirectURI(200, null, "/aws.apk");
    Assertions.assertEquals(200, event.getStatusCode());
    Assertions.assertEquals("/aws.apk", event.getHeaders().get("Location"));
  }
}
