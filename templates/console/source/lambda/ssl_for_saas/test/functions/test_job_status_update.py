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

class TestJobStatusUpdate:

    def test_job_status_update(self, monkeypatch):
        from functions.job_status_update import handler
        load_import = """
        {
            "cert_total_number": 1,
            "job_id": "id",
            "cert_total_number": 1,
            "auto_creation": "false"            
        }
        """
        monkeypatch.setattr(handler.job_info_client, 'get_job_info_by_id', lambda *args, **kwargs: {
            "cert_total_number": 1,
            "job_input": load_import,
            "certValidationStageStatus": "Fail"
        })
        monkeypatch.setattr(handler.job_info_client, 'update_job_fields_by_dict', lambda *args, **kwargs: {})
        monkeypatch.setattr(handler.acm_client, 'list_certificates_by_status', lambda *args, **kwargs: {})
        monkeypatch.setattr(handler.acm_client, 'get_results', lambda *args, **kwargs: [""])
        handler.handler({
            'job_id': 'id',
            'job_input': {

            },
            'cert_total_number': 1,
            'auto_creation': 'false',
            'certValidationStageStatus': 'Fail'
        }, {})

        load_import = """
        {
            "cert_total_number": 1,
            "job_id": "id",
            "cert_total_number": 1,
            "auto_creation": "true"            
        }
        """
        monkeypatch.setattr(handler.job_info_client, 'get_job_info_by_id', lambda *args, **kwargs: {
            "cert_total_number": 1,
            "job_input": load_import,
            "certValidationStageStatus": "Fail",
            "dcv_validation_msg": ""
        })

        handler.handler({
            'job_id': 'id',
            'job_input': {},
            'cert_total_number': 1,
            'auto_creation': 'true',
            'certValidationStageStatus': 'Fail'
        }, {})
