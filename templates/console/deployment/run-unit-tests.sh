#!/bin/bash
#
# This assumes all of the OS-level configuration has been completed and git repo has already been cloned
#
# This script should be run from the repo's deployment directory
# cd deployment
# ./run-unit-tests.sh
#

EXCLUDE=("venv" "python-env")
COVERAGE_REPORTS=${PWD}/monitoring-coverages
mkdir -p $COVERAGE_REPORTS
NC='\033[0m' # No Color
GREEN='\033[0;32m'

function process_requirements() {
    if [[ " ${EXCLUDE[*]} " =~ $1 ]]; then
        echo "exclude file: $1"
    else
       if [ -d "$1" ]; then
         cd "$1" || exit
         for d in * ; do
           process_requirements "$d"
         done
         cd .. || return
       else
         if [[ "$1" == requirements*txt ]]; then
           printf "${GREEN} found requirements file:${NC} ${PWD}/$1 \n"
           if [ -s $1 ]; then
             pip install -r "$1"
           fi
           echo
         fi
       fi
    fi
}

cd ../source/lambda/ || return
process_requirements 'monitoring/'
cd monitoring/non_realtime || return

echo "------------------------------------------------------------------------------"
echo "[Test] Monitoring test coverage"
echo "------------------------------------------------------------------------------"



export IS_REALTIME='False'
export APPSYNC_NAME='Test'
export DDB_TABLE_NAME='Test'
export LIST_COUNTRY_ROLE_ARN='test'
for d in */ ; do
    echo "$d"
    cp ../shared_lib/python/metric_helper.py .
    python3 -m pytest --cov --cov-report=term-missing --cov-report "xml:./non_$(basename "${PWD}").coverage.xml"
    rm -rf metric_helper.py
    cp non_$(basename $(pwd)).coverage.xml $COVERAGE_REPORTS
    rm -rf non_$(basename $(pwd)).coverage.xml
    cd ..
    break
done

cd ../realtime

for d in */ ; do
    echo "$d"
    cd $d
    cp ../shared_lib/python/metric_helper.py .
    python3 -m pytest --cov --cov-report=term-missing --cov-report "xml:./$(basename $(pwd)).coverage.xml"
    rm -rf metric_helper.py
    cp $(basename $(pwd)).coverage.xml $COVERAGE_REPORTS
    rm -rf $(basename $(pwd)).coverage.xml
    cd ..
done
