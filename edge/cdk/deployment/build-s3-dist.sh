#!/usr/bin/env bash
set -e

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
export VERSION="v2.0.0"
# if [ -z "$3" ]; then
#     # export VERSION="v$(jq -r '.version' ${SRC_PATH}/version.json)"
#     export VERSION=$(git describe --tags || echo latest)
# else
#     export VERSION=$3
# fi
export GLOBAL_S3_ASSETS_PATH="${__dir}/global-s3-assets"
export REGIONAL_S3_ASSETS_PATH="${__dir}/regional-s3-assets"

title "init env"

run rm -rf ${GLOBAL_S3_ASSETS_PATH} && run mkdir -p ${GLOBAL_S3_ASSETS_PATH}
run rm -rf ${REGIONAL_S3_ASSETS_PATH} && run mkdir -p ${REGIONAL_S3_ASSETS_PATH}
run rm -rf ${CDK_OUT_PATH}

echo "BUCKET_NAME=${BUCKET_NAME}"
echo "SOLUTION_NAME=${SOLUTION_NAME}"
echo "VERSION=${VERSION}"
echo "${VERSION}" > ${GLOBAL_S3_ASSETS_PATH}/version

title "cdk synth"

run cd ${SRC_PATH}
run npm i
# run npm run test

export USE_BSS=true
# How to config https://github.com/wchaws/cdk-bootstrapless-synthesizer/blob/main/API.md
export BSS_TEMPLATE_BUCKET_NAME="${BUCKET_NAME}"
export BSS_FILE_ASSET_BUCKET_NAME="${BUCKET_NAME}-\${AWS::Region}"
export BSS_FILE_ASSET_PREFIX="${SOLUTION_NAME}/${VERSION}/"
export BSS_FILE_ASSET_REGION_SET="us-east-1,${BSS_FILE_ASSET_REGION_SET}"

pushd ../extensions/prewarm/deployment
sh build-s3-dist.sh
popd

cd ${BUILD_PATH}
npm run synth -- --app "npx ts-node --prefer-ts-exts ${SRC_PATH}/prewarm/prewarm.ts" --output ${CDK_OUT_PATH}
npm run synth -- --app "npx ts-node --prefer-ts-exts ${SRC_PATH}/true-client-ip/true-client-ip.ts" --output ${CDK_OUT_PATH}
npm run synth -- --app "npx ts-node --prefer-ts-exts ${SRC_PATH}/redirect-by-country/redirect-by-country.ts" --output ${CDK_OUT_PATH}

echo "run ${__dir}/helper.py ${CDK_OUT_PATH}"
run ${__dir}/helper.py ${CDK_OUT_PATH}

title "tips!"

echo "To test your cloudformation template"
echo "make sure you have the following bucket exists in your account"
echo " - ${BUCKET_NAME}"
echo ${BSS_FILE_ASSET_REGION_SET} | tr ',' '\n' | xargs -I {} echo " - ${BUCKET_NAME}-{}"
echo "run \`aws s3 cp --recursive ${GLOBAL_S3_ASSETS_PATH} s3://${BUCKET_NAME}/${SOLUTION_NAME}/${VERSION}\`"
echo "run \`echo \"${BSS_FILE_ASSET_REGION_SET}\" | tr ',' '\n' | xargs -t -I {} aws s3 cp --recursive --region {} ${REGIONAL_S3_ASSETS_PATH} s3://${BUCKET_NAME}-{}/${SOLUTION_NAME}/${VERSION}\`"