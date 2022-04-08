import logging
import os

from lib.ext_repo import sync_ext

region = os.environ['AWS_REGION']
DDB_TABLE_NAME = os.environ['DDB_TABLE_NAME']
EXT_META_DATA_URL = os.environ['EXT_META_DATA_URL']

log = logging.getLogger()
log.setLevel('INFO')


def lambda_handler(event, context):
    log.info(event)
    request_type = event['RequestType'].upper() if (
        'RequestType' in event) else ""
    log.info(request_type)

    if event['ResourceType'] == "Custom::SyncExtensions":
        if 'CREATE' in request_type or 'UPDATE' in request_type:
            # Sync the latest extensions
            sync_ext(EXT_META_DATA_URL, DDB_TABLE_NAME)
