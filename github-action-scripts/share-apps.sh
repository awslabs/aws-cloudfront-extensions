#! /bin/bash
 
JQ_EXEC=`which jq`

FILE_PATH=edge/share-apps.json

app_arn_list=$(cat $FILE_PATH | ${JQ_EXEC} .edge.apps_arn[] | sed 's/\"//g')

for app_arn in ${app_arn_list[@]}; do
	echo $app_arn
	aws serverlessrepo put-application-policy --region us-east-1 --application-id $app_arn --statements Principals=*,Actions=Deploy
done