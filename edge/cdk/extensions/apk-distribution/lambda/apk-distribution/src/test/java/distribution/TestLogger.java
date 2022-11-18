package distribution;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.amazonaws.services.lambda.runtime.LambdaLogger;

import org.junit.jupiter.api.Assertions;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

public class TestLogger implements LambdaLogger {
  private static final Logger logger = LoggerFactory.getLogger(TestLogger.class);

  public TestLogger() {
  }

  public void log(String message) {
    logger.info(message);
  }

  public void log(byte[] message) {
    logger.info(new String(message));
  }

  @Test
  @DisplayName("Logger Level is in WARN")
  void logInfo() {
    Assertions.assertFalse(logger.isTraceEnabled());
    Assertions.assertFalse(logger.isDebugEnabled());
    Assertions.assertFalse(logger.isInfoEnabled());
    Assertions.assertTrue(logger.isWarnEnabled());
    Assertions.assertTrue(logger.isErrorEnabled());
  }
}
