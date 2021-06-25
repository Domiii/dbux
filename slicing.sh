#!/usr/bin/env bash

# NOTE: This script is used for developing the slicing feature, to quickly run some tests

set -e # cancel on error
# set -x # verbose echo mode

# fname="slicing/var1"
# fname="calls0"
# fname="memberExpressions0"
# fname="functions3"
# fname="objectExpressions1"
# fname="updateExpressions1"
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
fname="dbuxDisable1"


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

outPath="./samples/__samplesInput__/$fname.inst.js"
# if [[ $dbuxCmd = "i" ]]
# then
# else
#   outPath=""
# fi

# x=$(( $isInstrument ))
# echo "$dbuxCmd i:$isInstrument x:$x"

if [[ "$dbuxCmd" != "rr" ]]
then
  node $nodeArgs --enable-source-maps --stack-trace-limit=100 "./node_modules/@dbux/cli/bin/dbux.js" i --esnext "./samples/__samplesInput__/$fname.js" $outPath
fi

if [[ "$dbuxCmd" = "r" ]] || [[ "$dbuxCmd" = "rr" ]]
then
  # NOTE: --enable-source-maps will mess things up when executing the raw output
  node $nodeArgs --stack-trace-limit=100 -r "@dbux/runtime" $outPath
fi

# if (( $isInstrument ))
# then
#   code $outPath
# fi
