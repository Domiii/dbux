#!/usr/bin/env bash

# cd projects/todomvc/examples/vanilla-es6

if [[ ! -e projects ]]; then
  mkdir -r projects
fi
cd projects
if [[ ! -e todomvc ]]; then
  git clone https://github.com/tastejs/todomvc.git
fi
cd todomvc/examples/vanilla-es6 && \
rm -rf ../../.git `# remove git folder` \
npm install && \
\
`# copy files` \
cp ../../../../assets/projects/todomvc-vanilla-es6/{webpack.config.js,package.json} . && \
\
`# install the good stuff` \
npm i -D babel-loader  @babel/node @babel/cli @babel/core webpack webpack-cli webpack-dev-server && \
npm i -D  @babel/preset-env && \
npm i -S core-js@3 @babel/runtime @babel/plugin-transform-runtime && \
npm i -D ../../../../dbux-common ../../../../dbux-babel-plugin ../../../../dbux-runtime && \
\
`# run it!`\
npm start