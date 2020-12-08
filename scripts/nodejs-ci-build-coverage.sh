#! /bin/bash
 
JQ_EXEC=`which jq`

FILE_PATH=edge/nodejs/nodejs.json

new_app_code_uri=$(cat $FILE_PATH | ${JQ_EXEC} .edge.new[].codeuri | sed 's/\"//g')
update_app_code_uri=$(cat $FILE_PATH | ${JQ_EXEC} .edge.update[].codeuri | sed 's/\"//g')

# build and code coverage
npm i nyc --save-dev
npm install --save-dev mocha 
npm install --save-dev chai 
for var in ${new_app_code_uri[@]}; do
	npm --prefix edge/nodejs/$var run test
done

for var in ${update_app_code_uri[@]}; do
	npm --prefix edge/nodejs/$var run test
done









