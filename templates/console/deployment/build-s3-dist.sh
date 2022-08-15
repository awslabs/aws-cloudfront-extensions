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


if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Parameters not enough"
    echo "Example: $(basename $0) <BUCKET_NAME> <SOLUTION_NAME> [VERSION]"
    exit 1
fi


# packaging lambda

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
rm -rf $lambda_source_dir/deployer/common
rm -rf $lambda_source_dir/custom_resource/common
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

# -----------------------------------------------------------------------------
# new build:
# Formatting
export BUCKET_NAME=$1
export SOLUTION_NAME=$2
export BUILD_VERSION=$3
export GLOBAL_S3_ASSETS_PATH="${__dir}/global-s3-assets"

title "init env"

run rm -rf ${GLOBAL_S3_ASSETS_PATH} && run mkdir -p ${GLOBAL_S3_ASSETS_PATH}

echo "BUCKET_NAME=${BUCKET_NAME}"
echo "SOLUTION_NAME=${SOLUTION_NAME}"
echo "BUILD_VERSION=${BUILD_VERSION}"
echo "${BUILD_VERSION}" > ${GLOBAL_S3_ASSETS_PATH}/version

title "install and build web project"

run cd $SRC_PATH/../../../portal
run npm install --legacy-peer-deps
export PATH=$(npm bin):$PATH
run npm run build

title "cdk synth"

# Add local install to PATH
# Install the global aws-cdk package
# Note: do not install using global (-g) option. This makes build-s3-dist.sh difficult
# for customers and developers to use, as it globally changes their environment.

export PATH=$(npm bin):$PATH
run cd ${SRC_PATH}
echo $PWD
run npm install
# todo: ignore jest for now, because test not work
# do_cmd npm run build       # build javascript from typescript to validate the code
                           # cdk synth doesn't always detect issues in the typescript
                           # and may succeed using old build files. This ensures we
                           # have fresh javascript from a successful build

# Run 'cdk synth' to generate raw solution outputs
export USE_BSS=true
# see https://github.com/aws-samples/cdk-bootstrapless-synthesizer/blob/main/API.md for how to config
export BSS_TEMPLATE_BUCKET_NAME="${BUCKET_NAME}"
export BSS_FILE_ASSET_BUCKET_NAME="${BUCKET_NAME}-\${AWS::Region}"
export FILE_ASSET_PREFIX="${SOLUTION_NAME}/${BUILD_VERSION}/"
# container support
export BSS_IMAGE_ASSET_TAG_PREFIX="${BUILD_VERSION}-"

# export BSS_IMAGE_ASSET_ACCOUNT_ID=${AWS_CN_ASSET_ACCOUNT_ID}
# export BSS_IMAGE_ASSET_REGION_SET="cn-north-1,cn-northwest-1"
# export BSS_FILE_ASSET_REGION_SET="cn-north-1,cn-northwest-1"
# run mkdir -p ${GLOBAL_S3_ASSETS_PATH}/${CN_ASSETS}
# export BSS_FILE_ASSET_PREFIX="${FILE_ASSET_PREFIX}${CN_ASSETS}"
# 
# # run npm run synth # -- --output=$staging_dist_dir
# run npx cdk synth -c TargetPartition=aws-cn --json --output ${GLOBAL_S3_ASSETS_PATH}/${CN_ASSETS} -q 2>/dev/null

export BSS_IMAGE_ASSET_ACCOUNT_ID=${AWS_ASSET_ACCOUNT_ID}
export BSS_FILE_ASSET_REGION_SET="$REGIONS"
export BSS_IMAGE_ASSET_REGION_SET=${BSS_FILE_ASSET_REGION_SET}

if [ ! -z "$AWS_ASSET_PUBLISH_ROLE" ]; then
run export BSS_FILE_ASSET_PUBLISHING_ROLE_ARN="$AWS_ASSET_PUBLISH_ROLE"
run export BSS_IMAGE_ASSET_PUBLISHING_ROLE_ARN="$AWS_ASSET_PUBLISH_ROLE"
fi


IFS=',' read -r -a prefixes <<< "$GLOBAL_ASSETS"
mkdir -p ${GLOBAL_S3_ASSETS_PATH}/${prefixes[0]}

export BSS_FILE_ASSET_PREFIX="${FILE_ASSET_PREFIX}${prefixes[0]}"
run npx cdk synth -c EnableDashboardCustomDomain=true --json --output ${GLOBAL_S3_ASSETS_PATH}/${prefixes[0]} -q 2>/dev/null

# Custom domain
mkdir -p ${GLOBAL_S3_ASSETS_PATH}/${prefixes[1]}
export BSS_FILE_ASSET_PREFIX="${FILE_ASSET_PREFIX}${prefixes[1]}"
run npx cdk synth --json --output ${GLOBAL_S3_ASSETS_PATH}/${prefixes[1]} -q 2>/dev/null

run echo '763104351884.dkr.ecr.us-east-1.amazonaws.com'>>"${__dir}/ecr-repos"
run echo '727897471807.dkr.ecr.cn-northwest-1.amazonaws.com.cn'>>"${__dir}/cn-ecr-repos"