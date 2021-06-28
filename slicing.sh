#!/usr/bin/env bash

# NOTE: This script is used for developing the slicing feature, to quickly run some tests

set -e # cancel on error
# set -x # verbose echo mode

# fname="slicing/var1"
# fname="calls0"
# fname="memberExpressions2"
# fname="functions3"
# fname="objectExpressions1"
# fname="updateExpressions2"
# fname="throw2"
# fname="while1"
# fname="for1"
# fname="class1"
# fname="new1"
# fname="throw2"
# fname="this1"
# fname="return2"
# fname="slicing/var3"
# fname="module1"
# fname="for-in1"
# fname="mix2"
# fname="module_exports1"
# fname="functionExpression1"
# fname="classExpression1"
# fname="params1"
# fname="eval1"
# fname="params2"
# fname="prototype1"
# fname="variableDeclarationPatterns1"
# fname="conditionalExpressions1"
# fname="memberExpressions3"
# fname="dbuxDisable1"
# fname="assignments2"
fname="defaultParams1"
# fname="params1"


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
outPath="./samples/__samplesInput__/$fname.inst.js"
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
  node $nodeArgs --enable-source-maps --stack-trace-limit=100 "./node_modules/@babel/cli/bin/babel.js" --config-file="./config/babel-presets-node.js" $inPath
else
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
