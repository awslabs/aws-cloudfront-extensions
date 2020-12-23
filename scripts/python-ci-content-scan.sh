#! /bin/bash
 
# JQ_EXEC=`which jq`

# FILE_PATH=edge/python/python.json

# new_app_list=$(cat $FILE_PATH | ${JQ_EXEC} .edge.new[].appname | sed 's/\"//g')
# update_app_list=$(cat $FILE_PATH | ${JQ_EXEC} .edge.update[].appname | sed 's/\"//g')

export language="$(cut -d'/' -f1 <<<"$labelName")"
export appName="$(cut -d'/' -f2 <<<"$labelName")"

# scan commit content
aws s3 cp s3://aws-solutions-build-assets/viperlight-scanner/viperlight.zip .

unzip -q viperlight.zip -d ./viperlight

./viperlight/bin/viperlight-scan -t edge/$language/$appName





