import logging
import uuid
import boto3
import os
import json
from job_table_utils import create_job_info, update_job_cert_completed_number, update_job_cloudfront_distribution_created_number

# certificate need to create in region us-east-1 for cloudfront to use
acm = boto3.client('acm', region_name='us-east-1')

LAMBDA_TASK_ROOT = os.environ.get('LAMBDA_TASK_ROOT')
JOB_INFO_TABLE_NAME = os.environ.get('JOB_INFO_TABLE')

logger = logging.getLogger('boto3')
logger.setLevel(logging.INFO)

# add execution path
os.environ['PATH'] = os.environ['PATH'] + ':' + os.environ['LAMBDA_TASK_ROOT']

# get sns topic arn from environment variable
snsTopicArn = os.environ.get('SNS_TOPIC')


def lambda_handler(event, context):
    """

    :param event:
    :param context:
    """
    logger.info("Received event: " + json.dumps(event))

    # {
    #     "input": {
    #       "acm_op": "import",
    #       "auto_creation": "true",
    #       "dist_aggregate": "false",
    #       "enable_cname_check": "false",
    #       "cnameList": [
    #           {
    #               "domainName": "test-ssl-for-saas.dev.demo.solutions.aws.a2z.org.cn",
    #               "sanList": [
    #                   "test-ssl-for-saas.dev.demo.solutions.aws.a2z.org.cn"
    #               ],
    #               "originsItemsDomainName": "cloudfront-test-source-bucket-2021.s3.us-east-1.amazonaws.com"
    #           }
    #       ],
    #       "pemList": [
    #           {
    #               "CertPem": "\n-----BEGIN CERTIFICATE-----\nMIIFYTCCBEmgAwIBAgISBGLdMsQ95XN24YtdHCvrtgBdMA0GCSqGSIb3DQEBCwUAMDIxCzAJBgNVBAYTAlVTMRYwFAYDVQQKEw1MZXQncyBFbmNyeXB0MQswCQYDVQQDEwJSMzAeFw0yMjA0MjAwMTM5NTlaFw0yMjA3MTkwMTM5NThaMDkxNzA1BgNVBAMTLnNzbC1mb3Itc2Fhcy5kZXYuZGVtby5zb2x1dGlvbnMuYXdzLmEyei5vcmcuY24wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDi0ftDDVW+WtCDyMu+2cpoga3VvUhcbI81oM+W+Sjk3uxtNWPRkIQSVchPbcPgoRhWEusaJtrCSmMXG3pS2KdD4Vfet+jaesxxltZk1cpcm5oR39BYn7i+0TqroNAXyY3YtziT0Z3JwMzj7e/sVqHEFePQzR1ccgqLtBHPWY4lHqt6mDg5DRCLnyYPev1knef+ZYj/YIQg/jGGPzE3jM0W87FM14m6xTQgipcIm9Nt9JZ/dW7i+UwUtdI+QEM3UvxpkVWrXubwb9JgYn40BcGKb7AOoYde5dNXChVWoAMpQg0NUSbSoAnTbNz/ExIa2z2uxC7bpsyQO6X6WTZKgjh1AgMBAAGjggJoMIICZDAOBgNVHQ8BAf8EBAMCBaAwHQYDVR0lBBYwFAYIKwYBBQUHAwEGCCsGAQUFBwMCMAwGA1UdEwEB/wQCMAAwHQYDVR0OBBYEFIx8OXo3JZYZnRq8f2BJrZTWhtt4MB8GA1UdIwQYMBaAFBQusxe3WFbLrlAJQOYfr52LFMLGMFUGCCsGAQUFBwEBBEkwRzAhBggrBgEFBQcwAYYVaHR0cDovL3IzLm8ubGVuY3Iub3JnMCIGCCsGAQUFBzAChhZodHRwOi8vcjMuaS5sZW5jci5vcmcvMDkGA1UdEQQyMDCCLnNzbC1mb3Itc2Fhcy5kZXYuZGVtby5zb2x1dGlvbnMuYXdzLmEyei5vcmcuY24wTAYDVR0gBEUwQzAIBgZngQwBAgEwNwYLKwYBBAGC3xMBAQEwKDAmBggrBgEFBQcCARYaaHR0cDovL2Nwcy5sZXRzZW5jcnlwdC5vcmcwggEDBgorBgEEAdZ5AgQCBIH0BIHxAO8AdQDfpV6raIJPH2yt7rhfTj5a6s2iEqRqXo47EsAgRFwqcwAAAYBE10OzAAAEAwBGMEQCIDIE9Kw84dYjnh03gpMPPguZgmvpmcE+eQH/B7y7922bAiACZJEvftcsCqSRTwEbYalf9QPdhceLK2OMnGrPbqWMFAB2ACl5vvCeOTkh8FZzn2Old+W+V32cYAr4+U1dJlwlXceEAAABgETXQ6IAAAQDAEcwRQIhAKQwDKaAceXuoK4T0M0f4u2loa9i+4QlGclUO8Wg6GfdAiAgyxXmJDqsfALC96CWLYRrVxzPkwbELttvDJ8FRusrejANBgkqhkiG9w0BAQsFAAOCAQEALyW1OHHZ33H/Dyh6LLQZ68MTTJoToylv4qxxOPEjtoyJ/R6HS/HF5dW7Z7gUW4PmTZb5PqJXo7LWi4M173eBTi7snAnF2OHx4pnRXDX8RtBhRpwRuD7QGLOlapMgu3yS5mmjJjjEI20OHhR5NzWXoVAekcWUGd1BzZH9NR+mLBSImL32trXqT85aH4ihRxV21fBg/NsaG9RtFYVCGIEst9Ny7eY8O6lUBOhFgKlz3tKQlH8dxESm6KyScKTg02Ky4grHYHTtIlflEMU/tRDcqiCRzXjFURMgRWSd5m0nV6EOuxqd0NXcrX/x4Ohfj9KCpadgb0Q0uhV2NR6GSgYWoQ==\n-----END CERTIFICATE-----\n",
    #               "PrivateKeyPem": "\n-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDi0ftDDVW+WtCDyMu+2cpoga3VvUhcbI81oM+W+Sjk3uxtNWPRkIQSVchPbcPgoRhWEusaJtrCSmMXG3pS2KdD4Vfet+jaesxxltZk1cpcm5oR39BYn7i+0TqroNAXyY3YtziT0Z3JwMzj7e/sVqHEFePQzR1ccgqLtBHPWY4lHqt6mDg5DRCLnyYPev1knef+ZYj/YIQg/jGGPzE3jM0W87FM14m6xTQgipcIm9Nt9JZ/dW7i+UwUtdI+QEM3UvxpkVWrXubwb9JgYn40BcGKb7AOoYde5dNXChVWoAMpQg0NUSbSoAnTbNz/ExIa2z2uxC7bpsyQO6X6WTZKgjh1AgMBAAECggEAPp5z/K34xwWxXUCZJ0ZfP/zVLhYEnSeHXenYhbih1pXItdmwhhGctKckFvGZyzEOU+0DJQQnDs6UjrOSUL7pZq8WoDErwu119cILzGjNZkW7AkZE8cKesWd4CBvsdzS4yWTD5ONQ6Xsl1aNBwoCkRks4ytNl0LjXOnxrElCKEqrgzNGLY4RtwWSMyODOqAxR+xU1pQi8Vgw07XN/E8ervYyXWC7o9XERNXm1y2FOW8kJ0fPKv6sOycjjjkKAVtL/wXqQxWUT4sLN+A/7Vbvc7GFxkh0OfDLZsXU5ZdSESM4G58Hicev6UpEIPGN8Lon6ljWN+fHW6r9bSM2uHzWzYQKBgQD6QuC8zmkQqJ9HPndKZuwJP2decCyHrc6Fi7KZL0MPSEIwHBi6xscTo1/VKwyJFjIJVvyeeGGdYDS15qUiRZsc2gdswnZZazp1W+NgJ3OCsv38s3bNWZ07PA2z8cRIDtVUTNwCDzEy5H5nKvbYGFidab5RE2L0KIbYa40WexcxKQKBgQDoBX8jKupjN09ND3I127V96v5wXiDoavjYJJgpDpLmL5T0ByEScH2LbzeWMzPyiDcPkhYg1V1PlTJok1e9+w1IhrghpfiYDLDN2DJElMgzbxbV7b4uJyp8gqEbRSpeu7TCSpWSDc8UE/9Fr/L1rvF7jMylCYmaOb79aGlLMWc6bQKBgBwfyevN8oa5vHSgM328BUigxHgbeRWiVbQyV9bZNdsQzsdjUPAkiJjPYmStWtJJGURtbyRL+QRbnHDYw7QPSHg8lFsHm48++qnXsrzKkjOc8+gjLvWy3XWbsRqIz/sdF6JKpOriVDAY94+Wh3kPe13tVUL9P8CakVTe+VMOcDPJAoGAZ8NViWe+7OImb+MRg66faxG1+pDODMMSSK+M8QeYgKMU7VFm4/U04C+730tE1xk97pO5m7NwCJBDu+rxGYB1/1JodHviQjWiuFwQlwUmx4HN55xsKf3QDWDqJeT3vugZPa7XVzsfue37grHeaSt0yXk9aC1swXFDzdZtCHiunr0CgYEAvSUNCf++/6LeM/3kpjgqezCTwyCGOjmpaR6ozTgQmPHnMDmC6pHslpU55LKl0F9PtDGCpqayWl/j4TS6VKHjudb1a26VTnQgIlZuOT6N+69kCIpZQxGpLpWYiqcFFZ+A2QwjmUe9MoBLh2K2a6MRoNQg2QQJ1r4UW+7U1tdFn90=\n-----END PRIVATE KEY-----\n",
    #               "ChainPem": "\n-----BEGIN CERTIFICATE-----\nMIIFFjCCAv6gAwIBAgIRAJErCErPDBinU/bWLiWnX1owDQYJKoZIhvcNAQELBQAwTzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2VhcmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwHhcNMjAwOTA0MDAwMDAwWhcNMjUwOTE1MTYwMDAwWjAyMQswCQYDVQQGEwJVUzEWMBQGA1UEChMNTGV0J3MgRW5jcnlwdDELMAkGA1UEAxMCUjMwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC7AhUozPaglNMPEuyNVZLD+ILxmaZ6QoinXSaqtSu5xUyxr45r+XXIo9cPR5QUVTVXjJ6oojkZ9YI8QqlObvU7wy7bjcCwXPNZOOftz2nwWgsbvsCUJCWH+jdxsxPnHKzhm+/b5DtFUkWWqcFTzjTIUu61ru2P3mBw4qVUq7ZtDpelQDRrK9O8ZutmNHz6a4uPVymZ+DAXXbpyb/uBxa3Shlg9F8fnCbvxK/eG3MHacV3URuPMrSXBiLxgZ3Vms/EY96Jc5lP/Ooi2R6X/ExjqmAl3P51T+c8B5fWmcBcUr2Ok/5mzk53cU6cG/kiFHaFpriV1uxPMUgP17VGhi9sVAgMBAAGjggEIMIIBBDAOBgNVHQ8BAf8EBAMCAYYwHQYDVR0lBBYwFAYIKwYBBQUHAwIGCCsGAQUFBwMBMBIGA1UdEwEB/wQIMAYBAf8CAQAwHQYDVR0OBBYEFBQusxe3WFbLrlAJQOYfr52LFMLGMB8GA1UdIwQYMBaAFHm0WeZ7tuXkAXOACIjIGlj26ZtuMDIGCCsGAQUFBwEBBCYwJDAiBggrBgEFBQcwAoYWaHR0cDovL3gxLmkubGVuY3Iub3JnLzAnBgNVHR8EIDAeMBygGqAYhhZodHRwOi8veDEuYy5sZW5jci5vcmcvMCIGA1UdIAQbMBkwCAYGZ4EMAQIBMA0GCysGAQQBgt8TAQEBMA0GCSqGSIb3DQEBCwUAA4ICAQCFyk5HPqP3hUSFvNVneLKYY611TR6WPTNlclQtgaDqw+34IL9fzLdwALduO/ZelN7kIJ+m74uyA+eitRY8kc607TkC53wlikfmZW4/RvTZ8M6UK+5UzhK8jCdLuMGYL6KvzXGRSgi3yLgjewQtCPkIVz6D2QQzCkcheAmCJ8MqyJu5zlzyZMjAvnnAT45tRAxekrsu94sQ4egdRCnbWSDtY7kh+BImlJNXoB1lBMEKIq4QDUOXoRgffuDghje1WrG9ML+Hbisq/yFOGwXD9RiX8F6sw6W4avAuvDszue5L3sz85K+EC4Y/wFVDNvZo4TYXao6Z0f+lQKc0t8DQYzk1OXVu8rp2yJMC6alLbBfODALZvYH7n7do1AZls4I9d1P4jnkDrQoxB3UqQ9hVl3LEKQ73xF1OyK5GhDDX8oVfGKF5u+decIsH4YaTw7mP3GFxJSqv3+0lUFJoi5Lc5da149p90IdshCExroL1+7mryIkXPeFM5TgO9r0rvZaBFOvV2z0gp35Z0+L4WPlbuEjN/lxPFin+HlUjr8gRsI3qfJOQFy/9rKIJR0Y/8Omwt/8oTWgy1mdeHmmjk7j1nYsvC9JSQ6ZvMldlTTKB3zhThV1+XWYp6rjd5JW1zbVWEkLNxE7GJThEUG3szgBVGP7pSWTUTsqXnLRbwHOoq7hHwg==\n-----END CERTIFICATE-----\n-----BEGIN CERTIFICATE-----\nMIIFYDCCBEigAwIBAgIQQAF3ITfU6UK47naqPGQKtzANBgkqhkiG9w0BAQsFADA/MSQwIgYDVQQKExtEaWdpdGFsIFNpZ25hdHVyZSBUcnVzdCBDby4xFzAVBgNVBAMTDkRTVCBSb290IENBIFgzMB4XDTIxMDEyMDE5MTQwM1oXDTI0MDkzMDE4MTQwM1owTzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2VhcmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwggIiMA0GCSqGSIb3DQEBAQUAA4ICDwAwggIKAoICAQCt6CRz9BQ385ueK1coHIe+3LffOJCMbjzmV6B493XCov71am72AE8o295ohmxEk7axY/0UEmu/H9LqMZshftEzPLpI9d1537O4/xLxIZpLwYqGcWlKZmZsj348cL+tKSIG8+TA5oCu4kuPt5l+lAOf00eXfJlII1PoOK5PCm+DLtFJV4yAdLbaL9A4jXsDcCEbdfIwPPqPrt3aY6vrFk/CjhFLfs8L6P+1dy70sntK4EwSJQxwjQMpoOFTJOwT2e4ZvxCzSow/iaNhUd6shweU9GNx7C7ib1uYgeGJXDR5bHbvO5BieebbpJovJsXQEOEO3tkQjhb7t/eo98flAgeYjzYIlefiN5YNNnWe+w5ysR2bvAP5SQXYgd0FtCrWQemsAXaVCg/Y39W9Eh81LygXbNKYwagJZHduRze6zqxZXmidf3LWicUGQSk+WT7dJvUkyRGnWqNMQB9GoZm1pzpRboY7nn1ypxIFeFntPlF4FQsDj43QLwWyPntKHEtzBRL8xurgUBN8Q5N0s8p0544fAQjQMNRbcTa0B7rBMDBcSLeCO5imfWCKoqMpgsy6vYMEG6KDA0Gh1gXxG8K28Kh8hjtGqEgqiNx2mna/H2qlPRmP6zjzZN7IKw0KKP/32+IVQtQi0Cdd4Xn+GOdwiK1O5tmLOsbdJ1Fu/7xk9TNDTwIDAQABo4IBRjCCAUIwDwYDVR0TAQH/BAUwAwEB/zAOBgNVHQ8BAf8EBAMCAQYwSwYIKwYBBQUHAQEEPzA9MDsGCCsGAQUFBzAChi9odHRwOi8vYXBwcy5pZGVudHJ1c3QuY29tL3Jvb3RzL2RzdHJvb3RjYXgzLnA3YzAfBgNVHSMEGDAWgBTEp7Gkeyxx+tvhS5B1/8QVYIWJEDBUBgNVHSAETTBLMAgGBmeBDAECATA/BgsrBgEEAYLfEwEBATAwMC4GCCsGAQUFBwIBFiJodHRwOi8vY3BzLnJvb3QteDEubGV0c2VuY3J5cHQub3JnMDwGA1UdHwQ1MDMwMaAvoC2GK2h0dHA6Ly9jcmwuaWRlbnRydXN0LmNvbS9EU1RST09UQ0FYM0NSTC5jcmwwHQYDVR0OBBYEFHm0WeZ7tuXkAXOACIjIGlj26ZtuMA0GCSqGSIb3DQEBCwUAA4IBAQAKcwBslm7/DlLQrt2M51oGrS+o44+/yQoDFVDC5WxCu2+b9LRPwkSICHXM6webFGJueN7sJ7o5XPWioW5WlHAQU7G75K/QosMrAdSW9MUgNTP52GE24HGNtLi1qoJFlcDyqSMo59ahy2cI2qBDLKobkx/J3vWraV0T9VuGWCLKTVXkcGdtwlfFRjlBz4pYg1htmf5X6DYO8A4jqv2Il9DjXA6USbW1FzXSLr9Ohe8Y4IWS6wY7bCkjCWDcRQJMEhg76fsO3txE+FiYruq9RUWhiF1myv4Q6W+CyBFCDfvp7OOGAN6dEOM4+qR9sdjoSYKEBpsr6GtPAQw4dy753ec5\n-----END CERTIFICATE-----\n",
    #               "originsItemsDomainName": "cloudfront-test-source-bucket-2021.s3.us-east-1.amazonaws.com"
    #           }
    #       ],
    #       "fn_acm_import_cb": {
    #           "status": "SUCCEEDED"
    #       },
    #       "error": {
    #           "Error": "RetryError",
    #           "Cause": "{\"errorMessage\":\"RetryError[<Future at 0x7f26508fbe20 state=finished raised Timeout>]\",\"errorType\":\"RetryError\",\"stackTrace\":[\"  File \\\"/var/task/acm_cb_handler.py\\\", line 233, in lambda_handler\\n    response = scan_for_cert(callback_table, domain_name)\\n\",\"  File \\\"/var/task/tenacity/__init__.py\\\", line 324, in wrapped_f\\n    return self(f, *args, **kw)\\n\",\"  File \\\"/var/task/tenacity/__init__.py\\\", line 404, in __call__\\n    do = self.iter(retry_state=retry_state)\\n\",\"  File \\\"/var/task/tenacity/__init__.py\\\", line 361, in iter\\n    raise retry_exc from fut.exception()\\n\"]}"
    #       },
    #       "fn_failure_handling": {
    #           "ExecutedVersion": "$LATEST",
    #           "Payload": {
    #               "statusCode": 400,
    #               "body": "\"step to clean up the resources completed\""
    #       },
    #     "SdkHttpMetadata": {
    #         "AllHttpHeaders": {
    #             "X-Amz-Executed-Version": [
    #                 "$LATEST"
    #             ],
    #             "x-amzn-Remapped-Content-Length": [
    #                 "0"
    #             ],
    #             "Connection": [
    #                 "keep-alive"
    #             ],
    #             "x-amzn-RequestId": [
    #                 "140aef3a-d8b0-4dad-829c-4e82c1be458a"
    #             ],
    #             "Content-Length": [
    #                 "75"
    #             ],
    #             "Date": [
    #                 "Tue, 26 Apr 2022 08:00:31 GMT"
    #             ],
    #             "X-Amzn-Trace-Id": [
    #                 "root=1-6267a69e-229df7b21381207c6e89044f;sampled=0"
    #             ],
    #             "Content-Type": [
    #                 "application/json"
    #             ]
    #         },
    #         "HttpHeaders": {
    #             "Connection": "keep-alive",
    #             "Content-Length": "75",
    #             "Content-Type": "application/json",
    #             "Date": "Tue, 26 Apr 2022 08:00:31 GMT",
    #             "X-Amz-Executed-Version": "$LATEST",
    #             "x-amzn-Remapped-Content-Length": "0",
    #             "x-amzn-RequestId": "140aef3a-d8b0-4dad-829c-4e82c1be458a",
    #             "X-Amzn-Trace-Id": "root=1-6267a69e-229df7b21381207c6e89044f;sampled=0"
    #         },
    #         "HttpStatusCode": 200
    #     },
    #     "SdkResponseMetadata": {
    #         "RequestId": "140aef3a-d8b0-4dad-829c-4e82c1be458a"
    #     },
    #     "StatusCode": 200
    # }
    #     }
    # }

    message_to_be_published = {
        'Deployment Status': 'Failure',
        'Details': str(event['input']),
    }

    # notify to sns topic for distribution event
    sns_client = boto3.client('sns')
    sns_client.publish(
        TopicArn=snsTopicArn,
        Message=str(message_to_be_published),
        Subject='SSL for SaaS generation failure occurred'
    )

    return {
        'statusCode': 200,
        'body': json.dumps('SNS Notification Sent')
    }
