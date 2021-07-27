#!/usr/bin/env bash

# NOTE: This script is used for developing the slicing feature, to quickly run some tests

set -e # cancel on error
# set -x # verbose echo mode

# fname="__samplesInput__/async/promise2"
# fname="__samplesInput__/setTimeout0"
fname="__samplesInput__/class6"
# fname="case-studies/async/producer_consumer/producer_consumer_async"




nodeArgs=""

dbuxArgs="--esnext"
# dbuxArgs=""
dbuxCmd="$1"
if [[ $dbuxCmd = "" ]]
then
  dbuxCmd="r"
fi
isInstrument=$([[ $dbuxCmd == "i" ]] && echo 1 || echo 0)

if [[ "$2" = "d" || "$3" = "d" ]]
then
  nodeArgs="${nodeArgs} --inspect-brk"
fi

if [[ "$2" = "sm" || "$3" = "sm" ]]
then
  # NOTE: --enable-source-maps can mess things up when executing the raw output
  nodeArgs="${nodeArgs} --enable-source-maps"
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

inPath="./samples/$fname.js"
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
  # babelTarget="es5"
  babelTarget="node"
  outPath="./samples/$fname.$babelTarget.js"
  node $nodeArgs --enable-source-maps --stack-trace-limit=100 "./node_modules/@babel/cli/bin/babel.js" --config-file="./config/babel-presets-$babelTarget.js" $inPath --out-file="$outPath"
  echo "Babeled ($babelTarget): $outPath"
else
  outPath="./samples/$fname.inst.js"
  if [[ "$dbuxCmd" != "rr" ]]
  then
    # instrument
    node $nodeArgsI --enable-source-maps --stack-trace-limit=100 "./node_modules/@dbux/cli/bin/dbux.js" i $dbuxArgs $inPath $outPath
  fi

  if [[ "$dbuxCmd" = "r" ]] || [[ "$dbuxCmd" = "rr" ]]
  then
    # run
    node $nodeArgsR --stack-trace-limit=100 -r "@dbux/runtime" $outPath
  fi
fi

# if (( $isInstrument ))
# then
#   code $outPath
# fi
