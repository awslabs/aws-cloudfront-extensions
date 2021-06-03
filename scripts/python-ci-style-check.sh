#! /bin/bash
 
# JQ_EXEC=`which jq`

# FILE_PATH=edge/python/python.json

# new_app_code_uri=$(cat $FILE_PATH | ${JQ_EXEC} .edge.new[].codeuri | sed 's/\"//g')
# update_app_code_uri=$(cat $FILE_PATH | ${JQ_EXEC} .edge.update[].codeuri | sed 's/\"//g')

#check code style
echo edge/$labelName
export PYTHONPATH="${PWD}/edge/${labelName}/${labelName#*/}"
echo $PYTHONPATH
pylint --rcfile .pylintrc edge/$labelName/
