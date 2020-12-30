#! /bin/bash
 
JQ_EXEC=`which jq`

FILE_PATH=edge/publish-apps.json
export SAM_CLI_TELEMETRY=0

app_path_list=$(cat $FILE_PATH | ${JQ_EXEC} .edge.publish_app_path[] | sed 's/\"//g')

for app_path in ${app_path_list[@]}; do
	export codeUri="$(cut -d'/' -f2 <<<"$app_path")"
	echo $app_path
	echo $codeUri
	cd edge/$app_path/$codeUri
	echo $(pwd)

	npm install --production

	# TODO use webpack
	# npm run build --prod
	# rm -rf node_modules
	zip -r $codeUri.zip * -x 'test*'
	aws s3 cp $codeUri.zip s3://aws-cloudfront-extension-lambda-edge/edge/$codeUri/$codeUri.zip --acl public-read

	cd ../../../../
	echo $(pwd)
	sam package -t edge/$app_path/template.yaml --output-template-file edge/$app_path/packaged.yaml --s3-bucket cloudfront-extensions-package --region us-east-1	
done









