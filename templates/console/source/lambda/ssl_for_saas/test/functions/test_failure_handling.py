import os

from layer.common.constants_ import ACM_METADATA_TABLE, CONFIG_VERSION_TABLE, JOB_INFO_TABLE_NAME

os.environ.setdefault('AWS_PROFILE', 'cloudfront_ext')
os.environ.setdefault(ACM_METADATA_TABLE,
                      'acm_metadata')
os.environ.setdefault(CONFIG_VERSION_TABLE,
                      'config_version')
os.environ.setdefault(JOB_INFO_TABLE_NAME,
                      'job_info')
os.environ.setdefault('STEP_FUNCTION_ARN',
                      'step_arn')
os.environ.setdefault('SNS_TOPIC', 'topic')

class TestFailureHandling:

    def test_failure_handling(self, monkeypatch):
        from functions.failure_handling import handler

        event = {
            'input': {
                'aws_request_id': 'id'
            }
        }
        monkeypatch.setattr(handler.acm_client, 'scan_by_job_token', lambda *args, **kwargs: [
            {
                'taskToken': '',
                'domainName': ''
            }
        ])
        monkeypatch.setattr(handler.acm_client,  'delete_by_task_id_and_domain', lambda *args, **kwargs: {
            'taskToken': '',
            'domainName': ''
        })
        handler.handler(event, {})
        monkeypatch.setattr(handler.acm_client,  'scan_by_job_token', lambda *args, **kwargs: Exception('e'), raising=True)
        handler.handler(event, {})
