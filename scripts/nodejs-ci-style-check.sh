#! /bin/bash
 
JQ_EXEC=`which jq`

FILE_PATH=edge/nodejs/nodejs.json

new_app_list=$(cat $FILE_PATH | ${JQ_EXEC} .edge.new[].appname | sed 's/\"//g')
update_app_list=$(cat $FILE_PATH | ${JQ_EXEC} .edge.update[].appname | sed 's/\"//g')

#check code style
npm install eslint --save-dev
for var in ${new_app_list[@]}; do
	./node_modules/.bin/eslint -c .eslintrc.yml edge/nodejs/$var
done

for var in ${update_app_list[@]}; do
	./node_modules/.bin/eslint -c .eslintrc.yml edge/nodejs/$var
done