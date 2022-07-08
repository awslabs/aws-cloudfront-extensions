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

# Get reference for all important folders
template_dir="$PWD"
lambda_source_dir="$template_dir/../source/lambda"
lib_dir="$template_dir/../source/lambda/common"
lambda_build_dist_dir="$lib_dir/lambda-assets"

export GLOBAL_S3_ASSETS_PATH="$template_dir/global-s3-assets"
export REGIONAL_S3_ASSETS_PATH="$template_dir/regional-s3-assets"

# packaging lambda
echo "------------------------------------------------------------------------------"
echo "[Init] Clean existed dist folders"
echo "------------------------------------------------------------------------------"

echo "rm -rf $lambda_build_dist_dir"
rm -rf $lambda_build_dist_dir
echo "mkdir -p $lambda_build_dist_dir"
mkdir -p $lambda_build_dist_dir

echo "find $lambda_source_dir -iname \"dist\" -type d -exec rm -r \"{}\" \; 2> /dev/null"
find "$lambda_source_dir" -iname "dist" -type d -exec rm -r "{}" \; 2> /dev/null
echo "find ../ -type f -name 'package-lock.json' -delete"
find "$lambda_source_dir" -type f -name 'package-lock.json' -delete
echo "find ../ -type f -name '.DS_Store' -delete"
find "$lambda_source_dir" -type f -name '.DS_Store' -delete
echo "find $lambda_source_dir -iname \"package\" -type d -exec rm -r \"{}\" \; 2> /dev/null"
find "$lambda_source_dir" -iname "package" -type d -exec rm -r "{}" \; 2> /dev/null


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
echo "------------------------------------------------------------------------------"
echo "[Packing] Extensions repository s3"
echo "------------------------------------------------------------------------------"

#-----------------------------------------------------------------------------------
# Get reference for all important folders
#-----------------------------------------------------------------------------------
staging_dist_dir="$template_dir/staging"
template_dist_dir="$template_dir/global-s3-assets"
build_dist_dir="$template_dir/regional-s3-assets"
source_dir="$template_dir/../source"

cd $template_dir

bold=$(tput bold)
normal=$(tput sgr0)
echo "tput problem break my script"
#------------------------------------------------------------------------------
# SETTINGS
#------------------------------------------------------------------------------
template_format="json"
run_helper="true"

# run_helper is false for yaml - not supported
[[ $template_format == "yaml" ]] && {
    run_helper="false"
    echo "${bold}Solution_helper disabled:${normal} template format is yaml"
}


#------------------------------------------------------------------------------
# DISABLE OVERRIDE WARNINGS
#------------------------------------------------------------------------------
# Use with care: disables the warning for overridden properties on
# AWS Solutions Constructs
export overrideWarningsEnabled=false

#------------------------------------------------------------------------------
# Build Functions
#------------------------------------------------------------------------------
# Echo, execute, and check the return code for a command. Exit if rc > 0
# ex. do_cmd npm run build
usage()
{
    echo "Usage: $0 bucket solution-name version"
    echo "Please provide the base source bucket name, trademarked solution name, and version."
    echo "For example: ./build-s3-dist.sh mybucket my-solution v1.0.0"
    exit 1
}

do_cmd()
{
    echo "------ EXEC $*"
    $*
    rc=$?
    if [ $rc -gt 0 ]
    then
            echo "Aborted - rc=$rc"
            exit $rc
    fi
}

sedi()
{
    # cross-platform for sed -i
    sed -i $* 2>/dev/null || sed -i "" $*
}


# use sed to perform token replacement
# ex. do_replace myfile.json %%VERSION%% v1.1.1
do_replace()
{
    replace="s/$2/$3/g"
    file=$1
    do_cmd sedi $replace $file
}

create_template_json()
{
    # Run 'cdk synth' to generate raw solution outputs
    do_cmd npm run synth -- --output=$staging_dist_dir

    # run helper
    do_cmd $template_dir/helper.py ${staging_dist_dir}

    # Remove unnecessary output files
    do_cmd cd $staging_dist_dir
    # ignore return code - can be non-zero if any of these does not exist
    rm tree.json manifest.json cdk.out

    # Move outputs from staging to template_dist_dir
    echo "Move outputs from staging to template_dist_dir"
    do_cmd mv $staging_dist_dir/*.template.json $template_dist_dir/

    # Rename all *.template.json files to *.template
    echo "Rename all *.template.json to *.template"
    echo "copy templates and rename"
    for f in $template_dist_dir/*.template.json; do
        mv -- "$f" "${f%.template.json}.template"
    done
}

create_template_yaml()
{
    # Assumes current working directory is where the CDK is defined
    # Output YAML - this is currently the only way to do this for multiple templates
    maxrc=0
    for template in `cdk list`; do
        echo Create template $template
        npx cdk synth $template > ${template_dist_dir}/${template}.template
        if [[ $? > $maxrc ]]; then
            maxrc=$?
        fi
    done
}


cleanup_temporary_generted_files()
{
    echo "------------------------------------------------------------------------------"
    echo "${bold}[Cleanup] Remove temporary files${normal}"
    echo "------------------------------------------------------------------------------"

    # Delete generated files: CDK Consctruct typescript transcompiled generted files
    do_cmd cd $source_dir/constructs
    do_cmd npm run cleanup:tsc

    # Delete the temporary /staging folder
    do_cmd rm -rf $staging_dist_dir
}

fn_exists()
{
    exists=`LC_ALL=C type $1`
    return $?
}

#------------------------------------------------------------------------------
# INITIALIZATION
#------------------------------------------------------------------------------
# solution_config must exist in the deployment folder (same folder as this
# file) . It is the definitive source for solution ID, name, and trademarked
# name.
#
# Example:
#
# SOLUTION_ID='SO0111'
# SOLUTION_NAME='AWS Security Hub Automated Response & Remediation'
# SOLUTION_TRADEMARKEDNAME='aws-security-hub-automated-response-and-remediation'
# SOLUTION_VERSION='v1.1.1' # optional
if [[ -e './solution_config' ]]; then
    source ./solution_config
else
    echo "solution_config is missing from the solution root."
    exit 1
fi

if [[ -z $SOLUTION_ID ]]; then
    echo "SOLUTION_ID is missing from ../solution_config"
    exit 1
else
    export SOLUTION_ID
fi

if [[ -z $SOLUTION_NAME ]]; then
    echo "SOLUTION_NAME is missing from ../solution_config"
    exit 1
else
    export SOLUTION_NAME
fi

if [[ -z $SOLUTION_TRADEMARKEDNAME ]]; then
    echo "SOLUTION_TRADEMARKEDNAME is missing from ../solution_config"
    exit 1
else
    export SOLUTION_TRADEMARKEDNAME
fi

#------------------------------------------------------------------------------
# Validate command line parameters
#------------------------------------------------------------------------------
# Validate command line input - must provide bucket
[[ -z $1 ]] && { usage; exit 1; } || { SOLUTION_BUCKET=$1; }

# Environmental variables for use in CDK
export DIST_OUTPUT_BUCKET=$SOLUTION_BUCKET

# Version from the command line is definitive. Otherwise, use, in order of precedence:
# - SOLUTION_VERSION from solution_config
# - version.txt
#
# Note: Solutions Pipeline sends bucket, name, version. Command line expects bucket, version
# if there is a 3rd parm then version is $3, else $2
#
# If confused, use build-s3-dist.sh <bucket> <version>
if [ ! -z $3 ]; then
    export VERSION="$3"
else
    export VERSION=$(git describe --tags --exact-match || { [ -n "$BRANCH_NAME" ] && echo "$BRANCH_NAME"; } || echo v0.0.0)
fi


echo "------------------------------------------------------------------------------"
echo "${bold}[Init] Remove any old dist files from previous runs${normal}"
echo "------------------------------------------------------------------------------"

do_cmd rm -rf $template_dist_dir
do_cmd mkdir -p $template_dist_dir
do_cmd rm -rf $build_dist_dir
do_cmd mkdir -p $build_dist_dir
do_cmd rm -rf $staging_dist_dir
do_cmd mkdir -p $staging_dist_dir

echo "------------------------------------------------------------------------------"
echo "${bold}[Init] Install dependencies for the cdk-solution-helper${normal}"
echo "------------------------------------------------------------------------------"

# we have helper.py
#do_cmd cd $template_dir/cdk-solution-helper
#do_cmd npm install

# Install and build web console asset
do_cmd cd $source_dir/../../../portal
do_cmd npm install --legacy-peer-deps
export PATH=$(npm bin):$PATH
do_cmd npm run build

# Add local install to PATH
# Install the global aws-cdk package
# Note: do not install using global (-g) option. This makes build-s3-dist.sh difficult
# for customers and developers to use, as it globally changes their environment.

export PATH=$(npm bin):$PATH
do_cmd cd $source_dir
echo $pwd
do_cmd npm install
# todo: ignore jest for now, because test not work
# do_cmd npm run build       # build javascript from typescript to validate the code
                           # cdk synth doesn't always detect issues in the typescript
                           # and may succeed using old build files. This ensures we
                           # have fresh javascript from a successful build



echo "------------------------------------------------------------------------------"
echo "${bold}[Create] Templates${normal}"
echo "------------------------------------------------------------------------------"

if fn_exists create_template_${template_format}; then
    create_template_${template_format}
else
    echo "Invalid setting for \$template_format: $template_format"
    exit 255
fi

echo "------------------------------------------------------------------------------"
echo "${bold}[Packing] Template artifacts${normal}"
echo "------------------------------------------------------------------------------"

# Run the helper to clean-up the templates and remove unnecessary CDK elements
# echo "Run the helper to clean-up the templates and remove unnecessary CDK elements"
# [[ $run_helper == "true" ]] && {
#     echo "node $template_dir/cdk-solution-helper/index"
#     node $template_dir/cdk-solution-helper/index
#     if [ "$?" = "1" ]; then
#     	echo "(cdk-solution-helper) ERROR: there is likely output above." 1>&2
#     	exit 1
#     fi
# } || echo "${bold}Solution Helper skipped: ${normal}run_helper=false"



# Find and replace bucket_name, solution_name, and version
echo "Find and replace bucket_name, solution_name, and version"
cd $template_dist_dir
do_replace "*.template" %%BUCKET_NAME%% ${SOLUTION_BUCKET}
do_replace "*.template" %%SOLUTION_NAME%% ${SOLUTION_TRADEMARKEDNAME}
do_replace "*.template" %%VERSION%% ${VERSION}

echo "------------------------------------------------------------------------------"
echo "${bold}[Packing] Source code artifacts${normal}"
echo "------------------------------------------------------------------------------"

# General cleanup of node_modules files
echo "find $staging_dist_dir -iname "node_modules" -type d -exec rm -rf "{}" \; 2> /dev/null"
find $staging_dist_dir -iname "node_modules" -type d -exec rm -rf "{}" \; 2> /dev/null

# ... For each asset.* source code artifact in the temporary /staging folder...
cd $staging_dist_dir
for d in `find . -mindepth 1 -maxdepth 1 -type d`; do

    # pfname = asset.<key-name>
    pfname="$(basename -- $d)"

    # zip folder
    echo "zip -rq $pfname.zip $pfname"
    cd $pfname
    zip -rq $pfname.zip *
    mv $pfname.zip ../
    cd ..

    # Remove the old, unzipped artifact from /staging
    echo "rm -rf $pfname"
    rm -rf $pfname

    # ... repeat until all source code artifacts are zipped and placed in the /staging
done

# ... For each asset.*.zip code artifact in the temporary /staging folder...
cd $staging_dist_dir
for f in `find . -iname \*.zip`; do
    # Rename the artifact, removing the period for handler compatibility
    # pfname = asset.<key-name>.zip
    pfname="$(basename -- $f)"
    echo $pfname
    # fname = <key-name>.zip
    fname="$(echo $pfname | sed -e 's/asset\.//g')"
    mv $pfname $fname

    # Copy the zipped artifact from /staging to /regional-s3-assets
    echo "cp $fname $build_dist_dir"
    cp $fname $build_dist_dir

    # Remove the old, zipped artifact from /staging
    echo "rm $fname"
    rm $fname
done

# cleanup temporary generated files that are not needed for later stages of the build pipeline
cleanup_temporary_generted_files

# Return to original directory from when we started the build
cd $template_dir