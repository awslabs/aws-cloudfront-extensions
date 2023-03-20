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

set -e

title() {
    echo "------------------------------------------------------------------------------"
    echo $*
    echo "------------------------------------------------------------------------------"
}

run() {
    >&2 echo ::$*
    $*
}


# Get reference for all important folders
template_dir="$PWD"
source_dir="$template_dir/../lambda"
lib_dir="$template_dir/../lambda/lib"
build_dist_dir="$lib_dir/lambda-assets"


# packaging lambda
echo "------------------------------------------------------------------------------"
echo "[Init] Clean existed dist folders"
echo "------------------------------------------------------------------------------"

echo "rm -rf $build_dist_dir"
rm -rf $build_dist_dir
echo "mkdir -p $build_dist_dir"
mkdir -p $build_dist_dir
echo "rm -rf $source_dir/apk-distribution/bin"
rm -rf $source_dir/apk-distribution/lib
echo "rm -rf $source_dir/apk-distribution/build"
rm -rf $source_dir/apk-distribution/build

echo "------------------------------------------------------------------------------"
echo "[Packing] Apk-distribution"
echo "------------------------------------------------------------------------------"
cd "$source_dir"/apk-distribution
gradle -q packageLibs
mv build/distributions/apk-distribution.zip "$build_dist_dir"/apk-distribution-lib.zip
gradle build -i
mv build/distributions/apk-distribution.zip "$build_dist_dir"/apk-distribution.zip