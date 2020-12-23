#! /bin/bash
 
# JQ_EXEC=`which jq`

# FILE_PATH=edge/nodejs/nodejs.json

# new_app_list=$(cat $FILE_PATH | ${JQ_EXEC} .edge.new[].appname | sed 's/\"//g')
# update_app_list=$(cat $FILE_PATH | ${JQ_EXEC} .edge.update[].appname | sed 's/\"//g')

export language="$(cut -d'/' -f1 <<<"$labelName")"
export appName="$(cut -d'/' -f2 <<<"$labelName")"

#check code style
npm install eslint --save-dev

./node_modules/.bin/eslint -c .eslintrc.yml edge/nodejs/$var
