import boto3
from moto import mock_sns


@mock_sns
def test_lambda_handler(monkeypatch):
    monkeypatch.setenv("LAMBDA_TASK_ROOT", "Lambda root", prepend=False)

    from sns_failure_notify import lambda_handler
    import sns_failure_notify
    sns_client = boto3.client('sns')

    resp = sns_client.create_topic(
        Name='CloudFront_Distribution_Notification',
        Attributes={
            'string': 'string'
        },
        Tags=[
            {
                'Key': 'string',
                'Value': 'string'
            },
        ],
    )
    sns_failure_notify.snsTopicArn = resp['TopicArn']
    monkeypatch.setattr(sns_failure_notify, 'update_job_field', lambda *args, **kwargs: {})
    monkeypatch.setattr(sns_failure_notify, 'get_job_info', lambda *args, **kwargs: {})
    event = {
        'input': {
            'aws_request_id': 'request id',
            'error': {
                'Cause': 'causes'
            }
        }
    }
    lambda_handler(event, {})

    monkeypatch.setattr(sns_failure_notify, 'get_job_info', lambda *args, **kwargs: {
        'Items': [{
            'distStageStatus': 'INPROGRESS'
        }]
    })
    lambda_handler(event, {})
    event = {
        'input': {
            'aws_request_id': 'request id',
            'error': {
                'Cause': '',
                'Error': 'error'
            }
        }
    }
    lambda_handler(event, {})



