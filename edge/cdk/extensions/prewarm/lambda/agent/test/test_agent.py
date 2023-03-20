import boto3
import pytest
import json
import os
from moto import mock_dynamodb, mock_sqs
from moto import mock_cloudfront
from agent import *
from unittest.mock import MagicMock, patch


def test_gen_pop_url(monkeypatch):
    target_url = "test_cf_domain.popname.cloudfront.net/path1/path2"
    original_url = "http://test_cf_domain.cloudfront.net/path1/path2"
    parsed_url = parse.urlsplit(original_url)
    passed_url = replace_url(parsed_url, 'test_cf_domain')
    pop = 'popname'
    cf_domain_prefix = 'test_cf_domain'
    assert gen_pop_url(parsed_url, pop, cf_domain_prefix) == target_url


def test_replace_url(monkeypatch):
    target_url= parse.urlsplit('http://www.example.com/path1/path2')
    original_url = "http://www.original.com/path1/path2"
    parsed_url = parse.urlsplit(original_url)
    replaced_url=replace_url(parsed_url, 'www.example.com')
    assert target_url == replaced_url

def test_get_cf_domain_prefix(monkeypatch):
    prefix = 'test_cf_domain'
    parsed_url = parse.urlsplit('http://test_cf_domain.cloudfront.net/path1/path2')
    assert get_cf_domain_prefix(parsed_url) == prefix

@mock_cloudfront
def test_cf_invalidation_status():
    dist_id = 'EXAMPLE_DIST_ID'
    inv_id = 'EXAMPLE_INV_ID'
    waiter = MagicMock()
    waiter.wait = MagicMock()

    cf_client = MagicMock()
    cf_client.get_waiter = MagicMock(return_value=waiter)
    assert True == cf_invalidation_status(cf_client, dist_id, inv_id)

@patch('requests.get')
def test_download_file(mock_get):
    url = 'https://www.example.com/file.txt'
    cf_domain = 'example.com'

    # Set up the mock response from requests.get()
    mock_response = MagicMock()
    mock_response.iter_content.return_value = [b'dggrwjdufjvngninpcsjcrsewthjcdijbtlwqnhesyybwgwptkvojhmibmcxqqlbohmyinyhdcghkzcavtupsikewphbxxjmpglmtujyvjpdlujxhsrxjilyxbsvdswcxjwhbljpyhshqlnjsfdldidxlcyxbkhpfujjtpsqurwhxndlueucsevynruzxkyzgacxmoyulsgvkujgcpdixznxzxyzzhqifbqmpoeegmiwmyhlujnokouehlotbggqrjkpsitpdkwjzetgkiqebixovqlvrmcmledvdgkibegpauvqpoctqsliolkqwnmuufldfvwllxndfchzdbypoaqddofmfdncultktvrskwpdrtizlrqbdclzgrjrljhyghzzltjileijtwhtvhomwbcynxrhafhttuoskhjutkwqteczuotjfxxoarpqlkkkxhrgrvxiqgnkhblhirycyduldqndykrhfgtjkqvvxvsbxteqkbqtxxhtyssihcyszbooduqixmddlilkwxbswjfhijpkmvodgnvnatnluoxgnhoxuqgzrspzpilrymauhcbrdrhhkhfahrpmpoeoyquvtipffmyyguxmpvxaknvkvnlblwqwmlcbznhmfjkyrxohdispvmdvgpcduwoanbrxxpjzfwlohercxlarpoaszreefzzaiqhnazzespgnknerndgqlwzqggpnvltmafndiugopcrbsyvikyysabzjihllfuaqrnnqgsqddcmvimehfwgnndmyegvjselucrjuxlxnokcnyaotuvfsijqeykohyzdhwbimitwhudkmrmclaxqrsbonplfurcbtbodpwhjdwugdurteykfvnwarzwztfqtzfrsmsjjmrarxfqgcdwsvadpotoecmkcscntuggqmpblzkunmgmsxhdvlkotnvnxngsrvkztcgbytypnljuxiealnngvutvbdaqynazrvhtukdmdjwaljcduxzeehcddapfbyzfflgaenlazitkkrrdugkfcenopxkkqasjcyjikfjonhjgubxmnfohyaxkyagctyhnqccdnlxasbzpjjgftnpdiumpkmjwwvxhegqkntewgooyeztjgmcermlnbbwsukxdtrfbctiilaeadbiunwinnbxofambocmbrfvbouhheasiqpfwyekblzkqxdswpotugfvroblfcxjehjqwtrqjzqrzkkcogbiomkchlrkgdwilaimozqnuowypunlhgrgeyydaizrckahjbixuqqsxpjnrwepacqiacxnmxymccvrxdjaeqnexffshbygpodiyqocikehpkixnatohlubxnzvwfmkshtxhdtzrwmushbcyrelehcgoeecmajxxdqvgczchidvcqsyxmmipdctyjikrwihmunjsunhshgvayebnrbpjysfyixnifojirwtmjcuzaafkvpmstdpwvxaxezftrkgicbadfksevtiferrjecikimbvfmovlaxcmxfoylvrsfdoxkyvbxalgzvnzsekhwrslwybeczzpjxbgckwbzsbpqjhtpjkmknwqjbcfdsmnapbrezxvbqsflcsnrkjazxhducwbopgczvkzwxygnflmihdqazjpnqhbnjjexehkvyqzvjzniqkztinkadvpqbpehjvgmzswssvuaypyajnoomulegobpxsaatudyhhbpeejkvmjaefbshldfaxupmvipiunwoqdzrqosqccwuguhwoeaeedhqubbvpfoozmiowgwnqtxtszasjmgfmzimslmgtaakdgaalujumtbfqiukpodmrskwipsuilsjwstypvikpiqdvigebrvbyvecnivqnhcpxeedtjekzczwsxqswtcherqglbwgfppduzbrnqftegctfngapgtaomceztlmkqekbusrxuplxxperwxmumxjbljhieaijhgifjqvdpvqdoheopepcxlrdncththjvvcmpgcaptessegawydclpaiitgwddjvgivorbzociahehjmvvtlnnmeltyvhjgfjblthmbxtyrgomlraclwtecvuhugexbdobepjiqujxphnaxcmpefnlzeywgpstukqarokzriyzohmymddemizihtadqpsmhwixaxkdhnhdxoxkhogxnrrqmcnflgrwfxizlenntcjchmummtnhdrhpiyuvrvembklxmrwjvvpwmtijylihyqlbsoxfbqikmoomcqrwjrbttcsvtxprmemykgtdjhflrzungrtlqpmyhjycmyolzvdfejyuypqmlupidmqtshfepzqmulspldmafbpvpmtkoqtfdicauizplgwofymldncgipdtgjmcvwpmgpwgtdarqrsiceafcjvxziaaopfqluhipthgfopxrnfohjzxhbxhkgchzllliqzovvsltqdgiozbypxokevprumbqqxbfocalhsmtxdplvwgqhgxfrktghqiqbsdgzgmensovermxzyyjikeoqjzmliovtlomqnxghzjldtpzlncreubidydzlpwtvtgbrkhbangauxttvbkyawnvstfzijsmamlivnwxwtdsuvwfylxkpciicovwxxnylosnpichfsfhkttdahksmsftcwmiypbswpfvzotiqndpkrysgdxpspmaaotedmxrgskxxarvwzrhqupdpjfzdmttybxbvegdtyldrkhxmaxkaarjgbplmbxeeoghbilfeyueuonjqwmcyhetnpskhzobatsfdpcfczkhkyzeiksdnjtkiduvkpanbstvkxcxnsmghiapczvsvzpgujbrjpgydsdjqkshbxkbntjorprhmvtdbnndxfnplewvuyusjnrfgfeazlrgmdjrpsnhkfqtvfrntouxhwyxnytmnuptvcxugcttpirfxhibgeeeqrjnccqowezruxqrlraqqpbkkjkkfntumazrchajtwnevkbxmuoomlacwubweiqdlfgtftdasejnuqoqzswcbylarsaebtjeixsgbitknrlwwduyqaqlrfytljqwsstxvipigasgtwqvdoxuowhvzbxrqbpysozxanibkexlncjlmtizamawikeqizucbmhcadpkjfunfghxensnubxfttkowbekdyfzdjwnchnymmguyfwbzmfezzxlcsjosnzsnadqssgsbihawvtxyffdodggtjregnnfoexhdvrlujswbtyqqcyjouft']
    mock_response.headers = {'content-length': '3276'}
    mock_get.return_value = mock_response

    # Call the function and check the output
    file_name = download_file(url, cf_domain)
    assert file_name is not None
    assert os.path.isfile(file_name)
    assert file_name.endswith('file.txt')

    # Check that requests.get() was called with the correct arguments
    mock_get.assert_called_once_with(url, headers={'Accept-Encoding': 'gzip, deflate, br', 'Host': cf_domain}, stream=True, timeout=5)

    # Clean up the temporary file
    os.remove(file_name)

@patch('subprocess.run')
def test_download_file_with_curl(mock_get):
    # Create a temporary file for the downloaded content
    local_filename = os.path.join('/dev/', 'null')
    url = 'https://www.example.com/testfile'
    cf_domain = 'example.cloudfront.net'
    original_url  =  'https://www.example.com/testfile'

    # Call the download_file_with_curl function
    result = download_file_with_curl(url, cf_domain, original_url)

    # Check that the file was downloaded and saved to the expected location
    assert result == local_filename
    assert os.path.exists(local_filename)



@patch('agent.download_file')
def test_pre_warm(mock_download_file):
    url = 'www.example.com/file.txt'
    pop = 'us-west-1'
    cf_domain = 'example.com'
    original_url = 'www.example.com/file.txt'
    protocol = 'http'

    # Set up the mock response from download_file()
    mock_download_file.return_value = 'temp_file_name'

    # Call the function and check the output
    result = pre_warm(url, pop, cf_domain, protocol, original_url)
    assert result['pop'] == pop
    assert result['statusCode'] == -1

    # Check that download_file() was called with the correct arguments
    mock_download_file.assert_called_once_with(protocol+'://' + url, cf_domain)

    # Check that the temporary file was deleted
    assert not os.path.exists('temp_file_name')

@mock_sqs
def test_get_message_from_queue(monkeypatch):
    sqs_client = boto3.client('sqs', region_name='us-east-1')
    queue_name = 'test_queue'

    queue_url = sqs_client.create_queue(QueueName=queue_name)['QueueUrl']
    message_body = 'test_message_body'

    # Send a message to the queue
    message_body = 'Hello, world!'
    sqs_client.send_message(QueueUrl=queue_url, MessageBody=message_body)
    assert len(get_messages_from_queue(sqs_client, queue_url)) > 0

def test_get_node_pre_set(monkeypatch):
    node_list_success = ["DFW56-P2", "DUB56-P1", "DUB2-C1", "NRT51-P2"]
    node_list_fail = ["DFW56-P2", "DUB56-P1", "DUB2-C1", "NRT51-P2"]
    # import get_node_pre_set from agent
    responses1 = get_node_pre_set(node_list_success)
    print(responses1)
    responses2 = get_node_pre_set(node_list_fail)
    print(responses2)
    assert responses2 == responses1


@mock_sqs
@mock_dynamodb
@mock_cloudfront
@patch("time.sleep", side_effect=InterruptedError)
def test_prewarm_handler(monkeypatch):
    # Set up mock SQS and DynamoDB resources
    sqs = boto3.client('sqs', region_name='us-west-2')
    ddb = boto3.resource('dynamodb', region_name='us-west-2')
    table = ddb.create_table(
        TableName='test_table',
        KeySchema=[
            {
                'AttributeName': 'url',
                'KeyType': 'HASH'
            }
        ],
        AttributeDefinitions=[
            {
                'AttributeName': 'url',
                'AttributeType': 'S'
            }
        ],
        BillingMode='PROVISIONED',
        ProvisionedThroughput={
            'ReadCapacityUnits': 10,
            'WriteCapacityUnits': 10
        },
    )

    # Put a message in the mock SQS queue
    queue_url = sqs.create_queue(QueueName='test_queue')['QueueUrl']
    message_body = {
        'url': 'http://example.com',
        'domain': 'example.com',
        'pop': ['US', 'EU'],
        'reqId': '12345',
        'distId': '12345',
        'create_time': '2022-02-22T22:22:22Z',
        'invId': '12345'
    }
    message = sqs.send_message(
        QueueUrl=queue_url,
        MessageBody=json.dumps(message_body)
    )

    # Call the function to be tested
    waiter = MagicMock()
    waiter.wait = MagicMock()

    cf_client = MagicMock()
    cf_client.get_waiter = MagicMock(return_value=waiter)
    try:
        prewarm_handler(queue_url, 'test_table', 'us-west-2', 1, cf_client)
    except (InterruptedError):
        pass
