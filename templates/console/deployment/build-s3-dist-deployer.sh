#!/bin/bash
# This assumes all of the OS-level configuration has been completed and git repo has already been cloned
#
# This script should be run from the repo's deployment directory
# cd deployment
# ./build-s3-dist.sh
#
# Check to see if input has been provided:
# if [ "$1" ]; then
#     echo "Usage: ./build-s3-dist.sh"
#     exit 1
# fi

bold=$(tput bold)
normal=$(tput sgr0)

set -euxo pipefail

title() {
    echo "------------------------------------------------------------------------------"
    echo $*
    echo "------------------------------------------------------------------------------"
}

run() {
    >&2 echo "[run] $*"
    $*
}

__dir="$(cd "$(dirname $0)";pwd)"
SRC_PATH="${__dir}/../source"


# Get reference for all important folders
lambda_source_dir="$SRC_PATH/lambda"
lib_dir="$SRC_PATH/lambda/common"
lambda_build_dist_dir="$lib_dir/lambda-assets"

echo "------------------------------------------------------------------------------"
echo "[Init] Clean existed dist folders"
echo "------------------------------------------------------------------------------"

echo "rm -rf $lambda_build_dist_dir"
rm -rf $lambda_build_dist_dir
echo "mkdir -p $lambda_build_dist_dir"
mkdir -p $lambda_build_dist_dir

echo "find ../ -type f -name 'package-lock.json' -delete"
find "$lambda_source_dir" -type f -name 'package-lock.json' -delete
echo "find ../ -type f -name '.DS_Store' -delete"
find "$lambda_source_dir" -type f -name '.DS_Store' -delete
# echo "find $lambda_source_dir -iname \"package\" -type d -exec rm -r \"{}\" \; 2> /dev/null"
# find "$lambda_source_dir" -iname "package" -type d -exec rm -r "{}" \; 2> /dev/null
rm -rf $lambda_source_dir/deployer/common/
rm -rf $lambda_source_dir/custom_resource/common/
rm -rf $lambda_source_dir/deployer/package
rm -rf $lambda_source_dir/custom_resource/package


echo "------------------------------------------------------------------------------"
echo "[Packing] Extensions repository deployer"
echo "------------------------------------------------------------------------------"
cd "$lambda_source_dir"/deployer || exit 1
pip3 install -r requirements.txt --target ./package
cd "$lambda_source_dir"/deployer/package || exit 1
zip -q -r9 "$lambda_build_dist_dir"/deployer.zip .
cd "$lambda_source_dir"/deployer || exit 1
cp -r "$lambda_source_dir"/common .
zip -g -r "$lambda_build_dist_dir"/deployer.zip deployer.py common


echo "------------------------------------------------------------------------------"
echo "[Packing] Extensions repository custom resource"
echo "------------------------------------------------------------------------------"
cd "$lambda_source_dir"/custom_resource || exit 1
pip3 install -r requirements.txt --target ./package
cd "$lambda_source_dir"/custom_resource/package || exit 1
zip -q -r9 "$lambda_build_dist_dir"/custom_resource.zip .
cd "$lambda_source_dir"/custom_resource || exit 1
cp -r "$lambda_source_dir"/common .
zip -g -r "$lambda_build_dist_dir"/custom_resource.zip custom_resource.py common
