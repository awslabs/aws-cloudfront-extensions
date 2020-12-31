#! /bin/bash
<<Lambda@EdgeTest
    1. Deployment test
    2. Solution id verification
    3. E2E test
Lambda@EdgeTest

JQ_EXEC=$(which jq)
FILE_PATH=edge/publish-apps.json
export SAM_CLI_TELEMETRY=0

app_path_list=$(cat $FILE_PATH | ${JQ_EXEC} .edge.publish_app_path[] | sed 's/\"//g')
stack_name=cloudfront-extension-deployment
deploy_region=us-east-1

for var in ${app_path_list[@]}; do
  echo "1. Begin deployment test in ${deploy_region} for ${var}"
  sam deploy --template-file edge/$var/template.yaml --stack-name ${stack_name} \
    --region "${deploy_region}" --capabilities CAPABILITY_NAMED_IAM \
    --s3-bucket cloudfront-ext-deployment --no-fail-on-empty-changeset
  deploy_result=$(aws cloudformation describe-stacks --stack-name ${stack_name} \
    --query "Stacks[0].Outputs")

  echo "2. Check solution id"
  solution_id=$(echo "${deploy_result}" | jq '.[] | select(.OutputKey|contains("SolutionId"))' |
    jq '.OutputValue' | tr '' '"')
  lambda_arn=$(echo "${deploy_result}" | jq '.[] | select(.OutputValue|contains("arn:aws:lambda"))' |
    jq '.OutputValue' | tr '' '"')

  if [ -z "${solution_id}" ]; then
    echo "[ERROR]No solution id in output"
    exit 1
  else
    echo "Solution id existed in output, the value is ${solution_id}"
  fi
  if [ -z "${#lambda_arn}" ]; then
    echo "[ERROR]No lambda ARN in output"
    exit 1
  else
    echo "Lambda ARN existed in output, the value is ${lambda_arn}"
  fi

done
