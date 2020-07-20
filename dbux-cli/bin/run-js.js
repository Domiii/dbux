#!/usr/bin/env node

const path = require('path');
const moduleAlias = require('module-alias');
const process = require('process');

process.env.BABEL_DISABLE_CACHE = 1;


const cliDir = path.join(__dirname, '..');
const dbuxRoot = path.resolve(cliDir + '/..');

// const dbuxAliases = [
//   '@dbux/runtime'
// ];

const sharedDeps = [
  '@babel/core',
  '@babel/preset-env'
];

// add aliases (since these libraries are not locally available)
// dbuxAliases.forEach(alias => moduleAlias.addAlias(alias, path.join(dbuxRoot, alias)));
sharedDeps.forEach(dep => moduleAlias.addAlias(dep, path.join(dbuxRoot, 'node_modules', dep)));



// const mergeWith = require('lodash/mergeWith');
const argv = require('yargs')
  .command('$0 <file>')
  // .positional('file')
  .argv;
let { file } = argv;


const babelrcRoots = [
  `${file}/..`,
  `${file}/../..`
];

const babelRegister = require('@babel/register');



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