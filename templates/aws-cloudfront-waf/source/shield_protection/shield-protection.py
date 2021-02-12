######################################################################################################################
#  Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           #
#                                                                                                                    #
#  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    #
#  with the License. A copy of the License is located at                                                             #
#                                                                                                                    #
#      http://www.apache.org/licenses/LICENSE-2.0                                                                    #
#                                                                                                                    #
#  or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES #
#  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    #
#  and limitations under the License.                                                                                #
######################################################################################################################
import logging
import os
import json
import boto3

client = boto3.client('shield')


def lambda_handler(event, context):
    log = logging.getLogger()
    log_level = str(os.getenv('LOG_LEVEL').upper())
    if log_level not in ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']:
        log_level = 'ERROR'
    log.setLevel(log_level)

    log.info('[lambda_handler] Start')

    # Replace with your CloudFront ARN
    resourceArn = 'CloudFrontARN'

    # Create a protected resource
    protectionResp = client.create_protection(
        Name='ShieldProtectionForCloudFront',
        ResourceArn=resourceArn
    )
    log.info(json.dumps(protectionResp))

    # Create a protection group and add the protected resource into the group
    groupResp = client.create_protection_group(
        ProtectionGroupId='ProtectionGroupForCloudFront',
        Aggregation='MAX',
        Pattern='ARBITRARY',
        Members=[
            resourceArn
        ]
    )

    return json.dumps(groupResp)
