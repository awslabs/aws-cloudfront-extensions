import boto3
from botocore.exceptions import ClientError
import logging
import json
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

ssm_client = boto3.client('ssm',region_name='us-east-1')
target_param = ssm_client.get_parameter(
    Name='target_param',
    WithDecryption=True
)
param_value = json.loads(target_param["Parameter"]["Value"])
table_name = param_value["asg_table"]
asg_name = param_value["asg_name"]
dynamodb = boto3.resource('dynamodb',region_name='us-east-1')
table = dynamodb.Table(table_name)

def lambda_handler(event, context):
    try:
        item = json.loads(event['Records'][0]['body'])
        response = table.put_item(
            Item=item
        )
        print("asg_name",asg_name)
        print("table_name",table_name)
        print(item)
        result = response['ResponseMetadata']
        return result
        
    except ClientError as e:
        logging.error(e)