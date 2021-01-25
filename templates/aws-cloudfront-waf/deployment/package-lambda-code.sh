#!/bin/bash
# This assumes all of the OS-level configuration has been completed and git repo has already been cloned 
# 
# This script should be run from the repo's deployment directory 
# cd deployment 
# ./package-lambda-code.sh
#
# Check to see if input has been provided: 
if [ "$1" ]; then
    echo "Usage: ./package-lambda-code.sh"
    exit 1 
fi 

# Get reference for all important folders
template_dir="$PWD" 
source_dir="$template_dir/../source"
lib_dir="$template_dir/../lib"
build_dist_dir="$lib_dir/lambda-assets"


echo "------------------------------------------------------------------------------"
echo "[Init] Clean existed dist folders"
echo "------------------------------------------------------------------------------"

echo "rm -rf $build_dist_dir"
rm -rf $build_dist_dir 
echo "mkdir -p $build_dist_dir" 
mkdir -p $build_dist_dir 

echo "find $source_dir -iname \"dist\" -type d -exec rm -r \"{}\" \; 2> /dev/null"
find "$source_dir" -iname "dist" -type d -exec rm -r "{}" \; 2> /dev/null
echo "find ../ -type f -name 'package-lock.json' -delete"
find "$source_dir" -type f -name 'package-lock.json' -delete
echo "find ../ -type f -name '.DS_Store' -delete"
find "$source_dir" -type f -name '.DS_Store' -delete
echo "find $source_dir -iname \"package\" -type d -exec rm -r \"{}\" \; 2> /dev/null"
find "$source_dir" -iname "package" -type d -exec rm -r "{}" \; 2> /dev/null


echo "------------------------------------------------------------------------------"
echo "[Packing] Log Parser"
echo "------------------------------------------------------------------------------"
cd "$source_dir"/log_parser || exit 1
pip install -r requirements.txt --target ./package
cd "$source_dir"/log_parser/package || exit 1
zip -q -r9 "$build_dist_dir"/log_parser.zip .
cd "$source_dir"/log_parser || exit 1
cp -r "$source_dir"/lib .
zip -g -r "$build_dist_dir"/log_parser.zip log-parser.py partition_s3_logs.py add_athena_partitions.py build_athena_queries.py lib


echo "------------------------------------------------------------------------------"
echo "[Packing] Access Handler"
echo "------------------------------------------------------------------------------"
cd "$source_dir"/access_handler || exit 1
pip install -r requirements.txt --target ./package
cd "$source_dir"/access_handler/package || exit 1
zip -q -r9 "$build_dist_dir"/access_handler.zip .
cd "$source_dir"/access_handler || exit 1
cp -r "$source_dir"/lib .
zip -g -r "$build_dist_dir"/access_handler.zip access-handler.py lib


echo "------------------------------------------------------------------------------"
echo "[Packing] IP Lists Parser"
echo "------------------------------------------------------------------------------"
cd "$source_dir"/reputation_lists_parser || exit 1
pip install -r requirements.txt --target ./package
cd "$source_dir"/reputation_lists_parser/package || exit 1
zip -q -r9 "$build_dist_dir"/reputation_lists_parser.zip .
cd "$source_dir"/reputation_lists_parser || exit 1
cp -r "$source_dir"/lib .
zip -g -r "$build_dist_dir"/reputation_lists_parser.zip reputation-lists.py lib


echo "------------------------------------------------------------------------------"
echo "[Packing] Custom Resource"
echo "------------------------------------------------------------------------------"
cd "$source_dir"/custom_resource || exit 1
pip install -r requirements.txt --target ./package
cd "$source_dir"/custom_resource/package || exit 1
zip -q -r9 "$build_dist_dir"/custom_resource.zip .
cd "$source_dir"/custom_resource || exit 1
cp -r "$source_dir"/lib .
zip -g -r "$build_dist_dir"/custom_resource.zip custom-resource.py lib


echo "------------------------------------------------------------------------------"
echo "[Packing] Helper"
echo "------------------------------------------------------------------------------"
cd "$source_dir"/helper || exit 1
pip install -r requirements.txt --target ./package
cd "$source_dir"/helper/package || exit 1
zip -q -r9 "$build_dist_dir"/helper.zip ./*
cd "$source_dir"/helper || exit 1
cp -r "$source_dir"/lib .
zip -g -r "$build_dist_dir"/helper.zip helper.py lib


echo "------------------------------------------------------------------------------"
echo "[Packing] Timer"
echo "------------------------------------------------------------------------------"
cd "$source_dir"/timer || exit 1
pip install -r requirements.txt --target ./package
cd "$source_dir"/timer/package || exit 1
zip -q -r9 "$build_dist_dir"/timer.zip ./*
cd "$source_dir"/timer || exit 1
cp -r "$source_dir"/lib .
zip -g -r "$build_dist_dir"/timer.zip timer.py lib
