import json


def lambda_handler(event, context):
    request = event['Records'][0]['cf']['request']
    response = event["Records"][0]["cf"]["response"]
    headers = response["headers"]
    # get request's range header
    range_header = request['headers'].get('range', None)
    if range_header is not None:
        print("range header")
        print(range_header)
        range_str = range_header[0]['value']
        client_ip = request['clientIp']
        if client_ip != '127.0.0.1' and range_str.startswith('bytes=0-'):
            headerName = "X-Amz-Meta-CloudFront-Prefetch-Urls"
            headers[headerName.lower()] = [
                {"key": headerName, "value": request["uri"]}]
    return response
