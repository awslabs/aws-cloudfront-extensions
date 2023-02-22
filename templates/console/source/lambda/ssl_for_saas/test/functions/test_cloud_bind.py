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

class TestCloudFrontBind:

    def test_cloudfront_bind(self, monkeypatch):
        event = {
            'input': {
                'fn_cloudfront_bind': {
                    'Payload': {
                        "body": {
                            "distributionId": "1234"
                        }
                    }
                },
                "value": {
                    "domainName": "workflow002.erinzh.com",
                    "sanList": [
                        "workflow002.erinzh.com"
                    ],
                    "originsItemsDomainName": "",
                    "existing_cf_info": {
                        "distribution_id": "EDZ12ZYVLJ0Y1",
                        "config_version_id": "1"
                    },
                    "fn_cloudfront_bind": {
                        "Payload": {
                            "statusCode": 200,
                            "body": {
                                "distributionId": "E3U0EWVS0978CR",
                                "distributionArn": "arn:aws:cloudfront::${ACCOUNT_ID}:distribution/E3U0EWVS0978CR",
                                "distributionDomainName": "d2tmq1ppzhlmip.cloudfront.net",
                                "aliases": {
                                    "Quantity": 0
                                }
                            }
                        }
                    }
                }
            }
        }
        from functions.cloudfront_bind import handler
        e = handler.Event(**event)
        monkeypatch.setattr(handler.acm_client, 'scan_for_cert', lambda *args, **kwargs: [
            {
                "certArn": 'arn',
                "taskToken": 'token',
                "jobToken": 'jobtoken'
            }
        ])
        monkeypatch.setattr(handler.acm_client, 'delete_by_task_id_and_domain', lambda *args, **kwargs: {})
        monkeypatch.setattr(handler.job_info_client, 'update_job_fields_by_dict', lambda *args, **kwargs: {})
        monkeypatch.setattr(handler.job_info_client, 'get_job_info_by_id', lambda *args, **kwargs: {
            "cloudfront_distribution_created_number": 1
        })
        monkeypatch.setattr(handler.cloudfront_client.client, 'get_distribution_config', lambda *args, **kwargs: {
            "DistributionConfig": {},
            "ETag": []
        })
        monkeypatch.setattr(handler.job_info_client, 'update_job_field', lambda *args, **kwargs: {})
        monkeypatch.setattr(handler.cloudfront_client, 'construct_cloudfront_config', lambda *args, **kwargs: {})
        monkeypatch.setattr(handler.cloudfront_client, 'update_distribution', lambda *args, **kwargs: {
            "Id": "id",
            "ARN": "arn",
            "DomainName": "dn",
            "DistributionConfig": {
                "Aliases": []
            }
        })
        handler.handler(e, {})
