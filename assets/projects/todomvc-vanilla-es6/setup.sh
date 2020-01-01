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
npm install


`# install the good stuff`
npm i -D babel-loader  @babel/node @babel/cli @babel/core webpack webpack-cli webpack-dev-server && \
npm i -D  @babel/preset-env && \
npm i -S core-js@3 @babel/runtime @babel/plugin-transform-runtime && \
npm i -D ../../../../dbux-common ../../../../dbux-babel-plugin ../../../../dbux-runtime

`# run it!`
npm start
