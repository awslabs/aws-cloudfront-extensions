import http
import json
import logging
from typing import Any

from layer.acm_service.client import AcmUtilsService
from layer.common.response import Response

logger = logging.getLogger('boto3:acm_cron')
logger.setLevel(logging.INFO)
acm_client = AcmUtilsService(logger=logger)


def handler(event: Any, context: Any) -> Response:
    logger.info(f'Received event: {event}')

    # get task_token from event to create callback task
    # callback_table = os.getenv('CALLBACK_TABLE')
    # task_type = os.getenv('TASK_TYPE')

    acm_client.fetch_acm_status_from_waiting_list(task_status='TASK_TOKEN_TAGGED')
    return Response(statusCode=http.HTTPStatus.OK, body='success')
