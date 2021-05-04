#!/usr/bin/env bash

set -e # cancel on error
# set -x # verbose echo mode

# used for developing the slicing feature, to quickly run some tests
nodeArgs=""

if [ "$1" = "i" ]
then
  nodeArgs="--inspect-brk "
fi

node $nodeArgs--enable-source-maps --stack-trace-limit=100 ".\node_modules\@dbux\cli\bin\dbux.js" i --esnext ".\samples\__samplesInput__\nestedFunction.js"