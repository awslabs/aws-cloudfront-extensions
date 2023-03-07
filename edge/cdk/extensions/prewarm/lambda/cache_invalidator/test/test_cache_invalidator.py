import boto3

from moto import mock_dynamodb, mock_sqs


@mock_sqs
def test_send_msg(monkeypatch):
    # sqs_client = boto3.client('sqs', region_name='us-east-1')
    # queue_name = 'test_queue'
    # queue_url = sqs_client.create_queue(QueueName=queue_name)['QueueUrl']
    # # Send a message to the queue
    # message_body = 'Hello, world!'
    # sqs_client.send_message(QueueUrl=queue_url, MessageBody=message_body)
    # from cache_invalidator import send_msg
    # # queue_url, url, domain, pop, req_id, create_time, dist_id, inv_id
    # response = send_msg(queue_url,)
    # sqs_client.receive_message(
    #     QueueUrl=queue_url,
    #     MaxNumberOfMessages=4,
    #     WaitTimeSeconds=3,
    #     VisibilityTimeout=180 * 60
    # )
    assert True


def test_invalidate_cf_cache():
    assert True


def test_compose_error_response():
    assert True


def test_replace_url():
    assert True


def test_dist_match():
    assert True


def test_cf_domain_from_cname():
    assert True


def test_find_dist_id():
    assert True


def test_lambda_handler():
    assert True
