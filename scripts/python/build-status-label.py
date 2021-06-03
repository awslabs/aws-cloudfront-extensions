import re

import boto3
import sys
import os
from github import Github

def lambda_handler(build_event, context):
    # print(build_event)
    success_label = os.environ['CI_Success_Label']
    sm = boto3.client('secretsmanager')
    gh = Github(sm.get_secret_value(SecretId=os.getenv('SecretARN'))['SecretString'])
    
    build_id = build_event['detail']['build-id']
    build_project_name = build_event['detail']['project-name']
    build_status = build_event['detail']['build-status']
    

    cb = boto3.client('codebuild')
    response = cb.batch_get_builds(ids=[build_id])
    build_details = response['builds'][0]
    
    matches = re.match(r'^pr\/(\d+)', build_details.get('sourceVersion', ""))
    pr_id = int(matches.group(1))
    
    github_location = build_details['source']['location']
    matches = re.search(r'github\.com\/(.+)\/(.+)\.git$', github_location)
    
    github_owner = matches.group(1)
    github_repo = matches.group(2)
    
    repo = gh.get_user(github_owner).get_repo(github_repo)
    if build_status == 'SUCCEEDED':
        repo.get_pull(pr_id).add_to_labels(success_label)
        for assignee in os.getenv('OnCall_Assignees').split(','):
            try:
                repo.get_pull(pr_id).add_to_assignees(assignee)
            except:
                continue
        for reviewer in os.getenv('OnCall_Reviewers').split(','):
            try:
                repo.get_pull(pr_id).create_review_request(reviewers=[reviewer])
            except:
                continue
    else:
        repo.get_pull(pr_id).remove_from_labels(success_label)
        
    # repo.get_pull(pr_id).add_to_labels(os.environ['CI_Success_Label'])
