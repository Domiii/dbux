#!/usr/bin/env node

import { transformSync } from '@babel/core';
import fs from 'fs';

// const mergeWith = require('lodash/mergeWith');
const argv = require('yargs')
  .demandOption(['file'])
  .argv;
const { file } = argv;
const inputCode = fs.readFileSync(file, 'utf8');
const plugin = require(__dirname + '/../src');


const babelOptions = {
  babelrc: false,
  configFile: false,
  filename: file,
  plugins: [
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
    //"@babel/plugin-transform-runtime"
    plugin
  ]
};

// console.warn(babelOptions.plugins.map(p => (typeof p === 'function' ? p.toString() : JSON.stringify(p)).split('\n')[0]).join(','));
const outputCode = transformSync(inputCode, babelOptions).code;
console.log(outputCode);