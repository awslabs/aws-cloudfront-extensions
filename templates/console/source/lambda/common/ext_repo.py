import csv
import logging
import os

import boto3
import requests

region = os.environ['AWS_REGION']
dynamodb_client = boto3.resource('dynamodb', region_name=region)

log = logging.getLogger()
log.setLevel('INFO')
log.setLevel('DEBUG')

result_msg = {
    'SUCCESS': 'The extensions have been updated',
    'FAIL': 'Fail to update extensions, please check CloudWatch logs of deployer function'
}


def sync_ext(meta_data_url, ddb_table_name):
    '''Get the latest extensions to local Dynamodb table'''
    result = 'SUCCESS'

    with requests.Session() as s:
        meta_req = s.get(meta_data_url)
        meta_content = meta_req.content.decode('utf-8-sig')
        cr = csv.reader(meta_content.splitlines(), delimiter=',')

        for row in cr:
            table_item = {
                'name': row[0],
                'templateUri': row[1],
                'type': row[2],
                'desc': row[3],
                'codeUri': row[4],
                'stage': row[5],
                'updateDate': row[6],
                'author': row[7],
                'status': row[8],
                'tag': row[9],
                'cfnParameter': row[10]
            }
            table = dynamodb_client.Table(ddb_table_name)
            ddb_response = table.put_item(Item=table_item)
            log.info(table_item)
            log.info(ddb_response)
            if ddb_response['ResponseMetadata']['HTTPStatusCode'] != 200:
                result = 'FAIL'

    return {'status': result, 'message': result_msg[result]}
