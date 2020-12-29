#! /bin/bash
 
JQ_EXEC=`which jq`

FILE_PATH=edge/publish-apps.json
export SAM_CLI_TELEMETRY=0
FILTER_PACKAGE_ARRAY=('aws-sdk' 'axios' 'nyc')

app_path_list=$(cat $FILE_PATH | ${JQ_EXEC} .edge.publish_app_path[] | sed 's/\"//g')

for var in ${app_path_list[@]}; do
	echo $var
	cd edge/$var
	echo $(pwd)
	
	codePaths=$(find . -name "package.json")
	for codePath in ${codePaths[@]}; do
		IFS='/' read -ra codePackage <<< "$codePath"
		echo ${codePackage[1]}
		cd ${codePackage[1]}
		npm install
		dependencies=$(cat $FILE_PATH | ${JQ_EXEC} '.dependencies | keys[]' | sed 's/\"//g')
		tmpDir='dependencies-tmp'
		mkdir $tmpDir
		for var in ${dependencies[@]}; do
			echo $var
			if [[ " ${array[*]} " == *" $var "* ]]; 
			then
				echo "ignore"
			else
				echo "backup dependency package"
				mv node_modules/$var ./$tmpDir
			fi
		done

		cd node_modules
		rm -rf $(find . -name "*" ! -name ".*")

		cd ../

		cp -rf $tmpDir/* node_modules/

		rm -rf $tmpDir

		zip -r ${codePackage[1]}.zip *
		aws s3 cp ${codePackage[1]}.zip s3://aws-cloudfront-extension-lambda-edge/edge/${codePackage[1]}/${codePackage[1]}.zip --acl public-read
		rm -f ${codePackage[1]}.zip

	done
	cd ../../../	
	echo $(pwd)
	sam package -t edge/$var/template.yaml --output-template-file edge/$var/packaged.yaml --s3-bucket cloudfront-extensions-package --region us-east-1	
done









