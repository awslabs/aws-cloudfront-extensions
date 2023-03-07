#!/bin/bash

EXCLUDE=("ssl_for_saas" "venv" "python-env" "monitoring")
cd ../source || exit

COVERAGE_REPORTS=${PWD}/all-coverages
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

function process_test() {
  if [[ " ${EXCLUDE[*]} " =~ $1 ]]; then
    echo "exclude file: $1"
  else
    if [ -d "$1" ]; then
      cd "$1" || exit

      for d in * ; do
        if [ -d $d ]; then
          if [ $d == test ]; then
            printf "${PWD}: ${RED}$d${NC}\n"
            python3 -m pytest --cov --cov-report=term-missing --cov-report "xml:./$(basename "${PWD}").coverage.xml"
            mv *.coverage.xml $COVERAGE_REPORTS
          else
            printf "${YELLOW}$d${NC}\n"
            process_test "$d"
          fi
        fi
      done
      cd .. || return
    fi
  fi
}
#process_requirements "lambda/"
process_test "lambda/"
#echo "${PWD}"
#which pip
#for d in */ ; do
#  echo $d
#done