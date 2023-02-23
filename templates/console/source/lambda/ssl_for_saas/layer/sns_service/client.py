import logging
import boto3


class SnsUtilsService:

    def __init__(self, logging_level=logging.INFO, logger=None):
        self.client = boto3.client('sns')
        if logger:
            self.logger = logger
        else:
            self.logger = logging.getLogger('boto3')
            self.logger.setLevel(logging_level)

    @staticmethod
    def generate_notify_content(sns_msg: str) -> str:
        # make it a code url due to sns raw format, TBD make it an official repo url
        message_to_be_published = '''
               CNAME value need to add into DNS hostzone to finish DCV: {} \n           
               Sample script for different dns providers can be found in this document: https://awslabs.github.io/aws-cloudfront-extensions/en/distribution-management/ssl-certificates/dns-validation-process/
           '''.format(sns_msg)
        return message_to_be_published

    def notify_sns_subscriber(self, sns_msg: str, sns_topic_arn: str):
        self.logger.info("deliver message: %s to sns topic arn: %s", sns_msg, sns_topic_arn)

        message_to_be_published = self.generate_notify_content(sns_msg)

        # notify to sns topic for distribution event
        self.publish_by_topic(
            topic_arn=sns_topic_arn,
            msg=message_to_be_published,
            subject='Domain Name Need to Do DCV (Domain Control Validation)'
        )
        # fixme: need to see if the result is success or not

    def publish_by_topic(self, topic_arn: str, subject: str, msg: str):
        self.client.publish(
            TopicArn=topic_arn,
            Message=str(msg),
            Subject=subject
        )
