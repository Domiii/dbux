#!/usr/bin/env bash

# cd projects/todomvc/examples/vanilla-es6

if [[ ! -e projects ]]; then
  mkdir -r projects
fi
cd projects && \
git clone https://github.com/tastejs/todomvc.git && \
cd todomvc/examples/vanilla-es6 && \
rm -rf ../../.git `# remove git folder` \
npm install && \
\
`# instrumentation here` \
cp ../../../../assets/projects/todomvc-vanilla-es6/* . && \
npm i -D babel-loader  @babel/node @babel/cli @babel/core webpack webpack-cli webpack-dev-server && \
npm i -D  @babel/preset-env && \
npm i -S core-js@3 @babel/runtime @babel/plugin-transform-runtime && \
npm i -D ../../../../dbux-common ../../../../dbux-babel-plugin ../../../../dbux-runtime && \
npm start