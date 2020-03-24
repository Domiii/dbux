#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const moduleAlias = require('module-alias');
const process = require('process');
const prettier = require("prettier");
process.env.BABEL_DISABLE_CACHE = 1;


const cliDir = __dirname + '/..';
const dbuxRoot = path.resolve(cliDir + '/..');

const dbuxAliases = [
  'dbux-babel-plugin'
];

const sharedDeps = [
  '@babel/core',
  '@babel/preset-env'
];

// add aliases (since these libraries are not locally available)
dbuxAliases.forEach(alias => moduleAlias.addAlias(alias, path.join(dbuxRoot, alias)));
sharedDeps.forEach(dep => moduleAlias.addAlias(dep, path.join(dbuxRoot, 'node_modules', dep)));


const dbuxBabelPlugin = require('dbux-babel-plugin');
const cliBabelOptions = require(path.join(cliDir, 'babel.config.js'));

// preset-env by default converts to es5 -> so we delete it (for now)
delete cliBabelOptions.presets;

cliBabelOptions.plugins.push(dbuxBabelPlugin);
cliBabelOptions.sourceMaps = false;
cliBabelOptions.retainLines = true;

const { transformSync } = require('@babel/core');


// const mergeWith = require('lodash/mergeWith');
const argv = require('yargs')
  .command('$0 <file>')
  // .positional('file')
  .argv;
let { file } = argv;
const inputCode = fs.readFileSync(file, 'utf8');

console.log('Instrumenting file', file, '...');

// console.warn(babelOptions.plugins.map(p => (typeof p === 'function' ? p.toString() : JSON.stringify(p)).split('\n')[0]).join(','));
const outputCode = transformSync(inputCode, cliBabelOptions).code;


console.log(
  prettier.format(outputCode)
);