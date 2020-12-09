#! /bin/bash
 
JQ_EXEC=`which jq`

FILE_PATH=edge/python/python.json

new_app_list=$(cat $FILE_PATH | ${JQ_EXEC} .edge.new[].appname | sed 's/\"//g')
new_app_code_uri=$(cat $FILE_PATH | ${JQ_EXEC} .edge.new[].codeuri | sed 's/\"//g')
update_app_list=$(cat $FILE_PATH | ${JQ_EXEC} .edge.update[].appname | sed 's/\"//g')
update_app_code_uri=$(cat $FILE_PATH | ${JQ_EXEC} .edge.update[].codeuri | sed 's/\"//g')

#compile code
echo "start compile"
for var in ${new_app_code_uri[@]}; do
	python3 -m compileall edge/python/$var/
done

for var in ${update_app_code_uri[@]}; do
	python3 -m compileall edge/python/$var/
done

pip3 install -U pytest
pip3 install pytest pytest-mock --user
pip3 install coverage

#unit test
echo "start unit test"
for var in ${new_app_list[@]}; do
	coverage run -m pytest edge/python/$var/tests/ -v
	coverage report
	# python3 -m pytest edge/python/$var/tests/ -v
done

for var in ${update_app_list[@]}; do
	# coverage run -m unittest discover -s edge/python/$var
	coverage run -m pytest edge/python/$var/tests/ -v
	coverage report
done