#!/usr/bin/env bash

# NOTE: This script is used for developing the slicing feature, to quickly run some tests

set -e # cancel on error
# set -x # verbose echo mode

# fname="__samplesInput__/error-async4-catch"
fname="__samplesInput__/functionExpression2"




thisDirRelative=$(dirname "$0")
rootDir=$(node -e "console.log(require('path').resolve('$thisDirRelative'))") # get absolute path using node

nodeArgsAlways="--stack-trace-limit=100"
nodeArgs=""

# dbuxArgs="--esnext"
dbuxArgs=""
dbuxArgsI=""

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

if [[ "$2" = "td" || "$3" = "td" ]]
then
  dbuxArgsI='--runtime={"tracesDisabled":1}'
fi

if [[ $dbuxCmd = "i" ]]
then
  nodeArgsI="$nodeArgsAlways $nodeArgs"
  nodeArgsR="$nodeArgsAlways"
else
  nodeArgsI="$nodeArgsAlways"
  nodeArgsR="$nodeArgsAlways $nodeArgs"
fi

# echo "i $nodeArgsI r $nodeArgsR ($nodeArgs, $2)"

inPath="$rootDir/samples/$fname.js"
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
  outPath="$rootDir/samples/$fname.$babelTarget.js"
  node $nodeArgs --enable-source-maps "$rootDir/node_modules/@babel/cli/bin/babel.js" --config-file="$rootDir/config/babel-presets-$babelTarget.js" $inPath --out-file="$outPath"
  echo "Babeled ($babelTarget): $outPath"
else
  outPath="$rootDir/samples/$fname.inst.js"
  if [[ "$dbuxCmd" != "rr" ]] && [[ "$dbuxCmd" != "rrr" ]]
  then
    # instrument
    node $nodeArgsI --enable-source-maps "$rootDir/node_modules/@dbux/cli/bin/dbux.js" i $dbuxArgs $dbuxArgsI $inPath $outPath
  fi

  if [[ "$dbuxCmd" = "rrr" ]]
  then
    node $nodeArgsR --enable-source-maps "$rootDir/node_modules/@dbux/cli/bin/dbux.js" r $dbuxArgs $dbuxArgsI $inPath
    # run with @babel/register
  elif [[ "$dbuxCmd" = "r" ]] || [[ "$dbuxCmd" = "rr" ]]
  then
    # run
    node $nodeArgsR -r "@dbux/runtime" $outPath
  fi
fi

# if (( $isInstrument ))
# then
#   code $outPath
# fi
