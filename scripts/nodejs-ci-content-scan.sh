#! /bin/bash
 
# JQ_EXEC=`which jq`

# FILE_PATH=edge/nodejs/nodejs.json

# new_app_list=$(cat $FILE_PATH | ${JQ_EXEC} .edge.new[].appname | sed 's/\"//g')
# update_app_list=$(cat $FILE_PATH | ${JQ_EXEC} .edge.update[].appname | sed 's/\"//g')

# scan commit content
aws s3 cp s3://aws-solutions-build-assets/viperlight-scanner/viperlight.zip .

unzip -q viperlight.zip -d ./viperlight

# for var in ${new_app_list[@]}; do
# 	./viperlight/bin/viperlight-scan -t edge/nodejs/$var
# done

# for var in ${update_app_list[@]}; do
# 	./viperlight/bin/viperlight-scan -t edge/nodejs/$var
# done





