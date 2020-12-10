#! /bin/bash
 
JQ_EXEC=`which jq`

FILE_PATH=edge/publish-apps.json

tag_string=$(cat $FILE_PATH | ${JQ_EXEC} .edge.tag | sed 's/\"//g')

git tag $tag_string









