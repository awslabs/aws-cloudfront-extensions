import re
import sys
import os
from github import Github

# Set PR labename for CodeBuild
client = Github(sys.argv[1])
matches = re.match(r'^pr\/(\d+)', os.getenv('CODEBUILD_SOURCE_VERSION'))
pr_id = int(matches.group(1))
github_location = os.getenv('CODEBUILD_SOURCE_REPO_URL')
matches = re.search(r'github\.com\/(.+)\/(.+)\.git$', github_location)
github_owner = matches.group(1)
github_repo = matches.group(2)
repo = client.get_user(github_owner).get_repo(github_repo)
for file in repo.get_pull(pr_id).get_files():
    if file.filename.startswith('edge/python/') or file.filename.startswith('edge/nodejs/'):
        print(re.match(r'^edge\/([^\/]+/[^\/]+)', file.filename).group(1))
        os.environ["labelName"] = re.match(r'^edge\/([^\/]+/[^\/]+)', file.filename).group(1)
        sys.exit(0)
        