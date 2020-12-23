#! /bin/bash
 
# JQ_EXEC=`which jq`

# FILE_PATH=edge/python/python.json

# new_app_list=$(cat $FILE_PATH | ${JQ_EXEC} .edge.new[].appname | sed 's/\"//g')
# new_app_code_uri=$(cat $FILE_PATH | ${JQ_EXEC} .edge.new[].codeuri | sed 's/\"//g')
# update_app_list=$(cat $FILE_PATH | ${JQ_EXEC} .edge.update[].appname | sed 's/\"//g')
# update_app_code_uri=$(cat $FILE_PATH | ${JQ_EXEC} .edge.update[].codeuri | sed 's/\"//g')

export language="$(cut -d'/' -f1 <<<"$labelName")"
export appName="$(cut -d'/' -f2 <<<"$labelName")"

#compile code
echo "start compile"

python3 -m compileall edge/$labelName

pip3 install -U pytest
pip3 install pytest pytest-mock --user
pip3 install coverage

#unit test
echo "start unit test"
coverage run -m pytest edge/$labelName/tests/ -v
coverage report
