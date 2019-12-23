#!/usr/bin/env bash

set -e

if [ $# -ne 1 ]; then
  echo "$BASH_SOURCE - invalid arguments"
  exit -1
fi

rootDir="$(dirname "$BASH_SOURCE")/../.."
cd "$rootDir/dbux-babel-plugin"
npx babel $1  --plugins=./src/babelInclude --out-dir="$rootDir/_testOut"