#!/usr/bin/env bash

# NOTE: This script is used for developing the slicing feature, to quickly run some tests

set -e # cancel on error
# set -x # verbose echo mode

fname="arrays1"


nodeArgs=""

dbuxCmd="$1"
if [[ $dbuxCmd = "" ]]
then
  dbuxCmd="r"
fi
isInstrument=$([[ $dbuxCmd == "i" ]] && echo 1 || echo 0)

if [[ "$2" = "d" ]]
then
  nodeArgs="${nodeArgs} --inspect-brk"
else
  nodeArgs="${nodeArgs}"
fi

if [[ $dbuxCmd = "i" ]]
then
  nodeArgsI="$nodeArgs"
  nodeArgsR=""
else
  nodeArgsI=""
  nodeArgsR="$nodeArgs"
fi

# echo "i $nodeArgsI r $nodeArgsR ($nodeArgs, $2)"

inPath="./samples/__samplesInput__/$fname.js"
# if [[ $dbuxCmd = "i" ]]
# then
# else
#   outPath=""
# fi

# x=$(( $isInstrument ))
# echo "$dbuxCmd i:$isInstrument x:$x"

if [[ "$dbuxCmd" == "b" ]]
then
  # babel
  outPath="./samples/__samplesInput__/$fname.es5.js"
  node $nodeArgs --enable-source-maps --stack-trace-limit=100 "./node_modules/@babel/cli/bin/babel.js" --config-file="./config/babel-es5.js" $inPath --out-file="$outPath"
  echo "Babel ES5: $outPath"
else
  outPath="./samples/__samplesInput__/$fname.inst.js"
  if [[ "$dbuxCmd" != "rr" ]]
  then
    # instrument
    node $nodeArgsI --enable-source-maps --stack-trace-limit=100 "./node_modules/@dbux/cli/bin/dbux.js" i --esnext $inPath $outPath
  fi

  if [[ "$dbuxCmd" = "r" ]] || [[ "$dbuxCmd" = "rr" ]]
  then
    # run
    # NOTE: --enable-source-maps will mess things up when executing the raw output
    node $nodeArgsR --stack-trace-limit=100 -r "@dbux/runtime" $outPath
  fi
fi

# if (( $isInstrument ))
# then
#   code $outPath
# fi
