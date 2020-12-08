#! /bin/bash
 
JQ_EXEC=`which jq`

FILE_PATH=edge/nodejs/nodejs.json

new_app_list=$(cat $FILE_PATH | ${JQ_EXEC} .edge.new[].appname | sed 's/\"//g')
new_app_code_uri=$(cat $FILE_PATH | ${JQ_EXEC} .edge.new[].codeuri | sed 's/\"//g')
update_app_list=$(cat $FILE_PATH | ${JQ_EXEC} .edge.update[].appname | sed 's/\"//g')
update_app_code_uri=$(cat $FILE_PATH | ${JQ_EXEC} .edge.update[].codeuri | sed 's/\"//g')

# scan commit content
aws s3 cp s3://aws-solutions-build-assets/viperlight-scanner/viperlight.zip .

unzip -q viperlight.zip -d ./viperlight

for var in ${new_app_list[@]}; do
	./viperlight/bin/viperlight-scan -t edge/nodejs/$var
done

for var in ${update_app_list[@]}; do
	./viperlight/bin/viperlight-scan -t edge/nodejs/$var
done

check code style
npm install eslint --save-dev
for var in ${new_app_list[@]}; do
	./node_modules/.bin/eslint -c .eslintrc.yml edge/nodejs/$var
done

for var in ${update_app_list[@]}; do
	./node_modules/.bin/eslint -c .eslintrc.yml edge/nodejs/$var
done

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









