#! /bin/bash
 
# JQ_EXEC=`which jq`

# FILE_PATH=edge/nodejs/nodejs.json
# new_app_code_uri=$(cat $FILE_PATH | ${JQ_EXEC} .edge.new[].codeuri | sed 's/\"//g')
# update_app_code_uri=$(cat $FILE_PATH | ${JQ_EXEC} .edge.update[].codeuri | sed 's/\"//g')

export appName="$(cut -d'/' -f2 <<<"$labelName")"

# build and code coverage
current_path=$(pwd)
echo "current path" $current_path

cd $current_path/edge/$labelName

cd $appName
echo "working path" $(pwd)
npm i -D nyc
npm install --save-dev mocha
npm install --save-dev chai 	
npm test