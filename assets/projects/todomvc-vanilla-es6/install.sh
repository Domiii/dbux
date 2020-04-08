#!/usr/bin/env bash

set -e

thisDirRelative=$(dirname "$0")
thisDir=$(node -e "console.log(require('path').resolve('$thisDirRelative'))") # get absolute path using node

MonoRoot="$thisDir/../../.."

cd $MonoRoot


# cd projects/todomvc/examples/vanilla-es6
cd projects
if [[ ! -e todomvc ]]; then
  git clone https://github.com/tastejs/todomvc.git
fi
if [[ -e todomvc/.git ]]; then
  rm -rf todomvc/.git `# remove git folder`
fi
cd todomvc/examples/vanilla-es6

`# copy files (NOTE: Cygwin does not support glob-style copy)`
cp "$thisDir/files/package.json" .
cp "$thisDir/files/webpack.config.js" .
cp "$thisDir/files/nodemon.json" .

`# install default dependencies`
yarn install


`# install the good stuff`
yarn add --dev babel-loader @babel/node @babel/cli @babel/core @babel/preset-env && \
yarn add --dev webpack webpack-cli webpack-dev-server nodemon && \
yarn add core-js@3 @babel/runtime @babel/plugin-transform-runtime

`# run it!`
npm start
