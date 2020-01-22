#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const moduleAlias = require('module-alias');

const dbuxAliases = [
  'dbux-babel-plugin',
  'dbux-runtime'
];

const sharedDeps = [
  '@babel/core',
  '@babel/register',
  '@babel/preset-env'
];

const cliDir = __dirname + '/..';
const dbuxRoot = path.resolve(cliDir + '/..');
const dbuxDistDir = path.resolve(dbuxRoot + '/dist');

// add aliases (since these libraries are not locally available)
dbuxAliases.forEach(alias => moduleAlias.addAlias(alias, path.join(dbuxRoot, alias)));
sharedDeps.forEach(dep => moduleAlias.addAlias(dep, path.join(dbuxRoot, 'node_modules', dep)));

const { transformSync } = require('@babel/core');
const babelRegister = require('@babel/register');


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

// make sure, this is loaded before starting instrumentation
require('dbux-runtime');



// setup babel-register
const babelRegisterOptions = {
  ignore: [
    // '**/node_modules/**',
    function (fpath) {
      // no node_modules
      if (fpath.match('(node_modules)|(dist)')) {
        return true;
      }

      fpath = fpath.toLowerCase();

      const shouldIgnore = false;
      console.warn('dbux-run babel', fpath, !shouldIgnore);
      return shouldIgnore;
    }
  ],
  sourceMaps: 'inline',
  plugins: [
    dbuxBabelPlugin
  ],
  presets: [
    "@babel/preset-env"
  ],
  babelrcRoots
};
babelRegister(babelRegisterOptions);

// go time!
if (!path.isAbsolute(file)) {
  file = path.join(cliDir, file);
}
require(file);