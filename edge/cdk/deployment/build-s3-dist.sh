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
SRC_PATH="${__dir}/../extensions"
CDK_OUT_PATH="${__dir}/../cdk.out"
BUILD_PATH="${__dir}/.."


if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Parameters not enough"
    echo "Example: $(basename $0) <BUCKET_NAME> <SOLUTION_NAME> [VERSION]"
    exit 1
fi


export BUCKET_NAME=$1
export SOLUTION_NAME=$2
export BUILD_VERSION=$3
export GLOBAL_S3_ASSETS_PATH="${__dir}/global-s3-assets"

title "init env"

run rm -rf ${GLOBAL_S3_ASSETS_PATH} && run mkdir -p ${GLOBAL_S3_ASSETS_PATH}
run rm -rf ${CDK_OUT_PATH}

echo "BUCKET_NAME=${BUCKET_NAME}"
echo "SOLUTION_NAME=${SOLUTION_NAME}"
echo "BUILD_VERSION=${BUILD_VERSION}"
echo "${BUILD_VERSION}" > ${GLOBAL_S3_ASSETS_PATH}/version

title "cdk synth"

export PATH=$(npm bin):$PATH
run cd ${SRC_PATH}
echo $PWD
run npm install --legacy-peer-deps
# run npm run test

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


export BSS_IMAGE_ASSET_ACCOUNT_ID=${AWS_ASSET_ACCOUNT_ID}
export BSS_FILE_ASSET_REGION_SET="$REGIONS"
export BSS_IMAGE_ASSET_REGION_SET=${BSS_FILE_ASSET_REGION_SET}

if [ ! -z "$AWS_ASSET_PUBLISH_ROLE" ]; then
run export BSS_FILE_ASSET_PUBLISHING_ROLE_ARN="$AWS_ASSET_PUBLISH_ROLE"
run export BSS_IMAGE_ASSET_PUBLISHING_ROLE_ARN="$AWS_ASSET_PUBLISH_ROLE"
fi


IFS=',' read -r -a prefixes <<< "$GLOBAL_ASSETS"
mkdir -p ${GLOBAL_S3_ASSETS_PATH}/${prefixes[0]}
mkdir -p ${GLOBAL_S3_ASSETS_PATH}/${prefixes[1]}

echo "TESTTTTTTTTTTT"
echo "${GLOBAL_S3_ASSETS_PATH} and ${prefixes[0]}"
echo "${GLOBAL_S3_ASSETS_PATH} and ${prefixes[1]}"


export BSS_FILE_ASSET_PREFIX="${FILE_ASSET_PREFIX}${prefixes[0]}"

pushd ${SRC_PATH}/prewarm/deployment
sh build-s3-dist.sh
popd

run cd ${BUILD_PATH}
npm run synth -- --app "npx ts-node --prefer-ts-exts ${SRC_PATH}/prewarm/prewarm.ts" --output ${CDK_OUT_PATH}
npm run synth -- --app "npx ts-node --prefer-ts-exts ${SRC_PATH}/true-client-ip/true-client-ip.ts" --output ${CDK_OUT_PATH}
npm run synth -- --app "npx ts-node --prefer-ts-exts ${SRC_PATH}/redirect-by-country/redirect-by-country.ts" --output ${CDK_OUT_PATH}
npm run synth -- --app "npx ts-node --prefer-ts-exts ${SRC_PATH}/resize-image/resize-image.ts" --output ${CDK_OUT_PATH}

# echo "run ${__dir}/helper.py ${CDK_OUT_PATH}"
# run ${__dir}/helper.py ${CDK_OUT_PATH}
cp -r ${CDK_OUT_PATH}/* ${GLOBAL_S3_ASSETS_PATH}
cp -r ${CDK_OUT_PATH}/* ${GLOBAL_S3_ASSETS_PATH}/${prefixes[0]}
cp -r ${CDK_OUT_PATH}/* ${GLOBAL_S3_ASSETS_PATH}/${prefixes[1]}
