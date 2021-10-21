# -*- coding: UTF-8 -*-

import ipdb
import os


def load_ipdb():
    db_path = 'ipipfree.ipdb'

    # hack db location path for unit test
    if not os.path.exists(db_path):
        db_path = os.path.join(os.getcwd(), 'geo_traffic_blocker/', db_path)
    return ipdb.City(db_path)


db = load_ipdb()


def lambda_handler(event, context):
    request = event['Records'][0]['cf']['request']
    client_ip = request['clientIp']
    info = db.find_info(client_ip, "CN")

    # block ip from China Mainland

    # The commercial version of IPDB can use 'country_code' field to find out the source
    # if info.country_code == 'CN':
    #     return {
    #         'status': '403',
    #         'statusDescription': 'Forbidden'
    #     }

    # Free IPDB only support 3 filed：city_name, county_name, region_name
    if info.country_name == '中国' and (info.region_name not in ('香港', '澳门', '台湾')):
        return {
            'status': '403',
            'statusDescription': 'Forbidden'
        }

    return request
