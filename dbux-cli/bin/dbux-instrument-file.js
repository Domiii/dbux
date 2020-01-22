#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const moduleAlias = require('module-alias');

const dbuxAliases = [
  'dbux-babel-plugin'
];

const sharedDeps = [
  '@babel/core',
  '@babel/preset-env'
];

const cliDir = __dirname + '/..';
const dbuxRoot = path.resolve(cliDir + '/..');
const dbuxDistDir = path.resolve(dbuxRoot + '/dist');

// add aliases (since these libraries are not locally available)
dbuxAliases.forEach(alias => moduleAlias.addAlias(alias, path.join(dbuxRoot, alias, 'dist/bundle.js')));
sharedDeps.forEach(dep => moduleAlias.addAlias(dep, path.join(dbuxRoot, 'node_modules', dep)));

const { transformSync } = require('@babel/core');


// const mergeWith = require('lodash/mergeWith');
const argv = require('yargs')
  .command('$0 <file>')
  // .positional('file')
  .argv;
let { file } = argv;
const inputCode = fs.readFileSync(file, 'utf8');


const babelrcRoots = [
  `${file}/..`,
  `${file}/../..`
];

const dbuxBabelPlugin = require('dbux-babel-plugin');

const babelOptions = {
  ignore: ['node_modules'],
  babelrc: false,
  configFile: false,
  filename: file,
  plugins: [
    dbuxBabelPlugin,
    [ 
      "@babel/plugin-proposal-class-properties",
      {
        "loose": true
      }
    ],
    "@babel/plugin-proposal-optional-chaining",
    [
      "@babel/plugin-proposal-decorators",
      {
        "legacy": true
      }
    ],
    "@babel/plugin-proposal-function-bind",
    "@babel/plugin-syntax-export-default-from",
    "@babel/plugin-syntax-dynamic-import",
    "@babel/plugin-syntax-flow",
    //"@babel/plugin-transform-runtime"
    
  ]
};

// if (toEs5) {
//   babelOptions.presets = [[
//     "@babel/preset-env",
//     {
//       "loose": true,
//       "useBuiltIns": "usage",
//       "corejs": 3
//     }
//   ]];
// }

console.log('Instrumenting file', file, '...');

// console.warn(babelOptions.plugins.map(p => (typeof p === 'function' ? p.toString() : JSON.stringify(p)).split('\n')[0]).join(','));
const outputCode = transformSync(inputCode, babelOptions).code;

console.log(outputCode);