#!/usr/bin/env node

const toEs5 = true;

const cliDir = __dirname + '/..';
let dbuxRoot = cliDir + '/..';

// const { transformSync } = require('@babel/core');
const sharedDeps = [
  '@babel/core',
  '@babel/register',
  '@babel/preset-env'
];

const fs = require('fs');
const path = require('path');

const importFrom = require('import-from');

sharedDeps.forEach(dep => importFrom(__dirname + '/node_modules', dep));

const { transformSync } = require('@babel/core');
const babelRegister = require('@babel/register');


// const mergeWith = require('lodash/mergeWith');
const argv = require('yargs')
  .command('$0 <file>')
  // .positional('file')
  .argv;
let { file } = argv;
const inputCode = fs.readFileSync(file, 'utf8');


dbuxRoot = path.resolve(dbuxRoot);

const babelrcRoots = [
  `${file}/..`,
  `${file}/../..`
];

const dbuxBabelPlugin = require(dbuxRoot + '/dbux-babel-plugin/src/babelInclude').default;

// make sure, everything is ready and in place
console.log(dbuxRoot);
importFrom(cliDir, 'dbux-common');
importFrom(cliDir, 'dbux-data');
importFrom(cliDir, 'dbux-runtime');


// setup babel-register
const babelRegisterOptions = {
  ignore: [
    // '**/node_modules/**',
    function (fpath) {
      // no node_modules
      if (fpath.match('node_modules')) {
        return true;
      }

      fpath = fpath.toLowerCase();

      const shouldIgnore = false;
      console.warn('babel', fpath, !shouldIgnore);
      return shouldIgnore;
    }
  ],
  sourceMaps: true,
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