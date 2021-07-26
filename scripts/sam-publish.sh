
#! /bin/bash
 
JQ_EXEC=`which jq`

FILE_PATH=edge/publish-apps.json
export SAM_CLI_TELEMETRY=0

app_path_list=$(cat $FILE_PATH | ${JQ_EXEC} .edge.publish_app_path[] | sed 's/\"//g')

for var in ${app_path_list[@]}; do
	echo $var
	sam publish -t edge/$var/packaged.yaml --region us-east-1
done