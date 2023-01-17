#! /bin/bash
 
JQ_EXEC=`which jq`

FILE_PATH=edge/publish-apps.json
export SAM_CLI_TELEMETRY=0

app_path_list=$(cat $FILE_PATH | ${JQ_EXEC} .edge.publish_app_path[] | sed 's/\"//g')
app_version=$(cat $FILE_PATH | ${JQ_EXEC} .edge.tag | sed 's/\"//g')

echo $app_version

pip3 install pyyaml

for app_path in ${app_path_list[@]}; do
	export codeUri="$(cut -d'/' -f2 <<<"$app_path")"
	echo $app_path
	echo $codeUri
	cd edge/$app_path/$codeUri
	echo $(pwd)

	if [[ $app_path == nodejs* ]]
	then
		npm install --production

		# TODO use webpack
		# npm run build --prod
		# rm -rf node_modules
		zip -r $codeUri.zip * -x 'test*'
	elif [[ $app_path == python* ]]
	then
		pip3 install --target ./package requests
		zip -r $codeUri.zip ./package/
		zip -g $codeUri.zip *.py
	else
	   echo 'invalid app_path: ' + $app_path
	   exit 1
	fi	

	aws s3 cp $codeUri.zip s3://aws-cloudfront-extension-lambda-edge/edge/$codeUri/$codeUri.zip --acl public-read
	rm -f $codeUri.zip

	cd ../../../../
	echo $(pwd)
	sam package -t edge/$app_path/template.yaml --output-template-file edge/$app_path/packaged.yaml --s3-bucket cloudfront-extensions-package --s3-prefix $codeUri  --region us-east-1

	python3 github-action-scripts/python/normalize-sam-template.py edge/$app_path/packaged.yaml $app_version
done
