#!/bin/bash

EXCLUDE=("ssl_for_saas" "venv" "python-env")
cd ../source || exit

COVERAGE_REPORTS=${PWD}/monitoring-coverages
mkdir -p $COVERAGE_REPORTS

RED='\033[0;31m'
NC='\033[0m' # No Color
GREEN='\033[0;32m'
YELLOW='\033[0;33m'

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

# Define a timestamp function
function timestamp() {
  date +"%H%M%S" # current time
}

function process_test() {
  if [[ " ${EXCLUDE[*]} " =~ $1 ]]; then
    echo "exclude file: $1"
  else
    if [ -d "$1" ]; then
      cd "$1" || exit
      local test=0
      for d in * ; do
        if [ -f $d ]; then
          if [[ "$d" =~ test_.*py ]]; then
            printf "${GREEN}$d${NC}\n"
            test=1
          fi
        else
            process_test "$d"
        fi
      done
      [ $test -eq 1 ] && python3 -m pytest --cov --cov-report=term-missing --cov-report "xml:./$(basename $(pwd))_$(timestamp).coverage.xml"
      mv *.coverage.xml $COVERAGE_REPORTS
      cd .. || return
    fi
  fi
}

process_requirements "lambda/monitoring"
process_test "monitoring"
