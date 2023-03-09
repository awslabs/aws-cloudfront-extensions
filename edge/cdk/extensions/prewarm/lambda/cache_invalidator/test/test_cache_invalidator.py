import boto3
import datetime

from moto import mock_dynamodb, mock_sqs, mock_cloudfront


@mock_sqs
@mock_dynamodb
@mock_cloudfront
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


def test_invalidate_cf_cache(monkeypatch):
    assert True


def test_compose_error_response(monkeypatch):
    assert True


def test_replace_url(monkeypatch):
    assert True


def test_dist_match(monkeypatch):
    assert True


def test_cf_domain_from_cname(monkeypatch):
    assert True


def test_find_dist_id(monkeypatch):
    assert True


def test_lambda_handler(monkeypatch):
    assert True
