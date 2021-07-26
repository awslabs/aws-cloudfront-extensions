originDomain = 'ORIGIN_DOMAIN'

def lambda_handler(event, context):
    request = event['Records'][0]['cf']['request']
    request['headers']['host'][0]['value'] = originDomain;
    return request
