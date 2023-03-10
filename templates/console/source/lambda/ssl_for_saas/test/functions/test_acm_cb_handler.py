import os

from layer.common.constants_ import ACM_METADATA_TABLE, CONFIG_VERSION_TABLE, JOB_INFO_TABLE_NAME

# os.environ.setdefault('AWS_PROFILE', 'cloudfront_ext')
os.environ.setdefault(ACM_METADATA_TABLE,
                      'acm_metadata')
os.environ.setdefault(CONFIG_VERSION_TABLE,
                      'config_version')
os.environ.setdefault(JOB_INFO_TABLE_NAME,
                      'job_info')
os.environ.setdefault('STEP_FUNCTION_ARN',
                      'step_arn')
os.environ.setdefault('SNS_TOPIC', 'topic')


class TestAcmCbHandler:

    def test_acm_cb_handler(self, monkeypatch):
        from functions.acm_cb_handler import handler
        from functions.acm_cb_handler.types_ import Event
        event = {
            "input": {
                "value": {
                    "domainName": "refactoring-015.erinzh.com",
                    "sanList": [
                        "refactoring-015.erinzh.com"
                    ],
                    "originsItemsDomainName": "",
                    "existing_cf_info": {
                        "distribution_id": "EDZ12ZYVLJ0Y1",
                        "config_version_id": "1"
                    }
                },
                "aws_request_id": "test"
            }
        }
        event = Event(**event)

        monkeypatch.setattr(handler.job_info_client, 'update_job_fields_by_dict', lambda *args, **kwargs: {})
        monkeypatch.setattr(handler.cloudfront_client, 'construct_cloudfront_config_with_version', lambda *args, **kwargs: {})
        monkeypatch.setattr(handler.cloudfront_client, 'construct_cloudfront_config_with_dist_id', lambda *args, **kwargs: {})
        monkeypatch.setattr(handler.cloudfront_client, 'create_distribution_with_tags', lambda *args, **kwargs: {
            "Id": 'id',
            "ARN": 'arn',
            "DomainName": 'domainname'
        })

        handler.handler(event, {})

        event = {
            "input": {
                "value": {
                    "domainName": "refactoring-015.erinzh.com",
                    "sanList": [
                        "refactoring-015.erinzh.com"
                    ],
                    "originsItemsDomainName": "",
                    "existing_cf_info": {
                        "distribution_id": "EDZ12ZYVLJ0Y1",
                    }
                },
                "aws_request_id": "test"
            }
        }
        event = Event(**event)

        handler.handler(event, {})
