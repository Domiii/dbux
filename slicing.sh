#!/usr/bin/env bash

set -e # cancel on error
# set -x # verbose echo mode

# used for developing the slicing feature, to quickly run some tests
nodeArgs=""

dbuxCmd="$1"
if [ $dbuxCmd = "" ]
then
  dbuxCmd="run"
fi

if [ "$2" = "d" ]
then
  nodeArgs="--inspect-brk "
fi

node $nodeArgs--enable-source-maps --stack-trace-limit=100 ".\node_modules\@dbux\cli\bin\dbux.js" $dbuxCmd --esnext ".\samples\__samplesInput__\function0.js"