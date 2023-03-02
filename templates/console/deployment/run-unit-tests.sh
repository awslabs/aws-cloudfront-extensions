#!/bin/bash
#
# This assumes all of the OS-level configuration has been completed and git repo has already been cloned
#
# This script should be run from the repo's deployment directory
# cd deployment
# ./run-unit-tests.sh
#

# template_dir="$PWD"
# source_dir="$template_dir/../source"

# echo "------------------------------------------------------------------------------"
# echo "[Test] Console testing"
# echo "------------------------------------------------------------------------------"
# echo 'pip3 install -r ../source/tests/lambda-test/testing_requirements.txt'
# pip3 install -r ../source/tests/lambda-test/testing_requirements.txt
# echo 'pytest -s ../source/tests/lambda-test/'
# pytest -s ../source/tests/lambda-test/

echo "------------------------------------------------------------------------------"
echo "[Test] Monitoring test coverage"
echo "------------------------------------------------------------------------------"

cd ../source/lambda/monitoring/non_realtime

for d in */ ; do
    echo "$d"
    cp ../shared_lib/python/metric_helper.py .
    python3 -m pytest --cov --cov-report=term-missing --cov-report "xml:./non_$(basename $(pwd)).coverage.xml"
    rm -rf metric_helper.py
    cp non_$(basename $(pwd)).coverage.xml ../../../../tests/coverage-reports/
    rm -rf non_$(basename $(pwd)).coverage.xml
    cd ..
    break
done

#cd ../realtime
#
#for d in */ ; do
#    echo "$d"
#    cd $d
#    cp ../shared_lib/python/metric_helper.py .
#    python3 -m pytest --cov --cov-report=term-missing --cov-report "xml:./$(basename $(pwd)).coverage.xml"
#    rm -rf metric_helper.py
#    cp $(basename $(pwd)).coverage.xml ../../../../tests/coverage-reports/
#    rm -rf $(basename $(pwd)).coverage.xml
#    cd ..
#done
