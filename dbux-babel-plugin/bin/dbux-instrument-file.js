#!/usr/bin/env node

const toEs5 = true;

import { transformSync } from '@babel/core';
import fs from 'fs';

// const mergeWith = require('lodash/mergeWith');
const argv = require('yargs')
  .demandOption(['file'])
  .argv;
const { file } = argv;
const inputCode = fs.readFileSync(file, 'utf8');


const dbuxBabelPlugin = require(__dirname + '/../src/babelInclude');


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

if (toEs5) {
  babelOptions.presets = [[
    "@babel/preset-env",
    {
      "loose": true,
      "useBuiltIns": "usage",
      "corejs": 3
    }
  ]];
}

console.log('Instrumenting file', file, '...');

// console.warn(babelOptions.plugins.map(p => (typeof p === 'function' ? p.toString() : JSON.stringify(p)).split('\n')[0]).join(','));
const outputCode = transformSync(inputCode, babelOptions).code;
console.log(outputCode);