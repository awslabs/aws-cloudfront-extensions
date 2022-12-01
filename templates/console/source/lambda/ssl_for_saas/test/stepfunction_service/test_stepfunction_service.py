import logging

import pytest
from moto import mock_stepfunctions


class TestStepFunctionService:

    @mock_stepfunctions
    def test_constructor(self, monkeypatch):
        from layer.stepfunction_service.client import StepFunctionUtilsService
        client = StepFunctionUtilsService()
        logger = logging.Logger('test-log')
        StepFunctionUtilsService(logger=logger)
        monkeypatch.setattr(client.stepf_client, 'send_task_success', lambda *args, **kwargs: {})
        monkeypatch.setattr(client.stepf_client, 'send_task_failure', lambda *args, **kwargs: {})
        monkeypatch.setattr(client.stepf_client, 'send_task_heartbeat', lambda *args, **kwargs: {})
        client.set_task('token', 'success', {})
        client.set_task('token', 'failure', {})
        client.set_task('token', 'heartbeat', {})
        with pytest.raises(Exception):
            client.set_task('token', 'unknown', {})
        monkeypatch.setattr(client.stepf_client, 'start_execution', lambda *args, **kwargs: {'executionArn': 'arn'})
        client.invoke_step_function('arn', {})

        monkeypatch.setattr(client.stepf_client, 'start_execution', lambda *args, **kwargs: Exception('e'), raising=True)
        with pytest.raises(Exception):
            client.invoke_step_function('arn', {'executionArn': 'arn'})


