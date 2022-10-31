import boto3
from moto import mock_sns


@mock_sns
def test_sns_notify(monkeypatch):
    monkeypatch.setenv("LAMBDA_TASK_ROOT", "Lambda root", prepend=False)

    from sns_notify import lambda_handler
    import sns_notify

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
    sns_notify.snsTopicArn = resp['TopicArn']

    event = {
        "input": {
            'aws_request_id': 'aws_request_id',
            "xx": "xx",
            "fn_acm_cb": {
                "status": "SUCCEEDED"
            },
            "fn_acm_cb_handler_map": [
                {
                    "domainName": "cdn2.risetron.cn",
                    "sanList": [
                        "*.risetron.cn"
                    ],
                    "originsItemsDomainName": "xx",
                    "fn_acm_cb_handler": {
                        "Payload": {
                            "statusCode": 200,
                            "body": {
                                'aliases': ['aliases01'],
                                "distributionId": "xx",
                                "distributionArn": "arn:aws:cloudfront::xx:distribution/xx",
                                "distributionDomainName": "xx.cloudfront.net"
                            }
                        }
                    }
                },
            ]
        }
    }

    monkeypatch.setattr(sns_notify, 'get_job_info', lambda *args, **kwargs: {
        'Items': [
            {
                'cloudfront_distribution_total_number': 1,
                'cert_total_number': 1,
            }]
    })

    monkeypatch.setattr(sns_notify, 'update_job_field', lambda *args, **kwargs: {})
    resp = lambda_handler(event, {})
    assert resp['statusCode'] == 200

    monkeypatch.setattr(sns_notify, 'get_job_info', lambda *args, **kwargs: {})
    resp = lambda_handler(event, {})
    assert resp['statusCode'] == 200

    event = {
        "input": {
            'aws_request_id': 'aws_request_id',
            "xx": "xx",
            "fn_acm_import_cb": {
                "status": "SUCCEEDED"
            },
            "fn_acm_cb_handler_map": [
                {
                    "domainName": "cdn2.risetron.cn",
                    "sanList": [
                        "*.risetron.cn"
                    ],
                    "originsItemsDomainName": "xx",
                    "fn_acm_cb_handler": {
                        "Payload": {
                            "statusCode": 200,
                            "body": {
                                'aliases': ['aliases01'],
                                "distributionId": "xx",
                                "distributionArn": "arn:aws:cloudfront::xx:distribution/xx",
                                "distributionDomainName": "xx.cloudfront.net"
                            }
                        }
                    }
                },
            ]
        }
    }
    resp = lambda_handler(event, {})
    assert resp['statusCode'] == 200

