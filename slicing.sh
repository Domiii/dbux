#!/usr/bin/env bash

# NOTE: This script is used for developing the slicing feature, to quickly run some tests

set -e # cancel on error
# set -x # verbose echo mode

fname="functions1"
nodeArgs=""

dbuxCmd="$1"
if [ $dbuxCmd = "" ]
then
  dbuxCmd="r"
fi
isInstrument=$([[ $dbuxCmd == "i" ]] && echo 1 || echo 0)

if [[ "$2" = "d" ]]
then
  nodeArgs="--inspect-brk "
fi

if [ $dbuxCmd = "i" ]
then
  outPath="./samples/__samplesInput__/$fname.inst.js"
else
  outPath=""
fi

# x=$(( $isInstrument ))
# echo "$dbuxCmd i:$isInstrument x:$x"

node $nodeArgs--enable-source-maps --stack-trace-limit=100 "./node_modules/@dbux/cli/bin/dbux.js" $dbuxCmd --esnext "./samples/__samplesInput__/$fname.js" $outPath

if (( $isInstrument ))
then
  code $outPath
fi
