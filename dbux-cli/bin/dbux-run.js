#!/usr/bin/env node

const toEs5 = true;

const { transformSync } = require('@babel/core');
const fs = require('fs');
const path = require('path');
const importFrom = require('import-from');

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

const cliDir = path.resolve(__dirname + '/..');
const dbuxRoot = path.resolve(cliDir + '/..');

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
const babelRegister = require('@babel/register');
babelRegister(babelRegisterOptions);

// go time!
if (!path.isAbsolute(file)) {
  file = path.join(cliDir, file);
}
require(file);