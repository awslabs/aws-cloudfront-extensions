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


class TestAcmCbCron:
    def test_acm_cron(self, monkeypatch):
        from functions.acm_cron import handler
        monkeypatch.setattr(handler.acm_client, 'fetch_acm_status_from_waiting_list', lambda *args, **kwargs: {})
        handler.handler({}, {})
        