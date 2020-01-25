#!/usr/bin/env bash

set -e

thisDirRelative=$(dirname "$0")
thisDir=$(node -e "console.log(require('path').resolve('$thisDirRelative'))") # get absolute path using node

cd "$thisDir/../../.."


# cd projects/todomvc/examples/vanilla-es6
if [[ ! -e projects ]]; then
  mkdir projects
fi
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

`# install default dependencies`
yarn install


`# install the good stuff`
yarn add --dev babel-loader  @babel/node @babel/cli @babel/core webpack webpack-cli webpack-dev-server extra-watch-webpack-plugin && \
yarn add --dev @babel/preset-env && \
yarn add core-js@3 @babel/runtime @babel/plugin-transform-runtime

`# run it!`
npm start
