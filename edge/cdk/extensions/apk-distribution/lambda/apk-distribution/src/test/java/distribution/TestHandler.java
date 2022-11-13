package distribution;

import com.amazonaws.services.lambda.runtime.events.APIGatewayV2HTTPEvent;

import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

public class TestHandler {
  public TestHandler() {
  }

  @Test
  @DisplayName("Handler get event key does not exsit")
  void getUnexistKey() {
    APIGatewayV2HTTPEvent event = APIGatewayV2HTTPEvent.builder().build();
    Assertions.assertEquals("", Handler.GetEventKeyValue(event, "test"));
  }

  @Test
  @DisplayName("Handler get event key exsit")
  void getExistKey() {
    Map<String, String> parameters = new HashMap<>();
    parameters.put("test", "test");
    APIGatewayV2HTTPEvent event = APIGatewayV2HTTPEvent.builder().withQueryStringParameters(parameters).build();
    Assertions.assertEquals("test", Handler.GetEventKeyValue(event, "test"));
  }
}
