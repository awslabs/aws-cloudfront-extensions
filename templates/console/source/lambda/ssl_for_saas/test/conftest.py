import pytest
import os

print("CONFTEST LOADED")

@pytest.fixture
def aws_credentials():
    """Mocked AWS Credentials for moto."""
    os.environ["AWS_PROFILE"] = "cloudfront_ext"
    os.environ["AWS_ACCESS_KEY_ID"] = "cloudfront_ext"
    os.environ["AWS_SECRET_ACCESS_KEY"] = "cloudfront_ext"
    os.environ["AWS_SECURITY_TOKEN"] = "cloudfront_ext"
    os.environ["AWS_SESSION_TOKEN"] = "cloudfront_ext"
    os.environ["AWS_DEFAULT_REGION"] = "us-east-1"
