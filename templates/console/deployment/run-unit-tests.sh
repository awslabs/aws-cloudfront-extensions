#!/bin/bash
#
# This assumes all of the OS-level configuration has been completed and git repo has already been cloned
#
# This script should be run from the repo's deployment directory
# cd deployment
# ./run-unit-tests.sh
#

template_dir="$PWD"
source_dir="$template_dir/../source"

echo "------------------------------------------------------------------------------"
echo "[Test] Console testing"
echo "------------------------------------------------------------------------------"
echo 'pip3 install -r ../source/tests/lambda-test/testing_requirements.txt'
pip3 install -r ../source/tests/lambda-test/testing_requirements.txt
echo 'pytest -s ../source/tests/lambda-test/'
pytest -s ../source/tests/lambda-test/
