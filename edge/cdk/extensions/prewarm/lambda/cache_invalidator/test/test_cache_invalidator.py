import boto3
import datetime

from moto import mock_dynamodb, mock_sqs, mock_cloudfront
from unittest.mock import MagicMock
from urllib import parse
import shortuuid

@mock_sqs
def test_send_msg(monkeypatch):
    monkeypatch.setenv('AWS_REGION', 'us-east-1', prepend=False)
    monkeypatch.setenv('DDB_TABLE_NAME', 'Table_name', prepend=False)
    monkeypatch.setenv('INV_WAIT_TIME', '1', prepend=False)
    sqs_client = boto3.client('sqs', region_name='us-east-1')
    queue_url = sqs_client.create_queue(QueueName='test_queue')['QueueUrl']
    monkeypatch.setenv('SQS_QUEUE_URL', queue_url, prepend=False)

    # Send a message to the queue
    from cache_invalidator import send_msg
    # queue_url, url, domain, pop, req_id, create_time, dist_id, inv_id
    url = 'http://dxias1ysind2y.cloudfront.net/js/bootstrap.bundle.min.js'
    domain = 'dxias1ysind2y.cloudfront.net'
    pop = ['ARN56-P1', 'ARN54-C1', 'CDG50-P1', 'CDG52-P2', 'DUB2-C1', 'DUB56-P1', 'FRA56-P4', 'FRA60-P1', 'LHR61-P3', 'LHR50-P2']
    req_id = '6b378ed8-c3e6-42f4-8804-370f851471de'
    dist_id = 'E1H31DOP8TU0SS'
    inv_id = 'IAPM7IJWAJFUW7ILWODI5XYLL6'
    create_time = datetime.datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')
    send_response = send_msg(queue_url, url, domain, pop, req_id, create_time, dist_id, inv_id)
    receive_response = sqs_client.receive_message(
        QueueUrl=queue_url,
        MaxNumberOfMessages=4,
        WaitTimeSeconds=3,
        VisibilityTimeout=180 * 60
    )
    message_id_sen = send_response['MessageId']
    message_id_rec = receive_response['Messages'][0]['MessageId']
    assert message_id_sen == message_id_rec


@mock_cloudfront
@mock_sqs
def test_invalidate_cf_cache(monkeypatch):
    monkeypatch.setenv('AWS_REGION', 'us-east-1', prepend=False)
    monkeypatch.setenv('DDB_TABLE_NAME', 'Table_name', prepend=False)
    monkeypatch.setenv('INV_WAIT_TIME', '1', prepend=False)
    sqs_client = boto3.client('sqs', region_name='us-east-1')
    queue_url = sqs_client.create_queue(QueueName='test_queue')['QueueUrl']
    monkeypatch.setenv('SQS_QUEUE_URL', queue_url, prepend=False)
    from cache_invalidator import invalidate_cf_cache
    dist_id = 'EXAMPLE_DIST_ID'
    url = 'http://dxias1ysind2y.cloudfront.net/js/bootstrap.bundle.min.js'
    cf_client = boto3.client('cloudfront')
    # responses = cf_client.create_invalidation(
    #     DistributionId=dist_id,
    #     InvalidationBatch={
    #         'Paths': {
    #             'Quantity': len(parse.urlsplit(url)),
    #             'Items': parse.urlsplit(url)
    #         },
    #         'CallerReference': str(int(datetime.datetime.utcnow().timestamp())) + shortuuid.uuid()[:5]
    #     }
    # )
    #

    response = invalidate_cf_cache(dist_id, url)
    #
    # create_invalidation = MagicMock()
    # cf_client = MagicMock()
    # cf_client.create_invalidation = MagicMock(return_value=True)
    assert True


def test_compose_error_response(monkeypatch):
    monkeypatch.setenv('AWS_REGION', 'us-east-1', prepend=False)
    monkeypatch.setenv('DDB_TABLE_NAME', 'Table_name', prepend=False)
    monkeypatch.setenv('INV_WAIT_TIME', '1', prepend=False)
    sqs_client = boto3.client('sqs', region_name='us-east-1')
    queue_url = sqs_client.create_queue(QueueName='test_queue')['QueueUrl']
    monkeypatch.setenv('SQS_QUEUE_URL', queue_url, prepend=False)
    from cache_invalidator import compose_error_response
    response = compose_error_response('test')
    # constant msg :no need to test!
    assert response is not None


def test_dist_match(monkeypatch):
    monkeypatch.setenv('AWS_REGION', 'us-east-1', prepend=False)
    monkeypatch.setenv('DDB_TABLE_NAME', 'Table_name', prepend=False)
    monkeypatch.setenv('INV_WAIT_TIME', '1', prepend=False)
    sqs_client = boto3.client('sqs', region_name='us-east-1')
    queue_url = sqs_client.create_queue(QueueName='test_queue')['QueueUrl']
    monkeypatch.setenv('SQS_QUEUE_URL', queue_url, prepend=False)
    from cache_invalidator import dist_match
    url = 'http://dxias1ysind2y.cloudfront.net/js/bootstrap.bundle.min.js'
    parsed_url = parse.urlsplit(url)
    url_netloc = parsed_url.netloc
    distribution = {
        'DomainName': 'dxias1ysind2y.cloudfront.net',
        'Aliases': {
            'Quantity': 1,
            'Items': [url_netloc]
        },
        'Id': '123'
    }
    is_cf_domain = True
    response = dist_match(distribution, url_netloc, is_cf_domain)
    is_cf_domain = False
    response2 = dist_match(distribution, url_netloc, is_cf_domain)
    assert response is not None and response2 is not None


def test_cf_domain_from_cname(monkeypatch):
    monkeypatch.setenv('AWS_REGION', 'us-east-1', prepend=False)
    monkeypatch.setenv('DDB_TABLE_NAME', 'Table_name', prepend=False)
    monkeypatch.setenv('INV_WAIT_TIME', '1', prepend=False)
    sqs_client = boto3.client('sqs', region_name='us-east-1')
    queue_url = sqs_client.create_queue(QueueName='test_queue')['QueueUrl']
    monkeypatch.setenv('SQS_QUEUE_URL', queue_url, prepend=False)
    from cache_invalidator import cf_domain_from_cname
    url = 'http://dxias1ysind2y.cloudfront.net/js/bootstrap.bundle.min.js'
    response = cf_domain_from_cname(url)
    assert response['cf_domain'] is not None


@mock_cloudfront
def test_find_dist_id(monkeypatch):
    monkeypatch.setenv('AWS_REGION', 'us-east-1', prepend=False)
    monkeypatch.setenv('DDB_TABLE_NAME', 'Table_name', prepend=False)
    monkeypatch.setenv('INV_WAIT_TIME', '1', prepend=False)
    sqs_client = boto3.client('sqs', region_name='us-east-1')
    queue_url = sqs_client.create_queue(QueueName='test_queue')['QueueUrl']
    monkeypatch.setenv('SQS_QUEUE_URL', queue_url, prepend=False)
    from cache_invalidator import find_dist_id
    cf_domain = 'dxias1ysind2y.cloudfront.net'
    domain_key = ''
    response = find_dist_id(cf_domain, domain_key)
    assert True


@mock_dynamodb
@mock_cloudfront
@mock_sqs
def test_lambda_handler(monkeypatch):
    monkeypatch.setenv('AWS_REGION', 'us-east-1', prepend=False)
    monkeypatch.setenv('DDB_TABLE_NAME', 'Table_name', prepend=False)
    monkeypatch.setenv('INV_WAIT_TIME', '1', prepend=False)
    sqs_client = boto3.client('sqs', region_name='us-east-1')
    queue_url = sqs_client.create_queue(QueueName='test_queue')['QueueUrl']
    monkeypatch.setenv('SQS_QUEUE_URL', queue_url, prepend=False)
    from cache_invalidator import lambda_handler
    event = {
        'url_list': ['http://dxias1ysind2y.cloudfront.net/js/bootstrap.bundle.min.js','http://dxias1ysind2y.cloudfront.net/js/bootstrap.bundle.min.js'],
        'cf_domain': 'dxias1ysind2y.cloudfront.net',
        'pop_region': ['ARN56-P1', 'ARN54-C1', 'CDG50-P1', 'CDG52-P2', 'DUB2-C1', 'DUB56-P1', 'FRA56-P4', 'FRA60-P1', 'LHR61-P3', 'LHR50-P2'],
        'create_time': datetime.datetime.utcnow().strftime('%Y%m%dT%H%M%SZ'),
        'req_id': '6b378ed8-c3e6-42f4-8804-370f851471de'
    }
    context = ''
    responses = lambda_handler(event, context)
    assert responses['statusCode'] == 200
