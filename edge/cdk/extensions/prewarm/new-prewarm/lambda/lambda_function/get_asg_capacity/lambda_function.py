import json
import boto3
import os
import datetime

asg_client = boto3.client('autoscaling')
asg_name = os.environ.get("ASG_NAME")


def lambda_handler(event, context):
    try:

        response = asg_client.describe_auto_scaling_groups(
            AutoScalingGroupNames=[asg_name])

        if 'AutoScalingGroups' in response and len(response['AutoScalingGroups']) > 0:
            autoScalingGroups = response['AutoScalingGroups'][0]
            desired_capacity = autoScalingGroups['DesiredCapacity']
            print(f"Auto Scaling Group: {asg_name}")
            print(f"Desired Capacity: {desired_capacity}")
            return retrun_data(status='success', message='query success', additional_data={'desiredcapacity': desired_capacity})

        else:
            return retrun_data(status='failure', message='AutoScalingGroups Not exits')

    except Exception as e:
        return retrun_data(status='failure', message=str(e))


def retrun_data(status, message, additional_data=None):
    current_time = datetime.datetime.now()
    return_body = {
        'status': status,
        'timestamp': str(current_time),
        'message': message,
    }

    if additional_data:
        return_body.update(additional_data)

    response = {
        'statusCode': 200,
        'body': json.dumps(return_body)
    }

    return response
